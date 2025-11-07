# Pharmacy Forms - Acceptance Test Checklist

This checklist ensures all pharmacy form features work correctly before going live. Test both **Refill** and **Transfer** forms.

---

## Pre-Testing Setup

- [ ] Google Apps Script deployed and Web App URL obtained
- [ ] Endpoint URL configured in `.env.local` or `config/form-endpoint.json`
- [ ] Development server running (`npm run dev`)
- [ ] Access to pharmacy inbox: Pharmacy.xpresscare@gmail.com
- [ ] Browser Developer Tools open (F12) for console monitoring

---

## 1. Form Accessibility & UI

### Refill Form (`/pharmacy/refill`)

- [ ] **Page loads** without errors
- [ ] **All form fields** are visible and properly labeled
- [ ] **Labels** are associated with inputs (click label → input gets focus)
- [ ] **Required fields** show asterisk (*) indicator
- [ ] **Tab key navigation** works through all fields in logical order
- [ ] **Character counters** appear below textareas (medications, notes)
- [ ] **Help text** appears below relevant fields
- [ ] **Privacy disclaimer** appears at the bottom of the form
- [ ] **Submit button** displays correct text: "Submit Refill Request"

### Transfer Form (`/pharmacy/transfer`)

- [ ] **Page loads** without errors
- [ ] **All form fields** are visible and properly labeled
- [ ] **Section headings** appear: "Patient Information", "Previous Pharmacy Information", "Prescription Information"
- [ ] **Additional fields** present: "Pharmacy Name" and "Pharmacy Phone Number"
- [ ] **All accessibility checks** from Refill form pass
- [ ] **Submit button** displays correct text: "Submit Transfer Request"

---

## 2. Required Field Validation

### Test: Empty Form Submission

- [ ] Try submitting empty form
- [ ] **Validation errors** appear for all required fields
- [ ] **First invalid field** gets focus automatically
- [ ] **Inline error messages** are clear and actionable
- [ ] **Submit button** remains enabled (not stuck in loading state)
- [ ] **No email sent** (form blocked by validation)

### Test: Individual Required Fields

For each required field, fill all others but leave one empty:

**Refill Form:**
- [ ] Patient Name → Error: "Patient name must be at least 2 characters"
- [ ] Date of Birth → Error: "Date of birth is required"
- [ ] Phone Number → Error: "Phone number must be at least 10 digits"
- [ ] Medications → Error: "Please list your medications"

**Transfer Form (additional):**
- [ ] Pharmacy Name → Error: "Pharmacy name must be at least 2 characters"
- [ ] Pharmacy Phone → Error: "Phone number must be at least 10 digits"

### Test: Error Clearing

- [ ] Trigger a validation error on a field
- [ ] Start typing in that field
- [ ] **Error message disappears** as you type
- [ ] Submit again → new validation check runs

---

## 3. Field Format Validation

### Phone Number Validation

- [ ] Valid format accepted: `(313) 555-1234`
- [ ] Valid format accepted: `313-555-1234`
- [ ] Valid format accepted: `3135551234`
- [ ] Valid format accepted: `+13135551234`
- [ ] Invalid format rejected: `123` (too short)
- [ ] Invalid format rejected: `abcd` (letters)
- [ ] **Phone normalized before sending**: `(313) 555-1234` → `3135551234`

### Email Validation (Optional Field)

- [ ] Empty email → accepted (field is optional)
- [ ] Valid email accepted: `patient@example.com`
- [ ] Invalid email rejected: `notanemail`
- [ ] Invalid email rejected: `@example.com`
- [ ] Error message: "Please enter a valid email address"

### Date of Birth Validation

- [ ] Date picker works and fills in YYYY-MM-DD format
- [ ] Manual entry accepted: `1990-05-15`
- [ ] Invalid format rejected: `05/15/1990` (use date picker or correct format)
- [ ] Future dates → form accepts but may want to add business logic

### Max Length Enforcement

- [ ] **Patient Name**: Max 100 characters (input has `maxLength={100}`)
- [ ] **Medications**: Max 1500 characters, counter shows `X/1500`
- [ ] **Notes**: Max 1500 characters, counter shows `X/1500`
- [ ] **Rx Number**: Max 40 characters
- [ ] **Email**: Max 120 characters
- [ ] **Phone**: Max 17 characters
- [ ] Typing beyond max → additional characters not accepted

