const STRIPE_API = 'https://api.stripe.com/v1';

// --- Stripe Type Definitions ---

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  tenantId: string;
  roomId: string;
  month: string;
}

export interface StripePaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_secret: string;
  metadata?: {
    tenantId?: string;
    roomId?: string;
    month?: string;
    [key: string]: any;
  };
  payment_method?: {
    id: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
    [key: string]: any;
  } | null;
  [key: string]: any;
}

// --- Helper Functions ---

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
}

export function getStripePublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

async function stripeRequest(path: string, params?: Record<string, any>): Promise<any> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured');
  }

  const body = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.append(key, String(value));
    }
  });

  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Stripe request failed');
  }
  return data;
}

export async function createPaymentIntent({ 
  amount, 
  currency = 'gbp', 
  tenantId, 
  roomId, 
  month 
}: CreatePaymentIntentParams): Promise<StripePaymentIntent> {
  return stripeRequest('/payment_intents', {
    amount,
    currency,
    'payment_method_types[]': 'card',
    'metadata[tenantId]': tenantId,
    'metadata[roomId]': roomId,
    'metadata[month]': month
  });
}

export async function retrievePaymentIntent(id: string): Promise<StripePaymentIntent> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured');
  }

  const qs = new URLSearchParams({ 'expand[]': 'payment_method' });
  const res = await fetch(`${STRIPE_API}/payment_intents/${encodeURIComponent(id)}?${qs}`, {
    headers: { 
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` 
    }
  });
  
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Stripe request failed');
  }
  return data as StripePaymentIntent;
}