// ─────────────────────────────────────────────────────────────
// THE MENU. This is the only place prices live.
//
// The browser reads it for display, and the checkout function reads
// it again to price the order. Prices are never taken from the
// browser, so nobody can edit a price in dev tools and pay $1.
//
// Prices are in CENTS. $12.00 → 1200.
// Add an item by copying a line. Remove one by deleting it.
// ─────────────────────────────────────────────────────────────

export const CURRENCY = 'usd';

// Broward County sales tax on prepared food. Leave null and no tax
// line is added — confirm the correct rate before switching it on.
export const TAX_RATE = null;      // e.g. 0.07 for 7%

export const FULFILMENT = {
  pickup:   { enabled: true,  label: 'Pickup',   fee: 0 },
  delivery: { enabled: true,  label: 'Delivery', fee: 500,   // $5.00
              minimum: 2500,                                  // $25.00 minimum
              note: 'Delivery in 30–45 minutes.' }
};

export const CATEGORIES = [
  { id: 'pizza',  name: 'Pizza' },
  { id: 'calzone',name: 'Calzones' },
  { id: 'cold',   name: 'Cold Beverages' },
  { id: 'hot',    name: 'Hot Drinks' }
];

// Only items with a price appear on the ordering page.
// Everything below is from Pizzaoli's own menu; the $12.00 is the one
// price published on pizzaolidavie.com. The rest need prices filled in
// before they can be ordered.
export const ITEMS = [
  { id: 'cheese-12', cat: 'pizza', name: '12" Thin Crust Cheese',
    desc: 'Sauce, cheese, crust.', price: 1200 },

  { id: 'meat-lovers', cat: 'pizza', name: 'Thin Crust Meat Lovers',
    desc: 'Loaded up, still thin.', price: null },

  { id: 'caprese', cat: 'pizza', name: 'Thin Crust Caprese',
    desc: 'Fresh mozzarella, tomato, basil.', price: null },

  { id: 'veggie', cat: 'pizza', name: 'Vegetarian Pie',
    desc: 'A real selection, not one afterthought.', price: null },

  { id: 'calzone-cheese', cat: 'calzone', name: 'Classic Cheese Calzone',
    desc: 'Same dough, folded over.', price: null }
];

export function findItem(id) {
  return ITEMS.find(function (i) { return i.id === id && typeof i.price === 'number'; });
}

// Rebuilds the order from ids and quantities only. Anything the browser
// sent about prices is ignored.
export function priceOrder(lines, mode) {
  const f = FULFILMENT[mode];
  if (!f || !f.enabled) throw new Error('Unavailable fulfilment method');

  const priced = [];
  let subtotal = 0;

  for (const line of lines || []) {
    const item = findItem(line && line.id);
    if (!item) continue;
    const qty = Math.max(1, Math.min(50, parseInt(line.qty, 10) || 0));
    if (!qty) continue;
    subtotal += item.price * qty;
    priced.push({ id: item.id, name: item.name, unit: item.price, qty });
  }

  if (!priced.length) throw new Error('Empty order');
  if (mode === 'delivery' && f.minimum && subtotal < f.minimum) {
    throw new Error('Delivery minimum is $' + (f.minimum / 100).toFixed(2));
  }

  const fee = f.fee || 0;
  const tax = TAX_RATE ? Math.round((subtotal + fee) * TAX_RATE) : 0;

  return { lines: priced, subtotal, fee, tax, total: subtotal + fee + tax };
}
