# Environment Setup Guide

## 🔧 Fix "Auth session missing!" Error

The error occurs because Supabase credentials are not configured. Follow these steps to fix it:

### 1. Create Environment File

Create a `.env` file in the Frontend directory:

```bash
cd Frontend
touch .env
```

### 2. Add Supabase Credentials

Add the following to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Get Your Supabase Credentials

1. **Go to [https://supabase.com](https://supabase.com)**
2. **Sign up or log in**
3. **Create a new project** (or use existing)
4. **Go to Settings > API**
5. **Copy the values:**
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 4. Update Your .env File

Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Restart Development Server

```bash
npm run dev
```

## 🚨 Common Issues

### Issue: "Supabase credentials not configured"
**Solution:** Make sure your `.env` file exists and has the correct values.

### Issue: "Invalid API key"
**Solution:** Check that you copied the **anon public key** (not the service role key).

### Issue: "Project not found"
**Solution:** Verify your project URL is correct and the project is active.

## ✅ Verification

After setup, you should see:
- No console warnings about missing credentials
- Login/Register forms work properly
- Authentication state is maintained

## 🔗 Next Steps

1. **Test Authentication:** Try signing up and signing in
2. **Check Profile:** Visit `/profile` to see user profile
3. **Test API Calls:** Make sure API calls work with authentication

---

**Need Help?** Check the browser console for specific error messages. 