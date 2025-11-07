# Form Configuration

## Setting the Pharmacy Form Endpoint

After deploying your Google Apps Script (see `GAS_SETUP.md`), you need to configure the endpoint URL.

### Option 1: Environment Variable (Recommended for production)

Add to your `.env.local`:

```
NEXT_PUBLIC_PHARMACY_FORM_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Option 2: JSON Config File (Fallback)

Edit `config/form-endpoint.json`:

```json
{
  "pharmacyFormEndpoint": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
}
```

The application will check the environment variable first, then fall back to the JSON file.

## How it Works

The `lib/pharmacy-form-config.ts` helper fetches the endpoint URL at runtime. If no URL is configured, it will throw a descriptive error to help with debugging.

