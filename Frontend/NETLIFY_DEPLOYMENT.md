# Netlify Deployment Guide

## Current Setup ✅

Your `_redirects` file is correctly configured:
```
/*    /index.html   200
```

This tells Netlify to serve `index.html` for all routes, enabling client-side routing.

## Build Verification

### 1. Check Build Output
After running `npm run build`, verify these files exist in `dist/`:
- `index.html`
- `_redirects`
- `assets/` folder with your JS/CSS files

### 2. Test Locally
```bash
npm run build
npm run preview
```
Navigate to `http://localhost:4173` and test your routes.

## Netlify Deployment Steps

### 1. Build Settings
In your Netlify dashboard:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18 or higher

### 2. Environment Variables
Add these in Netlify dashboard → Site settings → Environment variables:
```
VITE_BACKEND_URL=https://talkapi-tuir.onrender.com
```

### 3. Domain Settings
- **Custom domain**: `talkapi.ai`
- **HTTPS**: Enable (Netlify provides free SSL)

## Troubleshooting 404 Errors

### 1. Verify Redirects File
Check that `_redirects` is in your build output:
```bash
npm run build
ls dist/_redirects
```

### 2. Check Netlify Logs
- Go to Netlify dashboard → Deploys → Latest deploy
- Check build logs for any errors
- Verify `_redirects` file is uploaded

### 3. Test Routes
After deployment, test these URLs:
- `https://talkapi.ai/` (should work)
- `https://talkapi.ai/ask` (should work)
- `https://talkapi.ai/chat` (should work)
- `https://talkapi.ai/any-route` (should work)

### 4. Clear Cache
If routes still don't work:
- Clear browser cache
- Check Netlify cache settings
- Force a new deploy

## Advanced Configuration

### API Proxying (Optional)
If you want to proxy API calls through Netlify, uncomment this in `_redirects`:
```
/api/*  https://talkapi-tuir.onrender.com/:splat  200
```

Then update your API calls to use `/api/` prefix.

### Force HTTPS (Recommended)
Uncomment this in `_redirects`:
```
/  https://talkapi.ai  301!
```

## Common Issues

### 1. Routes work locally but not on Netlify
- Check that `_redirects` is in the build output
- Verify Netlify build settings
- Check deploy logs

### 2. API calls failing
- Verify CORS settings in your backend
- Check that `VITE_BACKEND_URL` is set correctly
- Test API endpoints directly

### 3. Build failing
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript/ESLint errors

## Monitoring

### 1. Netlify Analytics
- Monitor 404 errors in Netlify dashboard
- Check redirect rules are working

### 2. Browser DevTools
- Check Network tab for failed requests
- Verify redirects are working

## Best Practices

1. **Always test locally first**: `npm run build && npm run preview`
2. **Use environment variables** for API URLs
3. **Enable HTTPS** in production
4. **Monitor deploy logs** for any issues
5. **Test all routes** after deployment

## Support

If you're still getting 404 errors:
1. Check Netlify deploy logs
2. Verify `_redirects` file content
3. Test with a simple route first
4. Contact Netlify support if needed 