---

## 4. Successful Submission Flow

### Test: Valid Refill Submission

Fill out the form with valid data:

```
Patient Name: John Doe
Date of Birth: 1980-01-15
Phone: (313) 555-1234
Email: john.doe@example.com
Medications: Lisinopril 10mg, Metformin 500mg
Rx Number: RX123456
Notes: Please call before filling
```

- [ ] **Submit button** shows spinner and text "Sending..."
- [ ] **Submit button** is disabled during submission
- [ ] **Success panel appears** at top of page (green background)
- [ ] Success message: "Thanks — your request was sent to the pharmacy..."
- [ ] **Page scrolls to top** to show success message
- [ ] **Form resets** except Patient Name (kept for convenience)
- [ ] **Patient Name still populated** with "John Doe"
- [ ] **All other fields cleared**
- [ ] **Success panel can be dismissed** (X button works)
- [ ] **Console log** (dev mode): `submission_id`, `ts`, `status: "ok"`

### Test: Email Delivery (Refill)

Check `Pharmacy.xpresscare@gmail.com` inbox:

- [ ] **Email received** within 1 minute
- [ ] **Subject**: "New refill request — John Doe"
- [ ] **From**: Your Google account (the one running the script)
- [ ] **Reply-To**: `john.doe@example.com` (patient's email)
- [ ] **HTML formatting** looks good (table layout, clear sections)
- [ ] **All fields present**: Patient Name, DOB, Phone, Email, Medications, Rx Number, Notes
- [ ] **Plain text version** also readable (check by viewing source)
- [ ] **No HTML injection**: fields are properly escaped

### Test: Valid Transfer Submission

Fill out the Transfer form with valid data:

```
Patient Name: Jane Smith
Date of Birth: 1975-06-20
Phone: 313-555-9876
Email: jane.smith@example.com
Medications: Atorvastatin 20mg
Rx Number: 
Notes: 
Pharmacy Name: ABC Pharmacy
Pharmacy Phone: (313) 555-5555
```

- [ ] **Submission succeeds** (same UX as Refill)
- [ ] **Email received** at pharmacy inbox
- [ ] **Subject**: "New transfer request — Jane Smith"
- [ ] **Additional section** in email: "Previous Pharmacy"
- [ ] **Transfer fields present**: Pharmacy Name, Pharmacy Phone
- [ ] **Phone numbers normalized**: `313-555-9876` → `3135559876`

---

## 5. Honeypot Protection

### Test: Bot Submission (Silent Discard)

1. Open browser Developer Console (F12)
2. Navigate to `/pharmacy/refill`
3. Fill out the form with valid data
4. In the console, run:
   ```javascript
   document.querySelector('[name="website"]').value = 'http://spam.com';
   ```
5. Submit the form

- [ ] **Form accepts submission** (shows success message)
- [ ] **No email sent** to pharmacy inbox (silent discard)
- [ ] **Script logs show** "Honeypot triggered" (if DEBUG enabled)
- [ ] **No error shown to user** (appears successful to bot)

### Test: Normal User (Honeypot Empty)

1. Fill out form normally (don't touch honeypot via console)
2. Submit

- [ ] **Email is sent** (honeypot protection didn't interfere)
- [ ] User sees success message

---

## 6. Rate Limiting

### Test: Rapid Submissions

1. Submit a valid form
2. Immediately submit again (within 1 second)
3. Submit a third time
4. Submit a fourth time

- [ ] **First 3 submissions** succeed and show success messages
- [ ] **Fourth submission** fails with error message
- [ ] Error says: "Too many requests. Please wait a few minutes before trying again."
- [ ] **Error panel is red** with alert icon
- [ ] **Phone number link** appears in error message: "(313) 555-1234"
- [ ] **Submit button re-enabled** after error (user can retry)

### Test: Rate Limit Reset

1. Wait 15 minutes (or adjust `RATE_LIMIT_WINDOW_MINUTES` in script for testing)
2. Submit form again

- [ ] **Submission succeeds** (rate limit has reset)
- [ ] **Email sent** successfully

### Test: Different Users (Different IPs)

Note: This is harder to test locally. In production:

- [ ] Rate limiting is **per IP address**
- [ ] One user hitting the limit doesn't affect others

---

## 7. Client-Side Deduplication

### Test: Duplicate Submission Warning

1. Fill out form with specific data:
   ```
   Patient Name: Test Duplicate
   DOB: 2000-01-01
   Phone: 5555551234
   Medications: Test Med
   ```
2. Submit successfully
3. **Immediately** fill out the same form with the **exact same data**
4. Submit again (within 10 minutes)

- [ ] **Browser shows confirmation dialog**: "It looks like you may have already submitted this request recently. Do you want to submit it again?"
- [ ] Click **"Cancel"**
- [ ] **Submission cancelled**, error shown: "Submission cancelled - duplicate detected."
- [ ] Click **"OK"** (after re-filling)
- [ ] **Submission proceeds** (user override works)

### Test: Slightly Different Data

1. Submit form with data
2. Change one field slightly (e.g., add a character to medications)
3. Submit again

- [ ] **No duplicate warning** (data is different enough)
- [ ] **Submission succeeds**

---

## 8. Server-Side Deduplication

### Test: Server Detects Duplicate

This tests the Google Apps Script's deduplication:

1. Submit a form
2. Within 2 minutes, submit the **exact same data** again (using console or manually)
3. The form should accept it client-side (if client dedupe is bypassed)
4. But server should silently discard it

- [ ] **Form shows success message**
- [ ] **Only ONE email received** (server dedupe worked)
- [ ] Check Google Apps Script **Executions** log
- [ ] Should show "Duplicate submission detected" in logs (if DEBUG enabled)

---

## 9. Error Handling

### Test: Network Failure

1. Open Developer Tools → Network tab
2. Enable **"Offline"** mode (throttle dropdown)
3. Submit form

- [ ] **Error panel appears** (red background)
- [ ] Error message: "We couldn't send your request. Please try again or call the pharmacy at (313) 555-1234."
- [ ] **Phone number is clickable** (tel: link)
- [ ] **Submit button re-enabled** (user can retry)
- [ ] **Form data preserved** (fields not cleared)

### Test: Invalid Endpoint

1. Set `NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT` to an invalid URL
2. Restart dev server
3. Submit form

- [ ] **Error panel appears**
- [ ] Generic error message shown
- [ ] **Console shows network error** (404 or similar)

### Test: Script Error (500)

This requires temporarily breaking the Google Apps Script:

1. In the script, add `throw new Error('Test error');` at the top of `doPost`
2. Submit form

- [ ] **Error panel appears**
- [ ] Error message: "We couldn't send your request. Please try again or call the pharmacy..."
- [ ] **Script logs show error** in Executions

### Test: Missing Endpoint Configuration

1. Remove endpoint from `.env.local` and `config/form-endpoint.json`
2. Restart dev server
3. Submit form

- [ ] **Error panel appears**
- [ ] Error says: "Pharmacy form endpoint not configured. Please set NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT..."
- [ ] Clear guidance for fixing the issue

---

## 10. Non-JavaScript Fallback

### Test: Form with JS Disabled

1. Disable JavaScript in browser:
   - Chrome: Settings → Privacy → Site Settings → JavaScript → Blocked
   - Firefox: about:config → javascript.enabled → false
2. Navigate to `/pharmacy/refill`
3. Fill out and submit form

- [ ] **Form still submits** (`<form method="POST">` fallback)
- [ ] **Noscript message visible**: "JavaScript is disabled. The form will still work, but you'll be redirected..."
- [ ] After submit, **Google Apps Script returns JSON**
- [ ] Browser may show JSON response page (not ideal but functional)

**Note:** Full no-JS experience would require server-side rendering or a success page. This is acceptable for now since the form is functional.

### Test: Form with JS Enabled

- [ ] **Noscript message NOT visible** (hidden by browser)

---

## 11. Screen Reader & Keyboard Accessibility

### Test: Keyboard Navigation

1. Tab through entire form without using mouse
2. Test both forms (Refill and Transfer)

- [ ] **Tab order is logical** (top to bottom, left to right)
- [ ] **All inputs are focusable**
- [ ] **Focus indicators are visible** (blue ring or similar)
- [ ] **Submit button can be activated** with Enter or Space
- [ ] **Success/error panels are keyboard-dismissible** (Tab to X button, press Enter)

### Test: Screen Reader

Use a screen reader (NVDA, JAWS, VoiceOver, etc.):

- [ ] **Labels are announced** with each input
- [ ] **Required fields announced** as "required"
- [ ] **Error messages announced** when validation fails
- [ ] **Help text announced** with inputs (aria-describedby working)
- [ ] **Success message announced** when form submits (aria-live="polite")
- [ ] **Error message announced** immediately (aria-live="assertive")

---

## 12. Responsive Design & Mobile

### Test: Mobile Viewport

1. Resize browser to 375px wide (iPhone SE size)
2. Or use Chrome DevTools device emulation

- [ ] **Form fits viewport** (no horizontal scroll)
- [ ] **All fields are usable** (not cut off)
- [ ] **Text is readable** (not too small)
- [ ] **Submit button is full-width** and easy to tap
- [ ] **Padding and spacing appropriate** for touch targets

### Test: Tablet Viewport (768px)

- [ ] **Form looks good** at medium screen sizes
- [ ] **Max-width constraint** keeps form from being too wide (max-w-2xl)

### Test: Desktop (1920px)

- [ ] **Form centered** in viewport
- [ ] **Not too wide** (max-width respected)

---

## 13. Dark Mode Support

### Test: Dark Mode

1. Enable dark mode in OS or browser
2. Refresh page

- [ ] **Background color changes** (dark gray)
- [ ] **Text readable** (light on dark)
- [ ] **Form inputs styled** for dark mode
- [ ] **Borders visible** but not harsh
- [ ] **Success/error panels** have dark variants
- [ ] **No accessibility issues** (contrast ratios OK)

---

## 14. Email Formatting & Deliverability

### Test: HTML Email Rendering

Open received email in different clients:

- [ ] **Gmail web** — HTML renders correctly
- [ ] **Outlook** — HTML renders correctly
- [ ] **Apple Mail** — HTML renders correctly
- [ ] **Mobile Gmail app** — Renders correctly

### Test: Reply-To Functionality

1. Submit form with email: `test@example.com`
2. Receive email at pharmacy inbox
3. Click "Reply" in email client

- [ ] **Reply-To address** is `test@example.com` (patient's email)
- [ ] **NOT** the script's Gmail address
- [ ] Pharmacy can reply directly to patient

### Test: Missing Email Field

1. Submit form **without** filling the email field (it's optional)
2. Receive email

- [ ] **Email still sent** successfully
- [ ] **Reply-To not set** (or set to pharmacy email as fallback)
- [ ] Email body shows "Email: (empty)" or omits the field

### Test: Plain Text Alternative

1. View email source or switch to plain text view
2. Check that plain text body exists

- [ ] **Plain text version readable**
- [ ] **All fields present** in plain text
- [ ] **Formatting clear** (uses `===` headers, etc.)

---

## 15. Data Sanitization & Security

### Test: HTML Injection in Fields

Fill out form with potential XSS payloads:

```
Patient Name: <script>alert('XSS')</script>
Medications: <img src=x onerror=alert('XSS')>
Notes: <b>Bold text</b>
```

- [ ] **Form accepts submission** (frontend allows these characters)
- [ ] **Email received** shows escaped HTML
- [ ] **Script tags NOT executed** in email
- [ ] Shows literal text: `&lt;script&gt;alert('XSS')&lt;/script&gt;`
- [ ] **No alert popup** when viewing email

### Test: SQL Injection (N/A)

This app doesn't use SQL, but test special characters:

```
Patient Name: O'Brien
Medications: "Test" 'Test'
Notes: DROP TABLE users; --
```

- [ ] **Form accepts** (no SQL to inject)
- [ ] **Characters properly escaped** in email
- [ ] No errors

### Test: Very Long Input

Fill a textarea with 2000 characters (more than max):

- [ ] **Frontend blocks** at 1500 characters (maxLength attribute)
- [ ] If you bypass and submit (via console), **backend truncates** to 1500 chars
- [ ] **Email sent** successfully with truncated data

---

## 16. Google Apps Script Logging (Optional)

### Test: Enable Sheets Logging

1. In Google Apps Script, set `ENABLE_SHEETS_LOGGING = true`
2. Deploy new version
3. Submit a form

- [ ] **Google Sheet created** in your Drive: "Pharmacy Form Submissions"
- [ ] **Headers present**: Timestamp, Type, Patient Name, etc.
- [ ] **Data row appended** with submission data
- [ ] **Timestamp formatted** correctly (ISO 8601 or Google Sheets date)

### Test: Disable Sheets Logging

1. Set `ENABLE_SHEETS_LOGGING = false`
2. Deploy new version
3. Submit a form

- [ ] **Email still sent**
- [ ] **No sheet created or updated**

---

## 17. Production Deployment

### Test: Build for Production

```bash
npm run build
```

- [ ] **Build succeeds** without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Test: Production Server

```bash
npm start
```

- [ ] **Forms load** correctly
- [ ] **Submissions work** in production mode
- [ ] **Environment variables read** correctly
- [ ] Console logs **disabled** in production (no sensitive data logged)

### Test: Deployed on Vercel/Netlify

Deploy to your hosting provider:

- [ ] **Forms accessible** at `/pharmacy/refill` and `/pharmacy/transfer`
- [ ] **Submissions work** from production domain
- [ ] **Emails delivered** successfully
- [ ] **No CORS errors** (Google Apps Script accepts requests from any origin)

---

## 18. Performance & Usability

### Test: Form Submission Speed

- [ ] **Submission takes < 3 seconds** (usually < 1 second)
- [ ] **Loading spinner visible** during submission
- [ ] **No UI freeze** or lag

### Test: Character Counter Updates

- [ ] **Counter updates in real-time** as you type in textareas
- [ ] **Shows correct count**: "0/1500", "150/1500", etc.
- [ ] **Turns red** when approaching limit (optional, currently not implemented)

### Test: Help Text & User Guidance

- [ ] **Help text is useful** ("Optional - we'll use this for the reply-to address")
- [ ] **Error messages are actionable** (tell user what's wrong and how to fix)
- [ ] **Success message is reassuring** ("Thanks — your request was sent...")

---

## 19. Edge Cases

### Test: Special Characters in Names

```
Patient Name: José María O'Brien-Smith
```

- [ ] **Form accepts** special characters
- [ ] **Email displays correctly** (UTF-8 encoding works)

### Test: Very Old Date of Birth

```
DOB: 1920-01-01
```

- [ ] **Form accepts**
- [ ] **Email shows correctly**

### Test: Phone with International Format

```
Phone: +447911123456 (UK number)
```

- [ ] **Form accepts** (allows + and 10-17 chars)
- [ ] **Normalized correctly**: `+447911123456`
- [ ] **Email shows as tel: link**

### Test: Empty Optional Fields

Submit form with only required fields filled:

- [ ] **Email field empty** → accepted
- [ ] **Rx Number empty** → accepted
- [ ] **Notes empty** → accepted
- [ ] Email sent successfully, omits or shows "(empty)" for optional fields

---

## 20. Browser Compatibility

Test in multiple browsers:

### Chrome/Edge (Chromium)
- [ ] All tests pass

### Firefox
- [ ] All tests pass

### Safari
- [ ] All tests pass
- [ ] Date picker works (Safari has different date input)

### Mobile Safari (iOS)
- [ ] All tests pass
- [ ] Date picker native to iOS

### Mobile Chrome (Android)
- [ ] All tests pass

---

## Final Checklist

Before going live:

- [ ] ✅ All acceptance tests pass
- [ ] ✅ Google Apps Script deployed with correct `PHARMACY_EMAIL`
- [ ] ✅ Endpoint URL configured in production environment
- [ ] ✅ Test email received and formatted correctly
- [ ] ✅ Rate limiting tested and working
- [ ] ✅ Honeypot tested and working
- [ ] ✅ Phone number in error messages updated to real pharmacy number
- [ ] ✅ Privacy disclaimer reviewed and approved
- [ ] ✅ Forms accessible via public URLs
- [ ] ✅ Monitoring plan in place (check inbox regularly)
- [ ] ✅ Backup plan if script fails (phone number prominently displayed)

---

## Ongoing Monitoring

After launch:

- [ ] **Check pharmacy inbox daily** for form submissions
- [ ] **Monitor Google Apps Script Executions** for errors
- [ ] **Review rate limit triggers** (too many false positives?)
- [ ] **Collect user feedback** (are forms easy to use?)
- [ ] **Check spam folder** (emails being filtered?)
- [ ] **Test forms weekly** to ensure they still work

---

## Test Sign-Off

| Tester | Date | Result | Notes |
|--------|------|--------|-------|
|        |      | ☐ Pass ☐ Fail |       |
|        |      | ☐ Pass ☐ Fail |       |
|        |      | ☐ Pass ☐ Fail |       |

---

**Testing complete!** ✅

All tests passed → Ready for production deployment.

