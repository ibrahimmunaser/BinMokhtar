/**
 * Xpress Care Pharmacy - Form Submission Handler
 * Google Apps Script Web App
 * 
 * This script receives form submissions from the pharmacy website,
 * validates them, rate-limits abuse, and sends formatted emails.
 * 
 * DEPLOYMENT:
 * 1. Copy this entire script
 * 2. Go to script.google.com
 * 3. Create new project → paste code
 * 4. Deploy → New deployment → Web app
 * 5. Settings: Execute as "Me", Access "Anyone"
 * 6. Copy the Web App URL to your website config
 * 
 * See GAS_SETUP.md for detailed instructions with screenshots.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

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

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * doPost - Handles POST requests from the website forms
 */
function doPost(e) {
  try {
    if (DEBUG) {
      Logger.log('Received POST request');
      Logger.log('Content type: ' + e.postData.type);
    }

    // Parse incoming data (supports both URL-encoded and JSON)
    let data;
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      data = parseUrlEncoded(e.postData.contents);
    } else if (e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      return jsonResponse({ ok: false, error: 'unsupported_content_type' });
    }

    if (DEBUG) {
      Logger.log('Parsed data: ' + JSON.stringify(data));
    }

    // Honeypot check - reject if "website" field is filled
    if (data.website && data.website.trim() !== '') {
      // Silently accept but don't send email (likely spam)
      if (DEBUG) {
        Logger.log('Honeypot triggered - silent discard');
      }
      return jsonResponse({ ok: true });
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(e);
    if (!rateLimitResult.ok) {
      if (DEBUG) {
        Logger.log('Rate limit exceeded');
      }
      return jsonResponse({ ok: false, error: 'rate_limited' });
    }

    // Sanitize and validate all fields
    const sanitized = sanitizeFormData(data);
    
    if (!sanitized.patientName || !sanitized.dob || !sanitized.phone || !sanitized.medications) {
      return jsonResponse({ ok: false, error: 'missing_required_fields' });
    }

    // Check for duplicate submission (server-side deduplication)
    if (isDuplicateSubmission(sanitized)) {
      if (DEBUG) {
        Logger.log('Duplicate submission detected');
      }
      // Accept but don't send duplicate email
      return jsonResponse({ ok: true });
    }

    // Compose and send email
    sendPharmacyEmail(sanitized);

    // Optional: Log to Google Sheets
    if (ENABLE_SHEETS_LOGGING) {
      logToSheet(sanitized);
    }

    if (DEBUG) {
      Logger.log('Email sent successfully');
    }

    return jsonResponse({ ok: true });
    
  } catch (error) {
    Logger.log('Error processing request: ' + error.toString());
    return jsonResponse({ ok: false, error: 'internal_error' });
  }
}

/**
 * doGet - Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput('Xpress Care Pharmacy Form Handler is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================================
// PARSING & SANITIZATION
// ============================================================================

/**
 * Parse URL-encoded form data
 */
function parseUrlEncoded(content) {
  const data = {};
  const pairs = content.split('&');
  
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    if (pair.length === 2) {
      const key = decodeURIComponent(pair[0]);
      const value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
      data[key] = value;
    }
  }
  
  return data;
}

/**
 * Sanitize form data - escape HTML, trim, enforce length limits
 */
function sanitizeFormData(data) {
  return {
    patientName: sanitizeString(data.patientName || '', 100),
    dob: sanitizeString(data.dob || '', 20),
    phone: sanitizeString(data.phone || '', 17),
    email: sanitizeString(data.email || '', 120),
    medications: sanitizeString(data.medications || '', 1500),
    rxNumber: sanitizeString(data.rxNumber || '', 40),
    notes: sanitizeString(data.notes || '', 1500),
    fromPharmacy: sanitizeString(data.fromPharmacy || '', 120),
    fromPharmacyPhone: sanitizeString(data.fromPharmacyPhone || '', 17),
    type: data.type === 'transfer' ? 'transfer' : 'refill',
    ts: sanitizeString(data.ts || new Date().toISOString(), 30),
  };
}

/**
 * Sanitize a single string field
 */
function sanitizeString(value, maxLength) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  // Trim and enforce max length
  value = value.trim().substring(0, maxLength);
  
  // Escape HTML special characters
  value = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return value;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if request exceeds rate limit
 * Uses CacheService to track requests per IP
 */
