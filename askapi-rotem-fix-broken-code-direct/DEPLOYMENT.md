# Deployment Guide

## 🚀 Deploying to Render

### **Prerequisites:**
1. **Render Account** - Sign up at [render.com](https://render.com)
2. **GitHub Repository** - Push your code to GitHub
3. **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com)

### **Step 1: Prepare Your Repository**

Make sure your repository structure looks like this:
```
Askapi/
├── Backend/
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
├── Frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── render.yaml
└── README.md
```

### **Step 2: Deploy to Render**

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository with your code

2. **Configure Environment Variables:**
   - In the Render dashboard, go to your backend service
   - Navigate to "Environment" tab
   - Add these variables:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     OPENAI_PROJECT_ID=your_openai_project_id_here
     FLASK_ENV=production
     FLASK_DEBUG=false
     ```

3. **Deploy Services:**
   - Render will automatically detect the `render.yaml` file
   - It will create both backend and frontend services
   - Wait for deployment to complete

### **Step 3: Update Frontend Configuration**

After deployment, update the frontend environment:

1. **In Render Dashboard:**
   - Go to your frontend service
   - Navigate to "Environment" tab
   - Add/update:
     ```
     VITE_BACKEND_URL=https://your-backend-service-name.onrender.com
     ```

2. **Redeploy Frontend:**
   - Trigger a manual deploy or push new code

### **Step 4: Test Your Deployment**

1. **Backend Health Check:**
   ```bash
   curl https://your-backend-service.onrender.com/health
   ```

2. **Frontend Access:**
   - Visit your frontend URL
   - Test the API functionality
   - Check status indicators

### **Environment Variables Reference**

#### **Backend Variables:**
```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_PROJECT_ID=your-project-id
FLASK_ENV=production
FLASK_DEBUG=false
PORT=10000  # Auto-set by Render
```

#### **Frontend Variables:**
```env
VITE_BACKEND_URL=https://your-backend-service.onrender.com
```

### **Troubleshooting**

#### **Common Issues:**

1. **Backend Not Starting:**
   - Check OpenAI API key is set correctly
   - Verify requirements.txt is in Backend folder
   - Check build logs in Render dashboard

2. **Frontend Can't Connect to Backend:**
   - Verify VITE_BACKEND_URL is correct
   - Check CORS settings in backend
   - Ensure backend service is running

3. **OpenAI Connection Failed:**
   - Verify API key and project ID
   - Check OpenAI account has credits
   - Test API key manually

#### **Useful Commands:**
```bash
# Check backend logs
curl https://your-backend.onrender.com/health

# Test OpenAI connection
curl https://your-backend.onrender.com/check-openai

# Test API endpoint
curl -X POST https://your-backend.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Hello"}'
```

### **Production Checklist**

- [ ] Backend service is running
- [ ] Frontend service is running
- [ ] OpenAI API key is configured
- [ ] Environment variables are set
- [ ] Health checks are passing
- [ ] Frontend can connect to backend
- [ ] API functionality is working
- [ ] Error handling is working
- [ ] CORS is properly configured

### **Monitoring**

- **Health Checks:** Render automatically monitors `/health` endpoint
- **Logs:** View logs in Render dashboard
- **Metrics:** Monitor performance in Render dashboard
- **Alerts:** Set up alerts for service failures

### **Scaling**

- **Free Tier:** Limited to 750 hours/month
- **Paid Plans:** Available for higher usage
- **Auto-scaling:** Configure in Render dashboard
- **Custom Domains:** Add in Render dashboard

Your application should now be live and accessible via the Render URLs! 