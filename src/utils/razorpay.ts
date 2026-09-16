// Razorpay Payment Gateway Client Utility

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayGatewayConfig {
  success: boolean;
  isConfigured: boolean;
  keyId: string | null;
  mode: 'live' | 'test' | 'unconfigured';
  currency: string;
}

export interface RazorpayOrderResult {
  success: boolean;
  order?: {
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
    [key: string]: any;
  };
  keyId?: string;
  isSandbox?: boolean;
  error?: string;
  message?: string;
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  amount: number; // in Rupees
  orderId?: string;
  shopName: string;
  shopLogo?: string;
  description?: string;
  primaryColor?: string;
  customer: {
    name: string;
    email: string;
    mobile: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  onSuccess: (response: RazorpayPaymentSuccessResponse, isSandbox?: boolean) => void;
  onFailure: (error: { code?: string; description?: string; source?: string; step?: string; reason?: string }) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the Razorpay Standard Checkout JavaScript SDK if not already present
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script from CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Fetches Razorpay configuration status from the backend server
 */
export const fetchRazorpayConfig = async (): Promise<RazorpayGatewayConfig> => {
  try {
    const res = await fetch('/api/payment/razorpay/config');
    if (!res.ok) {
      throw new Error(`Config request failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Error fetching Razorpay config:', err);
    return {
      success: false,
      isConfigured: false,
      keyId: null,
      mode: 'unconfigured',
      currency: 'INR',
    };
  }
};

/**
 * Initiates an order on the backend server
 */
export const createRazorpayBackendOrder = async (params: {
  amount: number;
  receipt?: string;
  customer?: { name: string; mobile: string; email?: string };
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> => {
  try {
    const res = await fetch('/api/payment/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error creating backend Razorpay order:', err);
    return {
      success: false,
      error: err.message || 'Failed to connect to backend payment server',
    };
  }
};

/**
 * Verifies the payment signature on the backend server
 */
export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  isSandbox?: boolean;
}): Promise<{ success: boolean; verified: boolean; error?: string }> => {
  try {
    const res = await fetch('/api/payment/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (err: any) {
    console.error('Payment signature verification error:', err);
    return {
      success: false,
      verified: false,
      error: err.message || 'Payment verification failed',
    };
  }
};

/**
 * Triggers the Razorpay payment checkout modal
 */
export const launchRazorpayCheckout = async (options: RazorpayCheckoutOptions): Promise<void> => {
  // 1. Create order on backend
  const orderRes = await createRazorpayBackendOrder({
    amount: options.amount,
    receipt: `rcpt_${Date.now()}`,
    customer: {
      name: options.customer.name,
      mobile: options.customer.mobile,
      email: options.customer.email,
    },
    notes: {
      address: options.customer.address || '',
      city: options.customer.city || '',
      state: options.customer.state || '',
      pincode: options.customer.pincode || '',
    },
  });

  if (!orderRes.success || !orderRes.order) {
    options.onFailure({
      description: orderRes.error || 'Could not initiate Razorpay order on server.',
    });
    return;
  }

  const isSandbox = Boolean(orderRes.isSandbox);
  const activeKeyId = orderRes.keyId || 'rzp_test_simulated_key';

  // 2. Ensure Razorpay client SDK is ready
  const scriptLoaded = await loadRazorpayScript();

  if (!scriptLoaded || !window.Razorpay) {
    // If external script CDN is unreachable (e.g. strict CSP or offline preview sandbox),
    // and we're in sandbox/test mode, provide a simulated confirmation
    if (isSandbox) {
      const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11)}`;
      options.onSuccess(
        {
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: orderRes.order.id,
          razorpay_signature: 'simulated_test_signature',
        },
        true
      );
      return;
    }

    options.onFailure({
      description: 'Razorpay checkout script failed to load. Please check your internet connection.',
    });
    return;
  }

  // 3. Configure Razorpay Standard Checkout
  const logoUrl = options.shopLogo
    ? options.shopLogo.startsWith('http') || options.shopLogo.startsWith('data:')
      ? options.shopLogo
      : typeof window !== 'undefined'
      ? `${window.location.origin}${options.shopLogo.startsWith('/') ? '' : '/'}${options.shopLogo}`
      : undefined
    : undefined;

  const razorpayOptions = {
    key: activeKeyId,
    amount: orderRes.order.amount,
    currency: orderRes.order.currency || 'INR',
    name: options.shopName || 'Treo Enterprises',
    description: options.description || `Payment of ₹${options.amount.toLocaleString('en-IN')}`,
    image: logoUrl,
    order_id: orderRes.order.id,
    handler: function (response: RazorpayPaymentSuccessResponse) {
      options.onSuccess(response, isSandbox);
    },
    prefill: {
      name: options.customer.name,
      email: options.customer.email,
      contact: options.customer.mobile,
      method: 'upi',
    },
    config: {
      display: {
        blocks: {
          upi: {
            name: 'Pay using UPI (GPay, PhonePe, Paytm, QR)',
            instruments: [
              {
                method: 'upi',
              },
            ],
          },
          other: {
            name: 'Cards & NetBanking',
            instruments: [
              {
                method: 'card',
              },
              {
                method: 'netbanking',
              },
              {
                method: 'wallet',
              },
            ],
          },
        },
        sequence: ['block.upi', 'block.other'],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
    notes: {
      address: options.customer.address || '',
      customer_gstin: options.customer.pincode || '',
    },
    theme: {
      color: options.primaryColor || '#0f766e',
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
      confirm_close: true,
    },
  };

  try {
    const rzp = new window.Razorpay(razorpayOptions);

    rzp.on('payment.failed', function (resp: any) {
      console.warn('Razorpay payment failed:', resp.error);
      options.onFailure(resp.error || { description: 'Payment transaction cancelled or declined' });
    });

    rzp.open();
  } catch (err: any) {
    console.error('Error opening Razorpay modal:', err);
    // If opening failed due to invalid dummy key in sandbox, allow sandbox test verification
    if (isSandbox) {
      const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11)}`;
      options.onSuccess(
        {
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: orderRes.order.id,
          razorpay_signature: 'simulated_test_signature',
        },
        true
      );
      return;
    }

    options.onFailure({
      description: err.message || 'Failed to initialize Razorpay checkout window',
    });
  }
};
