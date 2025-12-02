# 🧪 Stripe Test Cards - Quick Reference

## **Most Common Test Card**

```
Card Number: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```
**Result:** ✅ Successful payment

---

## **All Test Cards**

| Card Number | Scenario | Use Case |
|-------------|----------|----------|
| `4242 4242 4242 4242` | ✅ Success | Standard successful payment |
| `4000 0000 0000 0002` | ❌ Declined | Test declined card handling |
| `4000 0025 0000 3155` | 🔐 3D Secure | Test authentication flow |
| `4000 0000 0000 9995` | 💰 Insufficient Funds | Test insufficient funds error |
| `4000 0027 6000 3184` | 🔐 SCA Required | Test Strong Customer Authentication |

**For all cards:**
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

---

## **Quick Test Steps**

1. Add products to cart
2. Go to checkout
3. Click "Proceed to Secure Checkout"
4. Enter test card above
5. Complete payment
6. Verify success!

---

**See `TESTING_WITH_STRIPE_TEST_KEYS.md` for complete testing guide.**

