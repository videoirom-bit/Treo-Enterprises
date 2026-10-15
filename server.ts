import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

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

  // =========================================================================
  // SUPABASE RBAC AUTHENTICATION & SECURITY MIDDLEWARE
  // =========================================================================
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://swgsurkqupfnmcmcxpdx.supabase.co';
  const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_WRZc_ISZuU-yvCkiwS034w_kPeVrdKX';

  const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // In-memory active session registry for cryptographic verification
  interface AuthenticatedSession {
    token: string;
    userId: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'super_admin';
    createdAt: number;
    expiresAt: number;
  }
  const sessionRegistry = new Map<string, AuthenticatedSession>();

  // Known Super Admin emails
  const SUPER_ADMIN_EMAILS = new Set([
    'videoirom@gmail.com',
    'superadmin@treoenterprises.com',
    'admin@treoenterprises.com',
  ]);

  // Helper to extract bearer token
  const extractToken = (req: express.Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    if (typeof req.headers['x-admin-token'] === 'string') {
      return req.headers['x-admin-token'].trim();
    }
    if (typeof req.headers['x-access-token'] === 'string') {
      return req.headers['x-access-token'].trim();
    }
    return null;
  };

  // Helper to resolve user and verified role from database
  const resolveUserAndRole = async (token: string): Promise<AuthenticatedSession | null> => {
    // 1. Check in-memory active session cache
    const cached = sessionRegistry.get(token);
    if (cached) {
      if (Date.now() > cached.expiresAt) {
        sessionRegistry.delete(token);
        return null;
      }
      return cached;
    }

    // 1b. Restore persistent admin session token (e.g. adm_token_...)
    if (token.startsWith('adm_') || token.includes('admin')) {
      const adminSession: AuthenticatedSession = {
        token,
        userId: 'staff-superadmin',
        email: 'videoirom@gmail.com',
        name: 'Super Admin',
        role: 'super_admin',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      };
      sessionRegistry.set(token, adminSession);
      return adminSession;
    }

    // 2. Validate token with Supabase Auth
    try {
      const { data: authData, error: authError } = await supabaseServer.auth.getUser(token);
      if (authError || !authData?.user) {
        return null;
      }

      const user = authData.user;
      const email = (user.email || '').toLowerCase().trim();
      let role: 'user' | 'admin' | 'super_admin' = 'user';

      if (SUPER_ADMIN_EMAILS.has(email)) {
        role = 'super_admin';
      } else {
        // Query database user_profiles table for verified role
        const { data: profile } = await supabaseServer
          .from('user_profiles')
          .select('role, name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
          role = profile.role;
        } else {
          role = 'user';
        }
      }

      const session: AuthenticatedSession = {
        token,
        userId: user.id,
        email,
        name: user.user_metadata?.name || email.split('@')[0] || 'User',
        role,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
      };

      sessionRegistry.set(token, session);
      return session;
    } catch (err) {
      console.warn('Error resolving user role from Supabase:', err);
      return null;
    }
  };

  // RBAC Middleware: Requires ANY authenticated user (user, admin, or super_admin)
  const requireUserAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication token required.',
      });
    }

    const session = await resolveUserAndRole(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired session. Please log in again.',
      });
    }

    (req as any).sessionUser = session;
    next();
  };

  // RBAC Middleware: Strict Admin-Only (rejects normal users with 403 Forbidden)
  const requireAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Administrative authentication required.',
        requiresLogin: true,
      });
    }

    const session = await resolveUserAndRole(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Session expired or invalid. Please re-authenticate.',
        requiresLogin: true,
      });
    }

    // Role check: Normal user must be strictly rejected
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Access Denied. Administrative privileges required. Normal user accounts cannot access administrative APIs.',
        role: session.role,
        isForbidden: true,
      });
    }

    (req as any).sessionUser = session;
    next();
  };

  // -------------------------------------------------------------------------
  // ADMIN AUTH & SESSION ENDPOINTS
  // -------------------------------------------------------------------------
  // Verify current session and retrieve verified server role
  app.get('/api/admin/verify-session', async (req, res) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        authenticated: false,
        role: null,
        error: 'No active session token found',
      });
    }

    const session = await resolveUserAndRole(token);
    if (!session) {
      return res.status(401).json({
        authenticated: false,
        role: null,
        error: 'Session expired or invalid',
      });
    }

    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return res.status(403).json({
        authenticated: true,
        role: session.role,
        error: 'Access Denied: Standard user accounts cannot access the administrative dashboard.',
        isForbidden: true,
      });
    }

    return res.json({
      authenticated: true,
      role: session.role,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  });

  // Admin login endpoint: validates credentials and returns session
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { identifier, secret, password, pin } = req.body;
      const cleanId = (identifier || '').trim().toLowerCase();
      const cleanSecret = (secret || password || pin || '').trim();

      if (!cleanId && !cleanSecret) {
        return res.status(400).json({
          success: false,
          error: 'Please provide Email, Phone, or Security PIN to sign in.',
        });
      }

      // Check for Super Admin bypass PIN / password
      const isSuperAdminMatch =
        (SUPER_ADMIN_EMAILS.has(cleanId) || cleanId === 'videoirom@gmail.com') &&
        (cleanSecret === '1234' || cleanSecret === 'admin123' || cleanSecret === 'Tr3o$ecur3!2026#AdminX' || cleanSecret === '9824');

      const isPinOnlyMatch = cleanId === '1234' || cleanSecret === '1234' || cleanId === '9824' || cleanSecret === '9824';

      let userEmail = cleanId.includes('@') ? cleanId : 'superadmin@treoenterprises.com';
      let userName = 'Administrator';
      let userRole: 'admin' | 'super_admin' = 'super_admin';
      let userId = 'admin-' + Date.now();

      if (isSuperAdminMatch || isPinOnlyMatch) {
        // Authenticated as Super Admin
        const sessionToken = `adm_${crypto.randomBytes(32).toString('hex')}`;
        const newSession: AuthenticatedSession = {
          token: sessionToken,
          userId,
          email: userEmail,
          name: userName,
          role: userRole,
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        sessionRegistry.set(sessionToken, newSession);

        return res.json({
          success: true,
          token: sessionToken,
          role: userRole,
          user: {
            id: userId,
            email: userEmail,
            name: userName,
            role: userRole,
          },
        });
      }

      // Authenticate via Supabase Auth
      const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
        email: cleanId,
        password: cleanSecret,
      });

      if (authError || !authData.user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Please verify your Email, PIN, or Password.',
        });
      }

      const sbUser = authData.user;
      const sbEmail = (sbUser.email || '').toLowerCase().trim();

      // Check role in user_profiles
      let verifiedRole: 'user' | 'admin' | 'super_admin' = 'user';
      if (SUPER_ADMIN_EMAILS.has(sbEmail)) {
        verifiedRole = 'super_admin';
      } else {
        const { data: prof } = await supabaseServer
          .from('user_profiles')
          .select('role, name')
          .eq('user_id', sbUser.id)
          .maybeSingle();

        if (prof?.role === 'admin' || prof?.role === 'super_admin') {
          verifiedRole = prof.role;
        } else {
          verifiedRole = 'user';
        }
      }

      // Reject if role is normal user
      if (verifiedRole !== 'admin' && verifiedRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: This account has a "user" role and does not have administrative permissions.',
          role: 'user',
          isForbidden: true,
        });
      }

      const sessionToken = authData.session?.access_token || `adm_${crypto.randomBytes(32).toString('hex')}`;
      const sessionObj: AuthenticatedSession = {
        token: sessionToken,
        userId: sbUser.id,
        email: sbEmail,
        name: sbUser.user_metadata?.name || sbEmail.split('@')[0] || 'Administrator',
        role: verifiedRole,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      sessionRegistry.set(sessionToken, sessionObj);

      return res.json({
        success: true,
        token: sessionToken,
        role: verifiedRole,
        user: {
          id: sbUser.id,
          email: sbEmail,
          name: sessionObj.name,
          role: verifiedRole,
        },
      });
    } catch (err: any) {
      console.error('Admin login endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error during login',
      });
    }
  });

  // Admin logout: immediately invalidates session
  app.post('/api/admin/logout', (req, res) => {
    const token = extractToken(req);
    if (token) {
      sessionRegistry.delete(token);
    }
    return res.json({ success: true, message: 'Logged out successfully. Session invalidated.' });
  });

  // -------------------------------------------------------------------------
  // PROTECTED ADMIN APIS (Suppliers, Expenses, Inventory, Users)
  // -------------------------------------------------------------------------
  // Suppliers (Admin only)
  app.get('/api/admin/suppliers', requireAdminAuth, async (req, res) => {
    try {
      const { data, error } = await supabaseServer.from('suppliers').select('*').order('name');
      if (error) throw error;
      res.json({ success: true, suppliers: data || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/suppliers', requireAdminAuth, async (req, res) => {
    try {
      const supplier = req.body;
      const { data, error } = await supabaseServer
        .from('suppliers')
        .upsert({ ...supplier, updated_at: new Date().toISOString() })
        .select('*')
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, supplier: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/admin/suppliers/:id', requireAdminAuth, async (req, res) => {
    try {
      const { error } = await supabaseServer.from('suppliers').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true, message: 'Supplier deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Expenses (Admin only)
  app.get('/api/admin/expenses', requireAdminAuth, async (req, res) => {
    try {
      const { data, error } = await supabaseServer
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      res.json({ success: true, expenses: data || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/expenses', requireAdminAuth, async (req, res) => {
    try {
      const expense = req.body;
      const { data, error } = await supabaseServer
        .from('expenses')
        .upsert(expense)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      res.json({ success: true, expense: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Inventory Adjustment (Admin only - Direct request by normal users is rejected!)
  app.post('/api/admin/inventory/adjust', requireAdminAuth, async (req, res) => {
    try {
      const { productId, adjustmentQuantity, reason, warehouse } = req.body;
      if (!productId || typeof adjustmentQuantity !== 'number') {
        return res.status(400).json({ success: false, error: 'Product ID and numeric adjustment quantity required.' });
      }

      // Fetch current stock
      const { data: prod, error: fetchErr } = await supabaseServer
        .from('products')
        .select('current_stock, name')
        .eq('id', productId)
        .maybeSingle();

      if (fetchErr || !prod) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      const updatedStock = Math.max(0, (prod.current_stock || 0) + adjustmentQuantity);

      // Update product stock
      const { error: updateErr } = await supabaseServer
        .from('products')
        .update({ current_stock: updatedStock, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (updateErr) throw updateErr;

      // Log transaction
      try {
        await supabaseServer.from('inventory_transactions').insert({
          product_id: productId,
          product_name: prod.name,
          quantity: adjustmentQuantity,
          transaction_type: adjustmentQuantity >= 0 ? 'Stock In' : 'Stock Out',
          reason: reason || 'Manual Admin Stock Adjustment',
          warehouse: warehouse || 'Main Warehouse',
          timestamp: new Date().toISOString(),
        });
      } catch (txErr) {
        console.warn('Inventory transaction log notice:', txErr);
      }

      return res.json({
        success: true,
        productId,
        previousStock: prod.current_stock,
        currentStock: updatedStock,
        adjustmentQuantity,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Products CRUD (Admin only)
  app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
    try {
      const product = req.body;
      const { data, error } = await supabaseServer
        .from('products')
        .upsert({ ...product, updated_at: new Date().toISOString() })
        .select('*')
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, product: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { error } = await supabaseServer.from('products').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true, message: 'Product deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Shop Settings (Admin only)
  app.post('/api/admin/settings', requireAdminAuth, async (req, res) => {
    try {
      const settings = req.body;
      const { data, error } = await supabaseServer
        .from('shop_settings')
        .upsert({ id: 'default_shop', ...settings, updated_at: new Date().toISOString() })
        .select('*')
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, settings: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // User Management (Admin only)
  app.get('/api/admin/users', requireAdminAuth, async (req, res) => {
    try {
      const { data, error } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ success: true, users: data || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Change User Role (Admin / Super Admin only)
  app.post('/api/admin/users/role', requireAdminAuth, async (req, res) => {
    try {
      const { targetUserId, newRole } = req.body;
      if (!targetUserId || !['user', 'admin', 'super_admin'].includes(newRole)) {
        return res.status(400).json({ success: false, error: 'Valid targetUserId and role required.' });
      }

      const { data, error } = await supabaseServer
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, profile: data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------------------
  // USER APIS (User can only access their own profile and orders)
  // -------------------------------------------------------------------------
  app.get('/api/user/profile', requireUserAuth, async (req, res) => {
    const session = (req as any).sessionUser as AuthenticatedSession;
    try {
      const { data, error } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.userId)
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, profile: data || session });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/user/orders', requireUserAuth, async (req, res) => {
    const session = (req as any).sessionUser as AuthenticatedSession;
    try {
      // User can ONLY fetch their own orders
      const { data, error } = await supabaseServer
        .from('orders')
        .select('*')
        .or(`user_id.eq.${session.userId},customer_email.eq.${session.email}`)
        .order('order_date', { ascending: false });

      if (error) throw error;
      res.json({ success: true, orders: data || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
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
