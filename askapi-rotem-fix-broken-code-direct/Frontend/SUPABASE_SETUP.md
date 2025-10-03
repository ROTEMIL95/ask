# Frontend Supabase Setup Guide

This guide will help you set up Supabase authentication and user profiles in your React frontend.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env` file in the Frontend directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Install Dependencies

The Supabase client is already added to `package.json`. Install it:

```bash
npm install
```

### 3. Components Available

The following components are now available for use:

#### Authentication
- **`Login`** (`/auth/login`) - Sign in/sign up form
- **`AuthProvider`** - Context provider for auth state
- **`ProtectedRoute`** - Route protection component

#### User Profile
- **`UserProfile`** (`/profile`) - Profile management page
- **`useUserProfile`** - Hook for profile data
- **`UsageIndicator`** - API usage display

## 📱 Usage Examples

### Basic Authentication

```jsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Protected Routes

```jsx
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/public" element={<PublicPage />} />
      <Route 
        path="/private" 
        element={
          <ProtectedRoute>
            <PrivatePage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}
```

### User Profile Management

```jsx
import { useUserProfile } from './hooks/useUserProfile'

function ProfileComponent() {
  const { 
    profile, 
    updateUsername, 
    getUsageStats, 
    canMakeApiCall 
  } = useUserProfile()
  
  const usageStats = getUsageStats()
  
  return (
    <div>
      <p>Username: {profile?.username}</p>
      <p>Plan: {usageStats?.planType}</p>
      <p>Remaining calls: {usageStats?.remainingCalls}</p>
    </div>
  )
}
```

### Usage Indicator

```jsx
import { UsageIndicator } from './components/UsageIndicator'

function Header() {
  return (
    <header>
      <h1>AskAPI</h1>
      <UsageIndicator />
    </header>
  )
}
```

## 🔐 Authentication Flow

1. **Sign Up**: User creates account with email/password
2. **Profile Creation**: Automatically creates user profile in Supabase
3. **Sign In**: User authenticates with email/password
4. **Profile Loading**: User profile is loaded from database
5. **Usage Tracking**: API calls are tracked per user

## 📊 User Profile Schema

The user profile includes:

```typescript
interface UserProfile {
  id: string
  user_id: string
  username?: string
  full_name?: string
  email: string
  plan_type: 'free' | 'pro' | 'enterprise'
  daily_limit: number
  api_calls_today: number
  last_api_call_date?: string
  created_at: string
  updated_at: string
}
```

## 🎯 Features

### Authentication
- ✅ Email/password sign up and sign in
- ✅ Automatic profile creation
- ✅ Session management
- ✅ Protected routes

### User Profiles
- ✅ Profile creation and editing
- ✅ Usage statistics
- ✅ Plan management
- ✅ Rate limiting

### Usage Tracking
- ✅ Daily API call limits
- ✅ Usage progress indicators
- ✅ Limit warnings
- ✅ Plan-based restrictions

## 🛠️ Integration with Backend

The frontend components work with the Supabase backend:

1. **Authentication**: Uses Supabase Auth
2. **Profiles**: Connects to `user_profiles` table
3. **Usage**: Tracks API calls in `api_usage` table
4. **History**: Stores API calls in `api_history` table

## 🔧 Customization

### Custom Plan Types

You can add custom plan types by updating the profile:

```jsx
const { updatePlanType } = useUserProfile()

// Update user to pro plan
await updatePlanType('pro')
```

### Custom Daily Limits

```jsx
const { updateDailyLimit } = useUserProfile()

// Set custom daily limit
await updateDailyLimit(100)
```

### Usage Alerts

The `UsageIndicator` component automatically shows:
- Progress bars for daily usage
- Warnings when approaching limits
- Error alerts when limits are reached

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   - Check that `.env` file exists in Frontend directory
   - Ensure variables start with `VITE_`
   - Restart development server after changes

2. **Authentication Errors**
   - Verify Supabase URL and anon key
   - Check Supabase project settings
   - Ensure email confirmation is configured

3. **Profile Not Loading**
   - Check Row Level Security policies
   - Verify user is authenticated
   - Check browser console for errors

### Debug Commands

```jsx
// Check authentication state
const { isAuthenticated, user } = useAuth()
console.log('Auth state:', { isAuthenticated, user })

// Check profile state
const { profile, loading, error } = useUserProfile()
console.log('Profile state:', { profile, loading, error })
```

## 📋 Next Steps

1. **Test Authentication**: Try signing up and signing in
2. **Test Profile Management**: Edit profile information
3. **Test Usage Tracking**: Make API calls and check usage
4. **Customize UI**: Modify components to match your design
5. **Add Features**: Implement additional profile features

## 🔗 Related Files

- `src/lib/supabase.js` - Supabase client configuration
- `src/contexts/AuthContext.jsx` - Authentication context
- `src/hooks/useUserProfile.js` - Profile management hook
- `src/components/Login.jsx` - Login component
- `src/components/UserProfile.jsx` - Profile component
- `src/components/UsageIndicator.jsx` - Usage display
- `src/components/ProtectedRoute.jsx` - Route protection

---

**Need Help?** Check the browser console for errors or refer to the Supabase documentation. 