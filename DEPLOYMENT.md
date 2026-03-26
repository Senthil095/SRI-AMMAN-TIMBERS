# DEPLOYMENT GUIDE - PaintPro E-Commerce App

This guide explains how to deploy your Vite + React frontend to **Vercel** and Node.js Express backend to **Render**.

---

## OVERVIEW

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend (React + Vite) | Vercel | `https://your-app.vercel.app` |
| Backend (Express) | Render | `https://your-app.onrender.com` |
| Database | Firebase | (Shared credentials) |

---

## PHASE 1: PREPARE FOR DEPLOYMENT

### 1.1 Environment Variables - LOCAL SETUP

**Frontend (.env file in root):**
```
VITE_BACKEND_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=AIzaSyDlNCmT8E-kltQlAcpVXzFxLWfwf9AxBnE
VITE_FIREBASE_AUTH_DOMAIN=paint-shop-87ae4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=paint-shop-87ae4
VITE_FIREBASE_STORAGE_BUCKET=paint-shop-87ae4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=329285676611
VITE_FIREBASE_APP_ID=1:329285676611:web:508faa9e77881e16b36ef6
VITE_ADMIN_ID=adminSATH
VITE_ADMIN_PASSWORD=sriadmin2026
```

**Backend (.env file in /backend):**
```
PORT=5000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_STmcGRz2IgpoiV
RAZORPAY_KEY_SECRET=fZWig4xKhOVVw7eTGh0jIDVP
SMTP_USER=selvasenthil2006@gmail.com
SMTP_PASS=oorg fxjs mjoa lfzr
```

### 1.2 Test Locally First

```bash
# Terminal 1: Frontend
cd d:\CONS\SRI-AMMAN-TIMBERS
npm install
npm run dev

# Terminal 2: Backend
cd d:\CONS\SRI-AMMAN-TIMBERS\backend
npm install
npm start
```

Verify:
- ✅ Frontend loads at http://localhost:5173
- ✅ Backend health check: http://localhost:5000/api/health
- ✅ All features work (login, cart, checkout)

---

## PHASE 2: DEPLOY BACKEND TO RENDER

### 2.1 Prepare Backend for Render

**Step 1: Package.json Already Updated**
- ✅ `npm start` script added
- ✅ All dependencies listed
- ✅ Node.js version compatible

**Step 2: Ensure serviceAccountKey.json is NOT in git**

Your `backend/.gitignore` should contain:
```
serviceAccountKey.json
.env
node_modules/
```

(You'll upload serviceAccountKey.json manually to Render)

**Step 3: Push to GitHub**

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

### 2.2 Deploy Backend on Render

**Step 1: Go to https://render.com and sign up**

**Step 2: Create New Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Choose the backend repository (or main repo if monorepo)

**Step 3: Configure Service**

| Setting | Value |
|---------|-------|
| Name | `paintpro-backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free (or Starter if free is unavailable) |

**Step 4: Add Environment Variables**

In Render dashboard, go to **Environment** and add:

```
PORT=10000
HOST=0.0.0.0
FRONTEND_URL=https://your-app-name.vercel.app
RAZORPAY_KEY_ID=rzp_test_STmcGRz2IgpoiV
RAZORPAY_KEY_SECRET=fZWig4xKhOVVw7eTGh0jIDVP
SMTP_USER=selvasenthil2006@gmail.com
SMTP_PASS=oorg fxjs mjoa lfzr
```

**Step 5: Add Firebase Service Account Key**

Render doesn't support uploading JSON files directly. **Option A (Recommended): Use environment variable**

1. Go to your Render Service → Environment
2. Add a new variable: `FIREBASE_SERVICE_ACCOUNT=<paste entire JSON>`
3. Update `backend/firebaseAdmin.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

try {
  let serviceAccount;
  
  // Check if service account is in environment variable (for Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fall back to file (for local development)
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      throw new Error('Firebase credentials not found');
    }
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}
```

**Step 6: Deploy**

Click "Create Web Service" and wait ~2-3 minutes for deployment.

**Step 7: Get Backend URL**

Your backend will be available at: `https://paintpro-backend.onrender.com`

✅ Test it: https://paintpro-backend.onrender.com/api/health

---

## PHASE 3: DEPLOY FRONTEND TO VERCEL

### 3.1 Prepare Frontend

**Step 1: Update vite.config.js (Optional, already correct)**

Your `vite.config.js` is already properly configured for Vercel.

**Step 2: Verify .env variables are correct**

Frontend `.env` uses:
- `import.meta.env.VITE_*` (Vite automatically exposes these)
- Already configured in src/firebase.js ✅
- Already configured in API calls ✅

### 3.2 Deploy Frontend on Vercel

**Step 1: Go to https://vercel.com and sign up**

**Step 2: Import Project**
1. Click "Add New..." → "Project"
2. Select your GitHub repository
3. Click "Import"

**Step 3: Configure Project**

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

**Step 4: Add Environment Variables**

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```
VITE_BACKEND_URL=https://paintpro-backend.onrender.com
VITE_FIREBASE_API_KEY=AIzaSyDlNCmT8E-kltQlAcpVXzFxLWfwf9AxBnE
VITE_FIREBASE_AUTH_DOMAIN=paint-shop-87ae4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=paint-shop-87ae4
VITE_FIREBASE_STORAGE_BUCKET=paint-shop-87ae4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=329285676611
VITE_FIREBASE_APP_ID=1:329285676611:web:508faa9e77881e16b36ef6
VITE_ADMIN_ID=adminSATH
VITE_ADMIN_PASSWORD=sriadmin2026
```