function checkRateLimit(e) {
  try {
    // Get requester's IP (if available)
    const ip = e.parameter.userIp || e.parameters.userIp || 'unknown';
    const cacheKey = 'ratelimit_' + ip;
    
    const cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    
    let count = 0;
    if (cached) {
      count = parseInt(cached, 10);
    }
    
    // Check if exceeded
    if (count >= RATE_LIMIT_MAX) {
      return { ok: false };
    }
    
    // Increment counter
    count++;
    const ttl = RATE_LIMIT_WINDOW_MINUTES * 60; // seconds
    cache.put(cacheKey, count.toString(), ttl);
    
    return { ok: true };
  } catch (error) {
    // If rate limiting fails, allow the request
    Logger.log('Rate limit check failed: ' + error.toString());
    return { ok: true };
  }
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check for duplicate submissions using CacheService
 * Creates a hash of key fields and checks if seen recently
 */
function isDuplicateSubmission(data) {
  try {
    // Create a hash of critical fields
    const key = [
      data.patientName,
      data.dob,
      data.phone,
      data.type,
      data.medications.substring(0, 50)
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const cacheKey = 'dedup_' + Math.abs(hash);
    const cache = CacheService.getScriptCache();
    
    // Check if we've seen this submission in the last 2 minutes
    const cached = cache.get(cacheKey);
    if (cached) {
      return true; // Duplicate
    }
    
    // Mark as seen for 2 minutes
    cache.put(cacheKey, '1', 120);
    
    return false; // Not a duplicate
  } catch (error) {
    Logger.log('Duplicate check failed: ' + error.toString());
    return false; // Allow if check fails
  }
}

// ============================================================================
// EMAIL COMPOSITION & SENDING
// ============================================================================

/**
 * Send formatted email to pharmacy
 */
function sendPharmacyEmail(data) {
  const isTransfer = data.type === 'transfer';
  const subject = `New ${data.type} request — ${data.patientName || 'Unknown'}`;
  
  // Compose HTML body
  const htmlBody = composeHtmlEmail(data, isTransfer);
  
  // Compose plain text body
  const textBody = composePlainTextEmail(data, isTransfer);
  
  // Email options
  const options = {
    htmlBody: htmlBody,
    replyTo: data.email || undefined,
  };
  
  // Send email
  MailApp.sendEmail(
    PHARMACY_EMAIL,
    subject,
    textBody,
    options
  );
}

/**
 * Compose HTML email body with table
 */
function composeHtmlEmail(data, isTransfer) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; font-weight: 600; width: 180px; }
    .section { margin-top: 30px; }
    .section-title { font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 10px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${isTransfer ? 'Prescription Transfer' : 'Prescription Refill'} Request</h1>
    
    <table>
      <tr>
        <th>Patient Name:</th>
        <td>${data.patientName}</td>
      </tr>
      <tr>
        <th>Date of Birth:</th>
        <td>${data.dob}</td>
      </tr>
      <tr>
        <th>Phone Number:</th>
        <td><a href="tel:${data.phone}">${data.phone}</a></td>
      </tr>`;
  
  if (data.email) {
    html += `
      <tr>
        <th>Email:</th>
        <td><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>`;
  }
  
  html += `
    </table>`;
  
  // Transfer-specific fields
  if (isTransfer) {
    html += `
    <div class="section">
      <div class="section-title">Previous Pharmacy</div>
      <table>
        <tr>
          <th>Pharmacy Name:</th>
          <td>${data.fromPharmacy}</td>
        </tr>
        <tr>
          <th>Pharmacy Phone:</th>
          <td><a href="tel:${data.fromPharmacyPhone}">${data.fromPharmacyPhone}</a></td>
        </tr>
      </table>
    </div>`;
  }
  
  // Prescription information
  html += `
    <div class="section">
      <div class="section-title">Prescription Information</div>
      <table>
        <tr>
          <th>Medications:</th>
          <td style="white-space: pre-wrap;">${data.medications}</td>
        </tr>`;
  
  if (data.rxNumber) {
    html += `
        <tr>
          <th>Rx Number:</th>
          <td>${data.rxNumber}</td>
        </tr>`;
  }
  
  if (data.notes) {
    html += `
        <tr>
          <th>Notes:</th>
          <td style="white-space: pre-wrap;">${data.notes}</td>
        </tr>`;
  }
  
  html += `
      </table>
    </div>
    
    <div class="footer">
      <p>Submitted: ${data.ts}</p>
      <p>Request Type: ${data.type}</p>
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Compose plain text email body
 */
function composePlainTextEmail(data, isTransfer) {
  let text = isTransfer 
    ? '=== PRESCRIPTION TRANSFER REQUEST ===\n\n'
    : '=== PRESCRIPTION REFILL REQUEST ===\n\n';
  
  text += 'PATIENT INFORMATION\n';
  text += '-------------------\n';
  text += 'Name: ' + data.patientName + '\n';
  text += 'Date of Birth: ' + data.dob + '\n';
  text += 'Phone: ' + data.phone + '\n';
  if (data.email) {
    text += 'Email: ' + data.email + '\n';
  }
  text += '\n';
  
  if (isTransfer) {
    text += 'PREVIOUS PHARMACY\n';
    text += '-----------------\n';
    text += 'Pharmacy Name: ' + data.fromPharmacy + '\n';
    text += 'Pharmacy Phone: ' + data.fromPharmacyPhone + '\n';
    text += '\n';
  }
  
  text += 'PRESCRIPTION INFORMATION\n';
  text += '------------------------\n';
  text += 'Medications:\n' + data.medications + '\n\n';
  
  if (data.rxNumber) {
    text += 'Rx Number: ' + data.rxNumber + '\n';
  }
  
  if (data.notes) {
    text += '\nAdditional Notes:\n' + data.notes + '\n';
  }
  
  text += '\n-------------------\n';
  text += 'Submitted: ' + data.ts + '\n';
  text += 'Request Type: ' + data.type + '\n';
  
  return text;
}

// ============================================================================
// GOOGLE SHEETS LOGGING (OPTIONAL)
// ============================================================================

/**
 * Log submission to Google Sheets (if enabled)
 */
function logToSheet(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('Pharmacy Form Logs');
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      
      // Add headers
      const headers = [
        'Timestamp',
        'Type',
        'Patient Name',
        'DOB',
        'Phone',
        'Email',
        'Medications',
        'Rx Number',
        'Notes',
        'From Pharmacy',
        'From Pharmacy Phone'
      ];
      sheet.appendRow(headers);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    // Append data row
    sheet.appendRow([
      new Date(data.ts),
      data.type,
      data.patientName,
      data.dob,
      data.phone,
      data.email,
      data.medications,
      data.rxNumber,
      data.notes,
      data.fromPharmacy,
      data.fromPharmacyPhone
    ]);
    
    if (DEBUG) {
      Logger.log('Logged to sheet: ' + SHEET_NAME);
    }
  } catch (error) {
    Logger.log('Sheet logging failed: ' + error.toString());
    // Don't fail the request if logging fails
  }
}

// ============================================================================
// RESPONSE HELPER
// ============================================================================

/**
 * Return JSON response with proper headers
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

