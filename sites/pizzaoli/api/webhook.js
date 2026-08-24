// Stripe calls this the moment a payment succeeds. It is what tells the
// shop an order came in — do not rely on the customer's browser for that,
// because they close the tab.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe signs the raw body, so it must not be parsed before we see it.
export const config = { api: { bodyParser: false } };

function readRaw(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

function money(c) { return '$' + (c / 100).toFixed(2); }

async function tellTheShop(session) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_EMAIL;
  if (!key || !to) {
    console.log('ORDER RECEIVED (no email configured)', session.id, session.metadata);
    return;
  }

  const m = session.metadata || {};
  const lines = [
    'NEW ORDER — ' + (m.fulfilment === 'delivery' ? 'DELIVERY' : 'PICKUP'),
    '',
    'Name:   ' + (m.customer_name || '—'),
    'Phone:  ' + (m.customer_phone || '—'),
    m.fulfilment === 'delivery' ? 'Address: ' + (m.address || '—') : null,
    '',
    'Order:  ' + (m.items || '—'),
    'Paid:   ' + money(session.amount_total || 0),
    '',
    m.notes ? 'Notes:  ' + m.notes : null,
    '',
    'Stripe: ' + session.id
  ].filter(function (l) { return l !== null; }).join('\n');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ORDER_FROM || 'orders@resend.dev',
      to: to.split(',').map(function (s) { return s.trim(); }),
      subject: 'New order — ' + (m.customer_name || 'Pizzaoli') + ' — ' + money(session.amount_total || 0),
      text: lines
    })
  });
  if (!r.ok) console.error('order email failed', r.status, await r.text());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    const raw = await readRaw(req);
    event = stripe.webhooks.constructEvent(
      raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error('bad stripe signature', e.message);
    return res.status(400).send('Signature check failed');
  }

  if (event.type === 'checkout.session.completed') {
    try {
      await tellTheShop(event.data.object);
    } catch (e) {
      // Never fail the webhook on a mail error — Stripe would retry the
      // whole event and the shop could be told twice.
      console.error('notify failed', e);
    }
  }

  res.status(200).json({ received: true });
}
