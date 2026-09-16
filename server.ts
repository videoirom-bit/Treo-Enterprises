import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests with higher limit for image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Treo Enterprises API Server',
      timestamp: new Date().toISOString(),
    });
  });

  // Razorpay Gateway Configuration & Status
  app.get('/api/payment/razorpay/config', (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || null;
    const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET?.trim());
    const isConfigured = Boolean(keyId && hasSecret);

    let mode: 'live' | 'test' | 'unconfigured' = 'unconfigured';
    if (isConfigured) {
      mode = keyId?.startsWith('rzp_live_') ? 'live' : 'test';
    }

    res.json({
      success: true,
      isConfigured,
      keyId, // Only public Key ID is sent to the client, never secret
      mode,
      currency: 'INR',
    });
  });

  // Razorpay Create Order Endpoint
  app.post('/api/payment/razorpay/create-order', async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, notes, customer } = req.body;

      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid numeric amount in INR is required',
        });
      }

      const amountInPaise = Math.round(Number(amount) * 100);
      const keyId = process.env.RAZORPAY_KEY_ID?.trim();
      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

      // If credentials exist, create order via official Razorpay Orders API
      if (keyId && keySecret) {
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const orderPayload = {
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes: {
            customer_name: customer?.name || 'Customer',
            customer_phone: customer?.mobile || '',
            ...(notes || {}),
          },
        };

        const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        });

        const data = await razorpayResponse.json();

        if (!razorpayResponse.ok) {
          console.error('Razorpay Orders API error:', data);
          return res.status(razorpayResponse.status).json({
            success: false,
            error: data.error?.description || 'Razorpay order creation failed',
            details: data,
          });
        }

        return res.json({
          success: true,
          order: data,
          keyId,
          isSandbox: false,
        });
      }

      // If keys are not yet configured in environment variables, provide simulated order for sandbox testing
      const simulatedOrderId = `order_sim_${Date.now()}`;
      return res.json({
        success: true,
        order: {
          id: simulatedOrderId,
          entity: 'order',
          amount: amountInPaise,
          amount_paid: 0,
          amount_due: amountInPaise,
          currency: 'INR',
          receipt: receipt || `rcpt_${Date.now()}`,
          status: 'created',
          attempts: 0,
          notes: notes || {},
          created_at: Math.floor(Date.now() / 1000),
        },
        keyId: 'rzp_test_simulated_key',
        isSandbox: true,
        message: 'Running in simulated mode. Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for live transactions.',
      });
    } catch (err: any) {
      console.error('Create Razorpay order exception:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while creating payment order',
      });
    }
  });

  // Razorpay Verify Signature Endpoint
  app.post('/api/payment/razorpay/verify-payment', (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isSandbox } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          verified: false,
          error: 'Missing order ID or payment ID',
        });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

      // If real secret is configured and not a sandbox simulated order
      if (keySecret && !isSandbox) {
        if (!razorpay_signature) {
          return res.status(400).json({
            success: false,
            verified: false,
            error: 'Missing payment signature from gateway',
          });
        }

        const generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        const isMatch = generatedSignature === razorpay_signature;

        if (isMatch) {
          return res.json({
            success: true,
            verified: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
          });
        } else {
          return res.status(400).json({
            success: false,
            verified: false,
            error: 'Razorpay HMAC signature verification failed. Possible tampering.',
          });
        }
      }

      // Sandbox or test simulation verification
      return res.json({
        success: true,
        verified: true,
        isSandbox: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        message: 'Payment verified in simulated test mode.',
      });
    } catch (err: any) {
      console.error('Verify Razorpay payment exception:', err);
      return res.status(500).json({
        success: false,
        verified: false,
        error: err.message || 'Internal server error while verifying payment',
      });
    }
  });

  // Razorpay Webhook Receiver
  app.post('/api/payment/razorpay/webhook', (req, res) => {
    const webhookSignature = req.headers['x-razorpay-signature'];
    console.log('Razorpay webhook event received:', req.body?.event, 'Signature:', webhookSignature ? 'Present' : 'None');
    // Webhook acknowledged
    res.json({ status: 'ok', received: true });
  });

  // Custom Banner Upload Endpoint
  app.post('/api/upload-banner', (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No imageBase64 data provided' });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const pubDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(pubDir)) {
        fs.mkdirSync(pubDir, { recursive: true });
      }

      fs.writeFileSync(path.join(pubDir, 'hero-banner.jpg'), buffer);
      fs.writeFileSync(path.join(pubDir, 'WhatsApp Image 2026-09-17 at 12.53.09 AM.jpeg'), buffer);

      const distDir = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, 'hero-banner.jpg'), buffer);
        fs.writeFileSync(path.join(distDir, 'WhatsApp Image 2026-09-17 at 12.53.09 AM.jpeg'), buffer);
      }

      console.log('Successfully updated banner image in public and dist directories');
      return res.json({ success: true, url: `/hero-banner.jpg?t=${Date.now()}` });
    } catch (err: any) {
      console.error('Failed to upload banner image:', err);
      return res.status(500).json({ error: err.message || 'Failed to save banner image' });
    }
  });

    // Explicitly serve static files from public directory
    app.use(express.static(path.join(process.cwd(), 'public')));

    // Vite middleware for development vs static build in production
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
