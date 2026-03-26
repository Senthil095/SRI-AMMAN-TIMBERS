# 🚀 Vercel Deployment Guide - Step by Step

## ✅ Pre-Deployment Checklist

- [x] Frontend: React + Vite configured
- [x] Backend: Converted to Vercel Serverless Functions
- [x] vercel.json: Created with correct build settings
- [x] .env.example: Created with all required variables
- [x] package.json: Updated with build/deploy scripts
- [ ] Environment variables: Added to Vercel dashboard
- [ ] Git repository: Committed all changes

---

## 📋 STEP 1: Prepare Git Repository

Run these commands in the project root:

```powershell
# Commit all changes
git add .
git commit -m "feat: setup Vercel deployment with serverless API functions"

# Push to remote (GitHub, GitLab, etc.)
git push origin main
```

---

## 📋 STEP 2: Install Vercel CLI

Run this command in PowerShell:

```powershell
npm install -g vercel
```

Verify installation:

```powershell
vercel --version
```

---

## 📋 STEP 3: Login to Vercel

```powershell
vercel login
```

This will:
1. Open browser to vercel.com
2. Create/login account
3. Authorize Vercel CLI

---

## 📋 STEP 4: Link Project to Vercel

```powershell
cd D:\CONS\SRI-AMMAN-TIMBERS
vercel link
```

Answer the prompts:
- **"Set up and deploy?"** → `y` (yes)
- **"Which scope?"** → Select your account
- **"Found existing project?"** → If first time, say `n` (no), name it "sri-amman-timbers"
- **"In which directory is your code?"** → Press Enter (default = current)
- **"Want to modify these settings?"** → `n` (no) - we configured vercel.json

---

## 📋 STEP 5: Add Environment Variables to Vercel Dashboard

**DO THIS IN BROWSER - NOT IN TERMINAL**

1. Open: https://vercel.com/dashboard
2. Click on your project: **"sri-amman-timbers"**
3. Go to **Settings → Environment Variables**
4. Add each variable from below
5. **IMPORTANT**: Add to all 3 environments (Production, Preview, Development)

### Copy-Paste These Variables:

**Frontend Variables (Visible in browser):**
```
VITE_FIREBASE_API_KEY = AIzaSyDlNCmT8E-kltQlAcpVXzFxLWfwf9AxBnE
VITE_FIREBASE_AUTH_DOMAIN = paint-shop-87ae4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = paint-shop-87ae4
VITE_FIREBASE_STORAGE_BUCKET = paint-shop-87ae4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 329285676611
VITE_FIREBASE_APP_ID = 1:329285676611:web:508faa9e77881e16b36ef6
VITE_ADMIN_ID = adminSATH
VITE_ADMIN_PASSWORD = sriadmin2026
```

**Backend Variables (Secret - NOT visible in browser):**
```
RAZORPAY_KEY_ID = [paste your actual key]
RAZORPAY_KEY_SECRET = [paste your actual secret]
FIREBASE_PROJECT_ID = paint-shop-87ae4
FIREBASE_PRIVATE_KEY = [paste your private key]
FIREBASE_CLIENT_EMAIL = [paste your service account email]
EMAIL_USER = [your gmail]
EMAIL_PASSWORD = [your app password]
```

---

## 📋 STEP 6: Deploy Preview Version

Test deployment before going live:

```powershell
vercel --prod --prebuilt
```

Wait for deployment to finish. You'll see:
```
✓ Production: https://sri-amman-timbers.vercel.app
```

---

## 📋 STEP 7: Test Preview Deployment

1. Open the URL from previous step
2. Test these features:
   - **Frontend loads** ✓
   - **Firebase login works** ✓
   - **Add product to cart** ✓
   - **Proceed to checkout** ✓
   - **API calls work** (check browser DevTools → Network)

---

## 📋 STEP 8: Deploy to Production

Once preview works, deploy to production:

```powershell
vercel --prod
```

Or use the npm script:

```powershell
npm run deploy
```

---

## 🔍 Debugging: View Deployment Logs

If something fails:

```powershell
# View real-time logs
vercel logs --prod

# Show last 10 errors
vercel logs --prod --since 10m
```

---

## 🔍 Common Issues & Fixes

### Issue: "API endpoint not found"
**Fix**: Check if `/api/create-order` route exists
```
✓ Should be in: /api/create-order.js
✓ URL format: https://yoursite.vercel.app/api/create-order
```

### Issue: "Firebase initialization failed"
**Fix**: Verify env variables are set correctly in Vercel dashboard
```powershell
# Check locally
echo $env:FIREBASE_PRIVATE_KEY
```

### Issue: "Module not found: firebase-admin"
**Fix**: This shouldn't happen - our api/* files use proper imports
```powershell
# Verify in Vercel dashboard
vercel logs --prod --since 30m
```

### Issue: "CORS errors"
**Fix**: Already handled in our api functions with:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

---

## 📊 Verify Deployment is Live

1. Go to your site: **https://sri-amman-timbers.vercel.app**
2. Check:
   - ✓ Page loads
   - ✓ Firebase auth works
   - ✓ API calls respond
   - ✓ No console errors

2. Check logs:
```powershell
vercel logs --prod
```

Should show: `Server running on port 5000` (not needed for serverless, but confirm no errors)

---

## 📈 Next Steps After Deployment

1. **Set custom domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your domain (e.g., paintshop.com)

2. **Setup CI/CD** (automatic):
   - Git push → Automatic deployment

3. **Monitor performance**:
   - Vercel Dashboard → Analytics
   - Check: Response times, errors, traffic

4. **Setup auto-rebuild** (optional):
   - Vercel Dashboard → Settings → Git
   - Enable "Automatically redeploy on push"

---

## ✅ Final Checklist

- [ ] Environment variables added to Vercel
- [ ] Preview deployment successful
- [ ] Production deployment successful
- [ ] Frontend loads at https://sri-amman-timbers.vercel.app
- [ ] API endpoints respond (check DevTools → Network)
- [ ] Firebase auth works
- [ ] Cart & checkout flow works
- [ ] No errors in Vercel logs

---

## 📞 If Something Breaks

Run these commands to diagnose:

```powershell
# Show all recent deployments
vercel list

# Show current deployment status
vercel inspect

# Show last 50 log lines
vercel logs --prod --lines 50

# Redeploy current git commit
vercel deploy --prod --prebuilt
```

---

**Your site will be live at: https://sri-amman-timbers.vercel.app** 🎉
