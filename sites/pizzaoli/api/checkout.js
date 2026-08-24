import Stripe from 'stripe';
import { CURRENCY, FULFILMENT, priceOrder } from './menu.js';
import { shopStatus } from './hours.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function bad(res, code, message) {
  res.status(code).json({ error: message });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');
  if (!process.env.STRIPE_SECRET_KEY) return bad(res, 500, 'Payments are not configured yet.');

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { lines, mode, name, phone, address, notes } = body;

  // The kitchen has to be open. A paid order nobody is there to make is worse
  // than a rejected one.
  const status = shopStatus();
  if (!status.open) {
    return bad(res, 409, 'We’re closed right now — ' + status.next + '.');
  }

  if (!name || !String(name).trim()) return bad(res, 400, 'Please add your name.');
  if (!phone || !String(phone).trim()) return bad(res, 400, 'Please add a phone number.');
  if (mode === 'delivery' && !String(address || '').trim()) {
    return bad(res, 400, 'Please add a delivery address.');
  }

  let order;
  try {
    order = priceOrder(lines, mode);
  } catch (e) {
    return bad(res, 400, e.message);
  }

  const origin = (req.headers.origin || 'https://' + req.headers.host).replace(/\/$/, '');

  const line_items = order.lines.map(function (l) {
    return {
      quantity: l.qty,
      price_data: {
        currency: CURRENCY,
        unit_amount: l.unit,
        product_data: { name: l.name }
      }
    };
  });

  if (order.fee) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: order.fee,
        product_data: { name: FULFILMENT[mode].label + ' fee' }
      }
    });
  }

  if (order.tax) {
    line_items.push({
      quantity: 1,
      price_data: { currency: CURRENCY, unit_amount: order.tax, product_data: { name: 'Sales tax' } }
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: origin + '/success.html?s={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/order.html',
      phone_number_collection: { enabled: false },
      metadata: {
        fulfilment: mode,
        customer_name: String(name).slice(0, 120),
        customer_phone: String(phone).slice(0, 40),
        address: String(address || '').slice(0, 240),
        notes: String(notes || '').slice(0, 400),
        items: order.lines.map(function (l) { return l.qty + '× ' + l.name; }).join(', ').slice(0, 480)
      }
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('stripe checkout failed', e);
    return bad(res, 502, 'Could not start checkout. Please call us and we’ll take the order.');
  }
}
