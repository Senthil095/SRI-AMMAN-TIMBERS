# Vercel Deployment Configuration

## Environment Variables Required in Vercel Dashboard

Copy these exactly into Vercel Project Settings → Environment Variables:

### **Frontend Variables (VITE_*)**
These are used by React frontend and must be prefixed with `VITE_`:

```
VITE_FIREBASE_API_KEY=AIzaSyDlNCmT8E-kltQlAcpVXzFxLWfwf9AxBnE
VITE_FIREBASE_AUTH_DOMAIN=paint-shop-87ae4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=paint-shop-87ae4
VITE_FIREBASE_STORAGE_BUCKET=paint-shop-87ae4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=329285676611
VITE_FIREBASE_APP_ID=1:329285676611:web:508faa9e77881e16b36ef6
VITE_ADMIN_ID=adminSATH
VITE_ADMIN_PASSWORD=sriadmin2026
```

### **Backend Variables (API Functions)**
These are used by serverless API functions in /api folder:

```
RAZORPAY_KEY_ID=your_actual_razorpay_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret

FIREBASE_PROJECT_ID=paint-shop-87ae4
FIREBASE_PRIVATE_KEY=your_firebase_private_key_here
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email

EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

---

## How to Get These Values

### **Firebase Variables:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: "paint-shop-87ae4"
3. Go to Project Settings → Service Accounts
4. Copy `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID`

### **Razorpay Variables:**
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret

### **Gmail App Password (for email):**
1. Enable 2FA on your Gmail account
2. Go to myaccount.google.com → Security → App passwords
3. Create app password for "Mail" → "Windows Computer"
4. Use this 16-character password as `EMAIL_PASSWORD`

---

## Vercel Dashboard Setup

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Open your project**: "sri-amman-timbers"
3. **Go to Settings → Environment Variables**
4. **Add each variable above with its actual value**
5. **Important**: Check all 3 environments (Production, Preview, Development)

---

## Variables Scope in Vercel

When adding env vars in Vercel, add them for:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## .env.local Format (for local testing)

Create a `.env.local` file in root for local development:

```
VITE_FIREBASE_API_KEY=AIzaSyDlNCmT8E-kltQlAcpVXzFxLWfwf9AxBnE
VITE_FIREBASE_AUTH_DOMAIN=paint-shop-87ae4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=paint-shop-87ae4
VITE_FIREBASE_STORAGE_BUCKET=paint-shop-87ae4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=329285676611
VITE_FIREBASE_APP_ID=1:329285676611:web:508faa9e77881e16b36ef6
VITE_ADMIN_ID=adminSATH
VITE_ADMIN_PASSWORD=sriadmin2026
VITE_BACKEND_URL=http://localhost:5000

RAZORPAY_KEY_ID=your_actual_razorpay_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret
FIREBASE_PROJECT_ID=paint-shop-87ae4
FIREBASE_PRIVATE_KEY=your_firebase_private_key_here
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```
