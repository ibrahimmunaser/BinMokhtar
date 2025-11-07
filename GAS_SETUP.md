# Google Apps Script Setup Guide

This guide will walk you through deploying the pharmacy form email relay using Google Apps Script. No coding experience required! Just follow these steps carefully.

## Prerequisites

- A Google Account (Gmail)
- Access to the pharmacy Gmail account: **Pharmacy.xpresscare@gmail.com**

## What This Does

The Google Apps Script acts as a free email relay for your pharmacy forms. When a patient submits a refill or transfer request:

1. The form data is sent to your script
2. The script validates and sanitizes the data
3. It sends a formatted email to the pharmacy inbox
4. It protects against spam and abuse with rate limiting

**Important:** The script runs under YOUR Google account, so emails will be sent from you on behalf of the pharmacy.

---

## Step 1: Access Google Apps Script

1. **Open your web browser** and sign in to the Gmail account you want to use
2. **Navigate to** [script.google.com](https://script.google.com)
3. If prompted, allow Google Apps Script to access your account

---

## Step 2: Create a New Project

1. Click the **"+ New project"** button in the top-left corner
2. A new editor window will open with some default code
3. You'll see a file called `Code.gs` in the left sidebar

---

## Step 3: Replace the Default Code

1. **Select all the default code** in the editor (Ctrl+A or Cmd+A)
2. **Delete it**
3. **Open the file** `scripts/google-apps-script.js` from this project
4. **Copy all the code** from that file
5. **Paste it** into the Google Apps Script editor

---

## Step 4: Configure the Script (Optional)

At the top of the script, you'll see a CONFIGURATION section:

```javascript
// Set to true to enable Google Sheets logging (optional)
const ENABLE_SHEETS_LOGGING = false;

// Sheet name for logging (will be created if it doesn't exist)
const SHEET_NAME = 'Pharmacy Form Submissions';

// Recipient email (pharmacy inbox)
const PHARMACY_EMAIL = 'Pharmacy.xpresscare@gmail.com';

// Rate limiting: max submissions per IP per time window
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MINUTES = 15;

// Set to true to enable debug logging via Logger.log()
const DEBUG = false;
```

### Configuration Options:

- **PHARMACY_EMAIL**: Make sure this matches your actual pharmacy email
- **ENABLE_SHEETS_LOGGING**: Set to `true` if you want to log all submissions to a Google Sheet
- **RATE_LIMIT_MAX**: Maximum submissions per IP address within the time window (default: 3)
- **RATE_LIMIT_WINDOW_MINUTES**: Time window for rate limiting (default: 15 minutes)
- **DEBUG**: Set to `true` to enable detailed logging (for troubleshooting)

---

## Step 5: Name Your Project

1. Click on **"Untitled project"** at the top-left
2. Rename it to something like: **"Xpress Care Pharmacy Form Handler"**
3. The project will auto-save

---

## Step 6: Deploy as Web App

1. Click the **"Deploy"** button in the top-right corner (looks like a ship icon)
2. Select **"New deployment"** from the dropdown
3. A dialog will appear

### Deployment Settings:

1. **Click the gear icon** (⚙️) next to "Select type"
2. Choose **"Web app"**
3. Fill in the settings:

   - **Description**: `Pharmacy forms email relay` (optional)
   - **Execute as**: Select **"Me (your@email.com)"**
   - **Who has access**: Select **"Anyone"**

4. Click **"Deploy"**

### Important Notes:

- **"Execute as: Me"** means the script runs under your account and sends emails from you
- **"Anyone"** means anyone with the URL can submit forms (this is necessary for your website)
- Don't worry—the script has built-in spam protection (honeypot + rate limiting)

---

## Step 7: Authorize the Script

1. Google will show an **authorization screen**
2. Click **"Authorize access"**
3. Select your Google account
4. You may see a warning: **"Google hasn't verified this app"**
   - This is normal for personal scripts
   - Click **"Advanced"**
   - Click **"Go to [Project Name] (unsafe)"** (it's safe—it's your own script!)
5. Click **"Allow"** to grant the necessary permissions:
   - Send emails on your behalf
   - Access spreadsheets (if logging is enabled)
   - Use cache service (for rate limiting)

---

## Step 8: Copy Your Web App URL

1. After authorization, you'll see a **"Deployment"** dialog
2. **Copy the Web App URL** — it will look like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```
3. **Keep this URL safe!** You'll need it in the next step
4. Click **"Done"**

---

## Step 9: Configure Your Website

You now need to tell your website where to send form submissions.

### Option A: Environment Variable (Recommended)

1. Create or edit the file `.env.local` in your project root
2. Add this line (replace with YOUR actual URL):
   ```
   NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Restart your development server

### Option B: JSON Config File

1. Open the file `config/form-endpoint.json`
2. Replace the empty string with your Web App URL:
   ```json
   {
     "pharmacyFormEndpoint": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
   }
   ```
3. Save the file

**Note:** The environment variable (Option A) will take precedence if both are set.

---

## Step 10: Test Your Setup

### Test 1: Direct Script Test

1. In Google Apps Script, click **"Deploy"** → **"Test deployments"**
2. Copy the test URL
3. Open it in your browser
4. You should see: `"Xpress Care Pharmacy Form Handler is running."`

### Test 2: Form Submission Test

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/pharmacy/refill`
3. Fill out the form with test data
4. Submit it
5. Check the pharmacy inbox for the email

### Test 3: Honeypot Test

1. Open your browser's Developer Console (F12)
2. In the Console tab, run:
   ```javascript
   document.querySelector('[name="website"]').value = 'spam';
   ```
3. Submit the form
4. It should accept the submission but NOT send an email (spam protection working!)

### Test 4: Rate Limit Test

1. Submit the form 3 times quickly
2. On the 4th submission, you should get an error: "Too many requests"
3. Wait 15 minutes and try again—it should work

---

## Troubleshooting

### Problem: "Script function not found"

**Solution:**
- Make sure you copied ALL the code from `scripts/google-apps-script.js`
- Make sure the functions `doPost` and `doGet` exist in your script
- Try redeploying: Deploy → Manage deployments → Edit → Version: New Version → Deploy

### Problem: "Authorization required"

**Solution:**
- You need to re-authorize the script
- Go to Deploy → Manage deployments → Edit
- You'll be prompted to authorize again

### Problem: "No emails arriving"

**Solution:**
1. Check the pharmacy email's spam folder
2. In Google Apps Script, click **"Executions"** in the left sidebar
3. Look for errors in recent executions
4. Enable `DEBUG = true` in the script configuration
5. Check the logs: View → Logs (or Executions → click on an execution → View logs)

### Problem: "Form submission fails"

**Solution:**
1. Check the browser console for errors (F12 → Console tab)
2. Make sure the endpoint URL is correctly configured
3. Test the script URL directly in a browser (should show "is running")
4. Check CORS: the script should accept requests from any origin

### Problem: "Invalid recipient" error

**Solution:**
- Check that `PHARMACY_EMAIL` in the script matches the correct email address
- Make sure there are no extra spaces or typos

---

## Optional: Enable Google Sheets Logging

If you want to keep a log of all form submissions in a Google Sheet:

1. In the Google Apps Script editor, change:
   ```javascript
   const ENABLE_SHEETS_LOGGING = true;
   ```
2. Click **"Save project"** (disk icon)
3. Click **"Deploy"** → **"Manage deployments"**
4. Click the **Edit** icon (pencil)
5. Change **"Version"** to **"New version"**
6. Click **"Deploy"**
7. The next form submission will create a new Google Sheet
8. Check your Google Drive for a sheet named "Pharmacy Form Submissions"

---

## Optional: Set Up Email Notifications

Get notified every time someone submits a form:

1. In Google Apps Script, click **"Triggers"** in the left sidebar (clock icon)
2. Click **"Add Trigger"**
3. Configure:
   - Choose which function to run: `doPost`
   - Choose which deployment should run: `Head`
   - Select event source: `From spreadsheet` (if using Sheets logging)
   - Or set up email notifications manually in Gmail

**Better approach:** Just check the pharmacy inbox regularly, as all submissions already go there!

---

## Security & Privacy Notes

### What's Protected:

✅ **Honeypot**: Bots filling hidden fields are silently rejected  
✅ **Rate limiting**: Maximum 3 submissions per IP per 15 minutes  
✅ **Sanitization**: All user input is escaped to prevent injection attacks  
✅ **Deduplication**: Identical submissions within 2 minutes are blocked  
✅ **Field validation**: Length limits enforced server-side  

### What's NOT Protected:

⚠️ **Email is not HIPAA-compliant**: Patients are warned via disclaimer  
⚠️ **PHI is transmitted**: The form collects health information  
⚠️ **No encryption at rest**: Emails and logs are stored unencrypted  

### Recommendations:

- Monitor form submissions regularly
- If you need HIPAA compliance, upgrade to a secure solution
- Consider adding reCAPTCHA v3 for additional spam protection (see next section)

---

## Optional: Add reCAPTCHA v3

To add Google reCAPTCHA v3 protection (recommended for production):

### Frontend Setup:

1. Get reCAPTCHA v3 keys from [google.com/recaptcha](https://www.google.com/recaptcha)
2. Add the site key to your `.env.local`:
   ```
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
   ```
3. Install the reCAPTCHA package:
   ```bash
   npm install react-google-recaptcha-v3
   ```

### Script Setup:

1. In the Google Apps Script, add verification at the top of `doPost`:
   ```javascript
   // Verify reCAPTCHA token (if present)
   if (data.recaptchaToken) {
     const isValid = verifyRecaptcha(data.recaptchaToken);
     if (!isValid) {
       return jsonResponse({ ok: false, error: 'recaptcha_failed' });
     }
   }
   ```

2. Add the verification function:
   ```javascript
   function verifyRecaptcha(token) {
     const secretKey = 'YOUR_RECAPTCHA_SECRET_KEY';
     const url = 'https://www.google.com/recaptcha/api/siteverify';
     const payload = {
       secret: secretKey,
       response: token
     };
     
     const options = {
       method: 'post',
       payload: payload
     };
     
     const response = UrlFetchApp.fetch(url, options);
     const result = JSON.parse(response.getContentText());
     
     return result.success && result.score >= 0.5;
   }
   ```

---

## Updating the Script

If you need to update the script later:

1. Go to [script.google.com](https://script.google.com)
2. Open your project
3. Make your changes
4. Click **"Deploy"** → **"Manage deployments"**
5. Click the **Edit** icon (pencil) next to your Web app deployment
6. Change **"Version"** to **"New version"**
7. Click **"Deploy"**
8. You don't need to update the URL—it stays the same!

---

## Cost & Limits

Google Apps Script is **100% FREE** for this use case, but has quotas:

| Resource | Free Quota |
|----------|-----------|
| Email sends per day | 100 (G Suite: 1,500) |
| Script runtime | 6 minutes per execution |
| Triggers | 20 per script |
| URL Fetch calls | 20,000 per day |

For a small pharmacy, you'll never hit these limits.

---

## Support & Troubleshooting

### View Execution Logs

1. In Google Apps Script, click **"Executions"** in the left sidebar
2. See a history of all form submissions and any errors
3. Click on an execution to see detailed logs

### Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `rate_limited` | Too many submissions from same IP | Wait 15 minutes |
| `missing_required_fields` | Required fields empty | Check form validation |
| `unsupported_content_type` | Wrong content type | Check frontend is sending URL-encoded data |
| `internal_error` | Script crashed | Check Executions for details |

### Getting Help

1. Check the **Executions** log in Google Apps Script
2. Enable `DEBUG = true` and check the logs
3. Review the acceptance test checklist in `tests/forms.checklist.md`
4. Check the browser console for frontend errors

---

## Compliance Escalation Path

If your pharmacy later requires HIPAA-compliant email:

1. **Option 1: Use a HIPAA-compliant email service**
   - Sign up for Paubox, LuxSci, or similar
   - Update `PHARMACY_EMAIL` in the script
   - Update the disclaimer component

2. **Option 2: Switch to a custom backend**
   - Deploy a HIPAA-compliant server
   - Update the endpoint URL in your website config
   - No changes needed to the frontend forms!

The forms are designed to be endpoint-agnostic, so you can swap the backend without touching the frontend.

---

## Summary

✅ **What you should have now:**

- [ ] Google Apps Script project created and deployed
- [ ] Web App URL copied and configured in your website
- [ ] Test email received successfully
- [ ] Forms are live and accepting submissions

✅ **Next steps:**

- Test both the Refill and Transfer forms
- Monitor the pharmacy inbox
- Run through the acceptance tests (see `tests/forms.checklist.md`)
- Deploy to production when ready

---

## Quick Reference

### Your Web App URL:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Script Dashboard:
- **Edit Script**: [script.google.com](https://script.google.com)
- **View Executions**: Script Editor → Executions (left sidebar)
- **Manage Deployments**: Deploy → Manage deployments

### Website Configuration:
- **Config file**: `config/form-endpoint.json`
- **Environment variable**: `NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT`
- **Refill form**: `/pharmacy/refill`
- **Transfer form**: `/pharmacy/transfer`

---

## Need Help?

If you get stuck, check:

1. ✅ Execution logs in Google Apps Script
2. ✅ Browser console (F12) for frontend errors
3. ✅ `tests/forms.checklist.md` for testing guidance
4. ✅ This guide's Troubleshooting section

---

**You're all set! 🎉**

Your pharmacy forms are now live and ready to receive patient requests.

