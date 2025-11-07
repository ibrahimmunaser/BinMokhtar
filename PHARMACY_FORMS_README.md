# Pharmacy Forms - Implementation Summary

## 🎉 What's Been Built

Two production-ready pharmacy forms have been implemented:

1. **Refill Request Form** (`/pharmacy/refill`)
2. **Transfer Request Form** (`/pharmacy/transfer`)

Both forms submit securely to a Google Apps Script web app that sends formatted emails to the pharmacy inbox.

---

## 📁 Project Structure

```
├── app/
│   └── pharmacy/
│       ├── refill/
│       │   └── page.tsx          # Refill form page
│       └── transfer/
│           └── page.tsx          # Transfer form page
│
├── components/
│   └── pharmacy/
│       ├── FormDisclaimer.tsx    # Privacy notice component
│       ├── FormInput.tsx         # Accessible input component
│       └── PharmacyFormBase.tsx  # Form wrapper with UX logic
│
├── lib/
│   ├── pharmacy-form-config.ts        # Endpoint URL configuration
│   └── pharmacy-form-validation.ts    # Validation schemas & utilities
│
├── config/
│   ├── form-endpoint.json        # Fallback config file
│   └── README.md                 # Configuration instructions
│
├── public/
│   └── config/
│       └── form-endpoint.json    # Public copy for client fetch
│
├── scripts/
│   └── google-apps-script.js     # Complete GAS email relay script
│
├── tests/
│   └── forms.checklist.md        # Comprehensive acceptance tests
│
├── GAS_SETUP.md                  # Step-by-step deployment guide
└── PHARMACY_FORMS_README.md      # This file
```

---

## ✨ Features Implemented

### Frontend Features

✅ **Accessibility**
- Semantic HTML with proper labels
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management on errors

✅ **Validation**
- Client-side validation with Zod
- Inline error messages
- Required field enforcement
- Format validation (phone, email, date)
- Max length enforcement with character counters

✅ **UX**
- No page reload on submit (fetch API)
- Loading spinner during submission
- Success/error panels with dismiss buttons
- Form reset on success (preserves patient name)
- Auto-scroll to messages
- Deduplication warning

✅ **Security**
- Honeypot field for bot protection
- Client-side deduplication (10 min window)
- Input sanitization
- Max length caps

✅ **Responsive Design**
- Mobile-friendly layouts
- Touch-friendly tap targets
- Dark mode support

✅ **Progressive Enhancement**
- Works with JavaScript disabled (basic POST fallback)
- Noscript message for guidance

### Backend Features (Google Apps Script)

✅ **Email Handling**
- Formatted HTML emails with tables
- Plain text alternative
- Reply-To set to patient email
- Professional subject lines

✅ **Security**
- Honeypot validation (silent discard)
- Rate limiting (3 requests per IP per 15 min)
- Server-side deduplication (2 min window)
- HTML escaping and sanitization
- Field length enforcement

✅ **Optional Features**
- Google Sheets logging (toggle on/off)
- Debug logging
- Configurable rate limits

✅ **Error Handling**
- Graceful error responses
- JSON response format
- CORS-friendly (accepts any origin)

---

## 🚀 Quick Start

### 1. Deploy Google Apps Script

Follow the detailed guide in **`GAS_SETUP.md`**:

1. Go to [script.google.com](https://script.google.com)
2. Create new project
3. Paste code from `scripts/google-apps-script.js`
4. Deploy as Web App (Execute as "Me", Access "Anyone")
5. Copy the Web App URL

### 2. Configure Endpoint URL

**Option A: Environment Variable (Recommended)**

Add to `.env.local`:

```bash
NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Option B: Config File**

Edit `config/form-endpoint.json` and `public/config/form-endpoint.json`:

```json
{
  "pharmacyFormEndpoint": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
}
```

### 3. Update Pharmacy Contact Info

The forms include a pharmacy phone number in error messages and disclaimers. Currently set to `(313) 555-1234`.

**Update in:**
- `components/pharmacy/FormDisclaimer.tsx` (line 11)
- `app/pharmacy/refill/page.tsx` (line 113)
- `app/pharmacy/transfer/page.tsx` (line 124)

Search and replace `tel:+13135551234` and `(313) 555-1234` with your actual pharmacy phone.

### 4. Test Locally

```bash
npm run dev
```

Navigate to:
- [http://localhost:3000/pharmacy/refill](http://localhost:3000/pharmacy/refill)
- [http://localhost:3000/pharmacy/transfer](http://localhost:3000/pharmacy/transfer)

### 5. Run Acceptance Tests

Follow the checklist in **`tests/forms.checklist.md`** to verify all features work correctly.

### 6. Deploy to Production

```bash
npm run build
npm start
```

Or deploy to Vercel/Netlify as usual. Make sure to set the environment variable in your hosting provider's dashboard.

---

## 🔧 Configuration Options

### Google Apps Script Configuration

Edit these constants at the top of `scripts/google-apps-script.js`:

```javascript
const ENABLE_SHEETS_LOGGING = false;  // Toggle Google Sheets logging
const SHEET_NAME = 'Pharmacy Form Submissions';
const PHARMACY_EMAIL = 'Pharmacy.xpresscare@gmail.com';
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const DEBUG = false;  // Enable detailed logging
```

After changes, redeploy:
1. Google Apps Script → Deploy → Manage deployments
2. Edit → New version → Deploy

### Frontend Configuration

**Endpoint URL Priority:**
1. `NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT` (environment variable)
2. `config/form-endpoint.json` (fallback)

---

## 📝 Form Specifications

### Shared Fields (Both Forms)

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| Patient Name | Text | Yes | 100 | Min 2 chars |
| Date of Birth | Date | Yes | - | YYYY-MM-DD format |
| Phone | Tel | Yes | 17 | 10-17 chars, normalized to digits |
| Email | Email | No | 120 | RFC-like pattern |
| Medications | Textarea | Yes | 1500 | Min 1 char |
| Rx Number | Text | No | 40 | - |
| Notes | Textarea | No | 1500 | - |
| **Hidden Fields** | | | | |
| type | Hidden | Yes | - | 'refill' or 'transfer' |
| website | Hidden | No | 0 | Honeypot (must be empty) |
| ts | Hidden | Yes | - | ISO timestamp (auto-filled) |

### Transfer-Only Fields

| Field | Type | Required | Max Length | Validation |
|-------|------|----------|------------|------------|
| Pharmacy Name | Text | Yes | 120 | Min 2 chars |
| Pharmacy Phone | Tel | Yes | 17 | 10-17 chars, normalized |

---

## 🔒 Security & Privacy

### What's Protected

✅ **Honeypot**: Hidden field catches bots  
✅ **Rate limiting**: Max 3 submissions per IP per 15 minutes  
✅ **Deduplication**: Client (10 min) + Server (2 min)  
✅ **Sanitization**: All fields escaped to prevent XSS  
✅ **Max lengths**: Enforced client and server-side  

### Privacy Compliance

⚠️ **Important Limitations:**

- Email is **NOT HIPAA-compliant**
- PHI (Protected Health Information) is transmitted
- Patients are warned via disclaimer component
- For HIPAA compliance, upgrade to a secure solution

**Disclaimer Component:**  
Located at `components/pharmacy/FormDisclaimer.tsx` — can be easily swapped if you upgrade to a compliant email service.

### Compliance Escalation Path

If you need HIPAA compliance later:

1. **Upgrade email provider** (Paubox, LuxSci, etc.)
2. **Update** `PHARMACY_EMAIL` in Google Apps Script
3. **Swap** the disclaimer component
4. **Or:** Deploy a custom HIPAA-compliant backend and update the endpoint URL

The forms are **endpoint-agnostic**, so you can swap backends without touching the frontend!

---

## 🧪 Testing

### Manual Testing

Run through the comprehensive checklist:

```bash
# Open the test guide
cat tests/forms.checklist.md
```

Covers:
- ✅ Required field validation
- ✅ Format validation (phone, email, date)
- ✅ Successful submission flow
- ✅ Email delivery and formatting
- ✅ Honeypot protection
- ✅ Rate limiting
- ✅ Deduplication
- ✅ Error handling
- ✅ Accessibility (keyboard, screen reader)
- ✅ Responsive design
- ✅ Dark mode
- ✅ Browser compatibility

### Automated Testing (Optional)

To add automated tests:

```bash
# Unit tests for validation
npm test lib/pharmacy-form-validation.test.ts

# E2E tests with Playwright
npm run test:e2e tests/pharmacy-forms.spec.ts
```

---

## 📧 Email Format

### Subject Line

```
New refill request — John Doe
New transfer request — Jane Smith
```

### HTML Body

- Professional table layout
- All fields clearly labeled
- Clickable phone numbers (tel: links)
- Clickable email addresses (mailto: links)
- Transfer forms include "Previous Pharmacy" section
- Footer with timestamp and request type

### Plain Text Alternative

- Clean ASCII formatting
- All fields present
- Works in text-only email clients

---

## 🛠️ Customization

### Styling

Forms use Tailwind CSS classes. To customize:

1. **Colors**: Update `bg-blue-600`, `text-red-600`, etc.
2. **Spacing**: Adjust `p-6`, `mt-4`, `space-y-6`, etc.
3. **Dark mode**: Modify `dark:` variants
4. **Typography**: Change font sizes, weights

### Field Labels

Edit in the page files:
- `app/pharmacy/refill/page.tsx`
- `app/pharmacy/transfer/page.tsx`

### Success/Error Messages

Edit in `components/pharmacy/PharmacyFormBase.tsx`:
- Success message (line 55)
- Error message (line 85)

### Privacy Disclaimer

Edit `components/pharmacy/FormDisclaimer.tsx` to update legal text.

---

## 🐛 Troubleshooting

### "Endpoint not configured" error

**Solution:**
- Set `NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT` in `.env.local`
- Or update `config/form-endpoint.json`
- Restart dev server

### "Rate limited" error during testing

**Solution:**
- Wait 15 minutes, or
- Lower `RATE_LIMIT_WINDOW_MINUTES` in Google Apps Script temporarily
- Redeploy script

### No emails arriving

**Solution:**
1. Check pharmacy email spam folder
2. Check Google Apps Script **Executions** log
3. Enable `DEBUG = true` in script
4. Check script logs (View → Logs)
5. Verify `PHARMACY_EMAIL` is correct

### Honeypot blocking real users

**Solution:**
- Ensure the "website" field is truly hidden (`type="hidden"`)
- Check that browsers aren't auto-filling it
- Review Google Apps Script logs to confirm honeypot triggers

### Form validation not working

**Solution:**
- Check browser console for JavaScript errors
- Verify Zod schema in `lib/pharmacy-form-validation.ts`
- Test with different browsers

---

## 📊 Monitoring

### Google Apps Script Executions

1. Go to [script.google.com](https://script.google.com)
2. Open your project
3. Click **"Executions"** in left sidebar
4. See history of all submissions and errors

### Email Deliverability

- Check pharmacy inbox daily
- Review spam folder weekly
- Test forms monthly to ensure still working

### Rate Limit Monitoring

If too many legitimate users are being blocked:
- Increase `RATE_LIMIT_MAX` (e.g., to 5)
- Increase `RATE_LIMIT_WINDOW_MINUTES` (e.g., to 30)
- Redeploy script

---

## 🚀 Optional Enhancements

### Add reCAPTCHA v3

See `GAS_SETUP.md` for detailed instructions on adding Google reCAPTCHA to reduce spam.

### Add Confirmation Emails

Modify Google Apps Script to send a copy to the patient's email address:

```javascript
if (data.email) {
  MailApp.sendEmail(
    data.email,
    'Your prescription request has been received',
    'Thank you for your submission...'
  );
}
```

### Add File Upload

Allow patients to upload insurance cards or prescriptions:

1. Add file input to forms
2. Use Firebase Storage or Cloudinary
3. Include download link in email

### Add SMS Notifications

Use Twilio to send SMS to pharmacy when form is submitted:

```javascript
function sendSMS() {
  const twilioUrl = 'https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT/Messages.json';
  // ... implementation
}
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `GAS_SETUP.md` | Step-by-step Google Apps Script deployment |
| `tests/forms.checklist.md` | Comprehensive acceptance testing |
| `config/README.md` | Endpoint configuration instructions |
| `PHARMACY_FORMS_README.md` | This file - overview and quick start |

---

## 🎯 Next Steps

1. [ ] Deploy Google Apps Script (see `GAS_SETUP.md`)
2. [ ] Configure endpoint URL
3. [ ] Update pharmacy phone number in components
4. [ ] Test locally (use checklist)
5. [ ] Deploy to production
6. [ ] Run acceptance tests in production
7. [ ] Monitor pharmacy inbox
8. [ ] Set up regular form testing (monthly)

---

## 💡 Support

For issues or questions:

1. Check **Troubleshooting** section above
2. Review Google Apps Script **Executions** log
3. Check browser console for frontend errors
4. Refer to `tests/forms.checklist.md` for test scenarios

---

## ✅ Feature Checklist

- [x] Two forms (Refill & Transfer)
- [x] Accessible markup with labels
- [x] Client-side validation (Zod)
- [x] Inline error messages
- [x] Loading states with spinner
- [x] Success/error UX (no reload)
- [x] Honeypot spam protection
- [x] Client deduplication
- [x] Server deduplication
- [x] Rate limiting
- [x] Phone normalization
- [x] Max length enforcement
- [x] Character counters
- [x] Dark mode support
- [x] Responsive design
- [x] Keyboard navigation
- [x] Screen reader support
- [x] Google Apps Script email relay
- [x] HTML & plain text emails
- [x] Reply-To support
- [x] Field sanitization
- [x] Optional Sheets logging
- [x] Configurable endpoint
- [x] Privacy disclaimer
- [x] No-JS fallback
- [x] Comprehensive test checklist
- [x] Detailed setup documentation

---

**All requirements met!** ✅ Ready for deployment.

