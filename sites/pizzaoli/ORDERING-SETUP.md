# Pizzaoli — online ordering setup

Everything is built. It needs three things before it can take a real order:
the menu, a Stripe account, and somewhere for orders to land.

---

## 1. The menu — `api/menu.js`

Prices live in exactly one place, and they live on the server. The browser
never gets to say what something costs, so nobody can change a price in dev
tools and pay $1 for a pie.

**Prices are in cents.** $12.00 is `1200`.

```js
{ id: 'meat-lovers', cat: 'pizza', name: 'Thin Crust Meat Lovers',
  desc: 'Loaded up, still thin.', price: 1800 },
```

An item with `price: null` does not appear on the ordering page. Right now
only the 12" cheese has a real price, so it is the only orderable item.

Also in that file:

| Setting | What it does |
|---|---|
| `TAX_RATE` | `null` = no tax line. Set to e.g. `0.07` once the rate is confirmed. |
| `FULFILMENT.delivery.fee` | Delivery fee in cents. Currently `500` = $5.00. |
| `FULFILMENT.delivery.minimum` | Order minimum for delivery. Currently `2500` = $25.00. |
| `FULFILMENT.delivery.enabled` | `false` makes it pickup-only. |

Hours live in `api/hours.js`. **Checkout refuses orders when the shop is
closed** — a paid order nobody is there to cook is worse than no order.

---

## 2. Stripe

The shop's own Stripe account — money goes straight to their bank, never
through anyone else.

1. Sign up at **stripe.com**, complete the business details (EIN, bank account).
2. **Developers → API keys** → copy the **Secret key** (`sk_live_…`).
3. In Vercel: **Project → Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | `sk_live_…` |

4. **Developers → Webhooks → Add endpoint**
   - URL: `https://<the-site>/api/webhook`
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_…`) and add it as `STRIPE_WEBHOOK_SECRET`.

Until `STRIPE_SECRET_KEY` exists the pay button says *"Payments not switched
on yet"* and stays disabled. Nothing breaks — it just can't charge.

**Test it first.** Use the test keys (`sk_test_…`) and card `4242 4242 4242
4242`, any future expiry, any CVC. Place a full order end to end and confirm
it arrives. Only then switch to live keys.

Stripe takes **2.9% + 30¢** per card payment. On a $30 order that's about
$1.17.

---

## 3. Where orders land

The webhook fires the moment a payment succeeds — that's what tells the
kitchen. It does not depend on the customer keeping the tab open.

| Name | Value |
|---|---|
| `ORDER_EMAIL` | Where orders go. Comma-separate for more than one. |
| `RESEND_API_KEY` | Free key from **resend.com** |
| `ORDER_FROM` | Optional. Defaults to `orders@resend.dev`. |

With no email configured the order is still charged and still recorded in
Stripe — it just gets logged instead of emailed. Set this up before going live.

**A shop open until 2 AM should not rely on email alone.** Options worth
adding later: a text message via Twilio, or a tablet in the kitchen with the
Stripe dashboard open and notifications on.

---

## 4. Switching the site over

While all of the above is being set up, the main site still points at the
current ordering system. When the new one is tested and ready, change one
line at the bottom of `index.html`:

```js
orderUrl: 'https://pizzaolidavie.com/',   →   orderUrl: '/order',
```

All five Order buttons follow that one setting.

**Do not turn off the old system until real orders have come through the new
one.** Run both for a week.

---

## Deploying

This folder is no longer plain HTML — `api/` needs Node, so deploy the whole
folder:

```
cd ~/Downloads/pizzaoli && npx vercel --prod --yes
```

Vercel picks up `api/*.js` as serverless functions automatically. No build
step, no config.
