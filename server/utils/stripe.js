const STRIPE_API = 'https://api.stripe.com/v1';

function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
}

function getStripePublishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

async function stripeRequest(path, params) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured');
  }

  const body = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, String(value));
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

async function createPaymentIntent({ amount, currency = 'gbp', tenantId, roomId, month }) {
  return stripeRequest('/payment_intents', {
    amount,
    currency,
    'payment_method_types[]': 'card',
    'metadata[tenantId]': tenantId,
    'metadata[roomId]': roomId,
    'metadata[month]': month
  });
}

async function retrievePaymentIntent(id) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured');
  }

  const qs = new URLSearchParams({ 'expand[]': 'payment_method' });
  const res = await fetch(`${STRIPE_API}/payment_intents/${encodeURIComponent(id)}?${qs}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Stripe request failed');
  }
  return data;
}

module.exports = {
  stripeEnabled,
  getStripePublishableKey,
  createPaymentIntent,
  retrievePaymentIntent
};
