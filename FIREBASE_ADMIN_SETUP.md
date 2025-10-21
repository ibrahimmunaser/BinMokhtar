# Firebase Admin SDK Setup Guide

The Firebase Admin SDK provides elevated server-side access for admin operations like creating/updating products, managing users, and more.

## Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your BMR project
3. Click the **gear icon** (⚙️) → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **"Generate new private key"**
6. A JSON file will download (e.g., `bmr-retail-firebase-adminsdk-xxxxx.json`)
7. **KEEP THIS FILE SECURE** - Never commit it to git!

## Step 2: Extract Service Account Credentials

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "xxxxx"
}
```

## Step 3: Add to Environment Variables

Add these values to your `.env.local` file:

```env
# From the JSON file:
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- Keep the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- The `\n` characters should be preserved (they represent newlines)
- Wrap the private key in quotes

## Step 4: Add to Vercel (for Production)

When deploying to Vercel:

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each of the three variables:
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (paste the entire key with \n characters)

## Step 5: Test the Connection

Run your dev server:

```bash
npm run dev
```

Try accessing an admin API endpoint. If configured correctly, you should see no errors in the console.

## Security Best Practices

### ✅ DO:
- Store service account keys as environment variables
- Add `serviceAccountKey.json` to `.gitignore`
- Use different service accounts for dev/staging/production
- Rotate keys periodically (every 90 days recommended)
- Restrict API routes to verified admin users

### ❌ DON'T:
- Never commit service account keys to git
- Never expose keys in client-side code
- Never share keys via email or chat
- Never use production keys in development

## API Routes Created

The following admin API routes are now available:

### Products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products` - Update product
- `DELETE /api/admin/products?id=xxx` - Delete product

### Categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories` - Update category
- `DELETE /api/admin/categories?id=xxx` - Delete category

### Settings
- `PUT /api/admin/settings` - Update site settings

All routes require:
- `x-user-email` header with admin email
- Admin email must be in `NEXT_PUBLIC_ADMIN_EMAILS`

## Troubleshooting

### Error: "Could not load the default credentials"
- Check that all three environment variables are set
- Verify the private key is properly formatted with \n characters
- Make sure you've restarted your dev server after adding variables

### Error: "Permission denied"
- Verify your service account has proper permissions
- Check Firebase Console → IAM & Admin → Service Accounts
- Ensure the service account has "Firebase Admin SDK Administrator Service Agent" role

### Error: "Invalid project ID"
- Double-check the project ID matches your Firebase project
- Verify there are no extra spaces in the environment variable

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Service Account Keys Best Practices](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

Your Firebase Admin SDK is now configured! 🔒




