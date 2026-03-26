# PRODUCTION DEPLOYMENT QUICK START

Follow these 5 simple steps to deploy your app.

---

## STEP 1: PREPARE & TEST LOCALLY (5 minutes)

```bash
# Terminal 1: Start Frontend
cd d:\CONS\SRI-AMMAN-TIMBERS
npm install
npm run dev
# Visit http://localhost:5173

# Terminal 2: Start Backend
cd d:\CONS\SRI-AMMAN-TIMBERS\backend
npm install
npm start
# Test http://localhost:5000/api/health

# Test locally in browser
# - Login/Signup
# - Add items to cart
# - Checkout (use Razorpay test card)
# - View orders
```

**✅ All working locally? Proceed to Step 2**

---

## STEP 2: PUSH TO GITHUB (2 minutes)

```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

---

## STEP 3: DEPLOY BACKEND TO RENDER (5 minutes)

1. Go to https://render.com (sign up if needed)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. **Configure Service:**

   | Setting | Value |
   |---------|-------|
   | Name | `paintpro-backend` |
   | Environment | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |

5. **Add Environment Variables** (click "Environment" tab):

   ```
   PORT=10000
   HOST=0.0.0.0
   FRONTEND_URL=https://your-app.vercel.app
   RAZORPAY_KEY_ID=rzp_test_STmcGRz2IgpoiV
   RAZORPAY_KEY_SECRET=fZWig4xKhOVVw7eTGh0jIDVP
   SMTP_USER=selvasenthil2006@gmail.com
   SMTP_PASS=oorg fxjs mjoa lfzr
   ```

6. Click "Create Web Service"
7. **Wait 2-3 minutes for deployment**
8. **Copy your Backend URL** (something like: `https://paintpro-backend.onrender.com`)

**✅ Backend deployed? Proceed to Step 4**

---

## STEP 4: DEPLOY FRONTEND TO VERCEL (5 minutes)

1. Go to https://vercel.com (sign up if needed)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Vercel auto-detects Vite, no changes needed**
5. **Add Environment Variables** (click "Environment Variables"):

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

   ⚠️ **IMPORTANT:** Replace `VITE_BACKEND_URL` with your Render backend URL!

6. Click "Deploy"
7. **Wait 1-2 minutes for deployment**
8. **Copy your Frontend URL** (Vercel will show this in dashboard)

**✅ Frontend deployed? Proceed to Step 5**

---

## STEP 5: CONNECT & TEST (2 minutes)

### 5.1 Update Render CORS

1. Go back to **Render Dashboard**
2. Click your backend service
3. Go to **Environment**
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Click "Save" (this will redeploy automatically)

### 5.2 Test Backend

```javascript
// Open browser console and run:
fetch('https://paintpro-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)

// Should see: { status: 'ok', message: 'Backend is running' }
```

### 5.3 Test Frontend

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Test these features:
   - [ ] Page loads
   - [ ] Sign up / Login works
   - [ ] Products display
   - [ ] Can add to cart
   - [ ] Checkout works
   - [ ] Payment succeeds
   - [ ] Orders display

**🎉 Everything working? Deployment complete!**

---

## TROUBLESHOOTING

### Frontend shows error: "Backend URL not found"
- Check Vercel Environment Variables are set
- Verify `VITE_BACKEND_URL` is correctly set
- Go to Vercel → Redeploy latest commit

### Payment fails with "CORS error"
- Check `FRONTEND_URL` is correct in Render
- Ensure https:// is used (not http://)
- Render auto-redeploys after env changes

### Login not working / Firebase error
- Verify all `VITE_FIREBASE_*` variables in Vercel
- Check Firebase permissions in Console
- No code changes needed

### Cannot fetch orders from backend
- Check browser Network tab (should show 200 status)
- Verify Render backend is running (check logs)
- Try Render health check: `/api/health`

**Still having issues?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting.

---

## WHAT CHANGED FOR DEPLOYMENT

✅ **Backend:**
- Added CORS whitelist (reads FRONTEND_URL)
- Added `npm start` script
- Added HOST binding

✅ **Frontend:**
- Added vercel.json (configuration)
- Added .env.example (template)

✅ **NO BUSINESS LOGIC CHANGES**
- All features work exactly like localhost
- No code rewrites
- No database changes

📄 **See [DEPLOYMENT_CHANGES.md](DEPLOYMENT_CHANGES.md) for exact before/after**

---

## YOUR DEPLOYMENT URLS

Save these:

**Frontend:** `https://your-app.vercel.app`
**Backend:** `https://your-app.onrender.com`

---

## NEXT DEPLOYMENT (When you push code changes)

Both Vercel and Render auto-deploy on git push!

```bash
# Make changes locally
git add .
git commit -m "feature: add new feature"
git push origin main

# Vercel auto-deploys (1-2 min)
# Render auto-deploys (2-3 min)
# Visit your URLs to see changes
```

**No manual deployment needed!**

---

## KEY ENVIRONMENT VARIABLES

### Frontend (Vercel)
| Variable | Value | Where to Get |
|----------|-------|--------------|
| VITE_BACKEND_URL | Your Render backend URL | Render Dashboard |
| VITE_FIREBASE_* | Firebase project config | Firebase Console |
| VITE_ADMIN_* | Admin credentials | Your settings |

### Backend (Render)
| Variable | Value | Where to Get |
|----------|-------|--------------|
| FRONTEND_URL | Your Vercel frontend URL | Vercel Dashboard |
| PORT | Usually 10000 | Render default |
| RAZORPAY_* | Your Razorpay test keys | Your .env file |
| SMTP_* | Your Gmail credentials | Your .env file |

---

## PRODUCTION CHECKLIST

Before considering deployment complete:

- [ ] Frontend loads without 404 errors
- [ ] Backend API responds to health check
- [ ] Login/Signup works (Firebase auth)
- [ ] Can view products
- [ ] Can add items to cart
- [ ] Can complete checkout
- [ ] Razorpay payment dialog appears
- [ ] Order appears in order history
- [ ] CORS errors are gone
- [ ] No errors in browser console
- [ ] Works on mobile (responsive)
- [ ] All images load correctly
- [ ] Routing works (no blank pages)

**All green? You're ready for production! 🚀**

---

## SUPPORT

- **Vite docs:** https://vitejs.dev
- **React docs:** https://react.dev
- **Firebase docs:** https://firebase.google.com/docs
- **Vercel docs:** https://vercel.com/docs
- **Render docs:** https://render.com/docs

---

**Total deployment time:** ~20-30 minutes
**Difficulty:** Beginner friendly ✅