⚠️ **IMPORTANT:** Make sure `VITE_BACKEND_URL` points to your **Render backend URL** (with https://)

**Step 5: Deploy**

Click "Deploy" and wait ~1-2 minutes.

**Step 6: Get Frontend URL**

Your frontend will be available at: `https://paintpro.vercel.app` (or custom domain)

---

## PHASE 4: CONNECT FRONTEND ↔ BACKEND

### 4.1 Update Render CORS

Go back to **Render** → Your Backend Service → **Environment** and update:

```
FRONTEND_URL=https://paintpro.vercel.app
```

This ensures the backend only accepts requests from your frontend.

### 4.2 Test API Connection

In frontend browser console:
```javascript
// Test API call
fetch('https://paintpro-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

Expected output:
```json
{ "status": "ok", "message": "Backend is running" }
```

### 4.3 Test Full Flow

1. **Frontend Authentication**
   - Visit https://paintpro.vercel.app
   - Sign up / Login (Firebase)
   - ✅ Should work

2. **Cart & Checkout**
   - Add items to cart
   - Go to checkout
   - ✅ Should connect to backend at VITE_BACKEND_URL

3. **Razorpay Payment**
   - Click "Pay Now"
   - ✅ Should create Razorpay order on backend

4. **Order Tracking**
   - ✅ Should fetch orders from backend

---

## TROUBLESHOOTING

### Frontend shows "Backend URL not found" error

**Issue:** Environment variable not loaded
**Fix:**
```bash
# Locally
npm run build  # Test production build
npm run preview

# On Vercel
- Check Environment Variables are set
- Redeploy: Settings → Deployments → Redeploy
```

### CORS error: "Not allowed by CORS"

**Issue:** Frontend domain not in backend CORS whitelist
**Fix:**
1. Verify `FRONTEND_URL` in Render
2. Backend CORS config in `server.js` has correct domains
3. Ensure https:// is used in production

### Firebase not working

**Issue:** Service account credentials not loaded
**Fix:**
1. Verify `FIREBASE_SERVICE_ACCOUNT` in Render environment
2. Check permissions in Firebase Console → Service Accounts
3. Ensure Firestore rules allow read/write

### Payment not working

**Issue:** Razorpay keys are test keys
**Fix:**
1. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render
2. Get live keys from Razorpay Dashboard
3. Redeploy backend

### Cannot send emails

**Issue:** Gmail app password expired
**Fix:**
1. Generate new app-specific password from Google Account
2. Update `SMTP_PASS` in Render
3. Redeploy backend

---

## FINAL DEPLOYMENT CHECKLIST

### Frontend (Vercel)
- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] All VITE_* environment variables set
- [ ] `VITE_BACKEND_URL` points to Render backend
- [ ] Frontend loads without errors
- [ ] Mobile responsive (test on phone)

### Backend (Render)
- [ ] Repository pushed to GitHub (with .gitignore)
- [ ] Render service created
- [ ] Start command: `npm start`
- [ ] PORT and HOST set in environment
- [ ] `FRONTEND_URL` matches Vercel domain
- [ ] Firebase credentials configured
- [ ] All API keys configured (Razorpay, SMTP)
- [ ] Health endpoint works: `/api/health`

### Integration
- [ ] Frontend can call backend API
- [ ] NO CORS errors
- [ ] Authentication works (Firebase)
- [ ] Payment flow works (Razorpay)
- [ ] Orders saved to Firestore
- [ ] Emails sending (SMTP)

---

## FILES MODIFIED FOR DEPLOYMENT

### Backend Changes
1. **server.js**
   - Added CORS whitelist (FRONTEND_URL)
   - Added HOST binding (0.0.0.0)

2. **package.json**
   - Added `start` script

3. **.env.example**
   - Added FRONTEND_URL
   - Added SMTP_USER and SMTP_PASS

### Frontend Changes
1. **vercel.json** (NEW)
   - Build configuration for Vercel

2. **.env.example** (NEW)
   - Environment variable template

### No Changes Needed
- ✅ src/firebase.js (already uses env vars)
- ✅ API calls in components (already use VITE_BACKEND_URL)
- ✅ Routing (vercel.json handles SPA)

---

## PRODUCTION BEST PRACTICES

1. **Never commit .env to git**
   - Use `.gitignore` for `.env`, `serviceAccountKey.json`
   - Only commit `.env.example`

2. **HTTPS everywhere**
   - Vercel: Automatic SSL
   - Render: Automatic SSL
   - Update CORS for https URLs

3. **Monitor errors**
   - Vercel: Analytics dashboard
   - Render: Log viewer (https://render.com/logs)
   - Browser console for frontend errors

4. **Scale as needed**
   - Vercel: Free tier sufficient
   - Render: Free tier sleeps after 15 min inactivity
   - Upgrade to paid if needed

---

## NEXT STEPS (OPTIONAL)

1. **Custom Domain**
   - Vercel: Settings → Domains
   - Render: Settings → Custom Domains

2. **CI/CD**
   - Both platforms auto-deploy on git push
   - No additional setup needed

3. **Backups**
   - Firebase automatically backs up data
   - Enable Firestore backups in Firebase Console

4. **Analytics**
   - Vercel Web Analytics (free)
   - Firebase Analytics (free)

---

**Questions?** Check the respective documentation:
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Firebase: https://firebase.google.com/docs
