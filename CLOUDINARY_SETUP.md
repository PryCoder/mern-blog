# ☁️ Cloudinary Setup Guide

## Migration Complete! Firebase Storage → Cloudinary

All Firebase Storage uploads have been replaced with **Cloudinary**. Follow these steps to get it working:

---

## **Step 1: Create a Cloudinary Account**

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a **free account**
3. Verify your email
4. Go to your **Dashboard**

---

## **Step 2: Get Your Credentials**

In your Cloudinary Dashboard:
- Copy your **Cloud Name** (visible at top of dashboard)
- Create an **Upload Preset**:
  1. Go to **Settings** → **Upload**
  2. Scroll to **Upload presets**
  3. Click **Add upload preset**
  4. Set **Unsigned** mode (allows uploads from frontend without API key)
  5. Name it something like `mern_blog_preset`
  6. Click **Save**

---

## **Step 3: Configure Your App**

Edit **`client/src/utils/cloudinary.js`** and replace the top two lines:

```javascript
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUDINARY_CLOUD_NAME'; // e.g., 'dxyz123'
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';     // e.g., 'mern_blog_preset'
```

**Example:**
```javascript
const CLOUDINARY_CLOUD_NAME = 'dq5p8jx9v';
const CLOUDINARY_UPLOAD_PRESET = 'mern_blog_preset';
```

---

## **Step 4: Test Upload**

1. Stop your dev server (Ctrl+C)
2. Start again:
   ```bash
   cd client
   npm run dev
   ```
3. Try uploading an image in **Create Post**
4. If it works, you're done! ✅

---

## **Troubleshooting**

### **Upload fails with "Upload failed"**
- ❌ Cloud name or preset name is incorrect
- ✅ Double-check in `cloudinary.js`
- ✅ Verify preset is **Unsigned mode**

### **"Invalid upload preset" error**
- Make sure you created the preset correctly
- Preset must be in **Unsigned** mode

### **Cloudinary free tier limits**
- **25 GB storage** (plenty for most projects)
- **API calls**: Generous limits
- No credit card required

---

## **Where Cloudinary is Used**

✅ **CreatePost.jsx** - Post thumbnail upload
✅ **CreateStories.jsx** - Story media upload
✅ **DashEdit.jsx** - Profile picture upload
✅ **UpdatePost.jsx** - Post image update
✅ **MessagingPage.jsx** - Message file uploads

---

## **Benefits of Cloudinary**

✅ No quota exceeded errors
✅ Unlimited storage (free plan)
✅ Automatic image optimization
✅ CDN delivery (fast loads)
✅ Easy integration

---

## **Optional: API Key (for deletions)**

If you want to delete images from Cloudinary:

1. Get your **API Key** from Dashboard Settings
2. Create a backend endpoint in `api/routes/cloudinary.route.js`
3. Use the API key there (never expose in frontend!)

For now, the basic setup is complete and you can upload! 🚀
