# Shippo Live Mode - Quick Reference Card

**Status:** 🟢 LIVE MODE ACTIVE  
**Date:** January 9, 2026

---

## 🚨 IMPORTANT

**YOU ARE NOW IN LIVE MODE!**
- Real shipping rates
- Real label charges
- Real tracking numbers
- Real money spent on postage

---

## ✅ What's Configured

```
✅ Live API Token Set (.env.local)
✅ Rate Validation (Triple-Layer)
✅ Weight Calculations Active
✅ Label Generation Ready
✅ Tracking Numbers Working
✅ Error Handling Robust
```

---

## 📦 Shipping Services Enabled

**USPS:**
- ✅ Ground Advantage (2-5 days) ~$5-10
- ✅ Priority Mail (1-3 days) ~$8-15

**UPS:**
- ✅ Ground (1-5 days) ~$8-12
- ✅ 3 Day Select ~$15-20

---

## 💰 Costs

**Who Pays:**
- Customer pays: Actual carrier rate (no markup)
- You pay: Label cost charged to Shippo account

**Typical Costs (1 thobe ~16oz):**
- Local (0-50 miles): $5-7
- Regional (50-500 miles): $7-10
- National (500+ miles): $10-15

---

## 🔍 How to Test

**Before First Real Order:**

1. Place order on your site
2. Use **your own address** as destination
3. Complete checkout
4. Go to admin panel → Orders
5. Click order → Generate Label
6. Download PDF label
7. **Void label in Shippo dashboard** (get refund)

---

## 🚦 Customer Checkout Flow

```
1. Add items to cart
2. Go to checkout
3. Select "Shipping"
4. Enter shipping address
5. See real rates (USPS/UPS)
6. Select preferred service
7. Pay with Stripe
8. You generate label in admin
9. Customer gets tracking email
```

---

## 🛠️ Admin: How to Generate Labels

```
1. Go to /admin/orders
2. Click on paid order
3. Scroll to "Shipping Label" section
4. Click "Generate Shippo Label"
5. Wait 3-5 seconds
6. Label URL appears
7. Download PDF
8. Print and attach to package
```

---

## 🐛 Common Issues & Fixes

### "Shipping service not configured"
**Fix:** Check `.env.local` has `SHIPPO_API_TOKEN=shippo_live_...`

### No rates returned
**Fix:** Verify customer address is valid US address

### Rates too high
**Fix:** Add `weight_grams` field to products in Firebase

### Label URL missing
**Fix:** Already handled with retry logic (3 attempts)

---

## 📊 Where to Check

**Server Logs (Render):**
Look for: `📦 Using Shippo LIVE mode`

**Shippo Dashboard:**
https://app.goshippo.com
- View all labels
- Check costs
- Void unused labels

**Your Orders:**
`/admin/orders` → Each order shows label status

---

## ⚠️ Important Notes

### DO:
- ✅ Test with your own address first
- ✅ Void test labels to get refund
- ✅ Add product weights for accuracy
- ✅ Monitor Shippo dashboard for costs

### DON'T:
- ❌ Generate labels you won't use (costs money)
- ❌ Share Shippo API token publicly
- ❌ Forget to ship packages (tracking updates)
- ❌ Use test orders with real customers

---

## 🆘 Emergency Actions

**If Something Goes Wrong:**

1. **Switch Back to Test Mode:**
   ```env
   # In .env.local
   SHIPPO_USE_TEST=true
   ```

2. **Restart Server:**
   - Render: Manual deploy
   - Local: `npm run dev`

3. **Check Logs:**
   - Look for `❌ Shippo API error`
   - Note the error message

4. **Contact Shippo Support:**
   - Email: support@goshippo.com
   - Include: order ID, error message, timestamp

---

## 💡 Pro Tips

**Save Money:**
- Void unused labels within 14 days (USPS)
- Use Ground for non-urgent orders
- Batch print multiple labels
- Use flat rate boxes when cheaper

**Better Experience:**
- Set realistic delivery expectations (5-7 days)
- Send tracking numbers immediately
- Update customers on shipment status
- Offer insurance for high-value items

**Avoid Issues:**
- Verify addresses before generating labels
- Double-check package weight
- Print labels clearly (thermal printer recommended)
- Keep label copies for records

---

## 📈 Metrics to Track

**Weekly:**
- Number of orders shipped
- Average shipping cost per order
- Most popular shipping service
- Label refund rate

**Monthly:**
- Total shipping revenue vs cost
- Customer complaints about shipping
- Delivery time accuracy
- Lost/damaged package rate

---

## 🎯 Quick Actions

| Task | Location |
|------|----------|
| View all orders | `/admin/orders` |
| Generate label | Order detail → "Generate Label" |
| Check Shippo account | https://app.goshippo.com |
| View server logs | Render dashboard |
| Test checkout | Your website `/checkout` |
| Void label | Shippo dashboard → Transactions |

---

## 📞 Support Contacts

**Technical Issues:**
- Check: `SHIPPO_LIVE_MODE_SETUP.md` (full docs)
- Logs: Render dashboard
- Code: `lib/shipping/shippoApi.ts`

**Shippo Support:**
- Email: support@goshippo.com
- Docs: https://goshippo.com/docs
- Dashboard: https://app.goshippo.com

**Carrier Support:**
- USPS: 1-800-ASK-USPS (1-800-275-8777)
- UPS: 1-800-742-5877

---

## ✅ Final Checklist

Before processing first real customer order:

- [ ] Tested with own address
- [ ] Verified rates are reasonable
- [ ] Generated test label successfully
- [ ] Voided test label
- [ ] Checked Shippo dashboard access
- [ ] Verified tracking number works
- [ ] Set up shipping policy page
- [ ] Prepared packing materials
- [ ] Have printer ready for labels

---

**🎉 You're ready to ship!**

Full documentation: `SHIPPO_LIVE_MODE_SETUP.md`
