// Serves the menu and the open/closed state to the ordering page.
import { CATEGORIES, ITEMS, FULFILMENT, TAX_RATE } from './menu.js';
import { shopStatus } from './hours.js';

export default function handler(req, res) {
  const status = shopStatus();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status,
    taxRate: TAX_RATE,
    fulfilment: FULFILMENT,
    categories: CATEGORIES,
    // Only priced items are orderable.
    items: ITEMS.filter(function (i) { return typeof i.price === 'number'; }),
    paymentsReady: Boolean(process.env.STRIPE_SECRET_KEY)
  });
}
