# Supabase Setup Guide for Talkapi

This guide will help you set up Supabase for your Talkapi project, including database schema, authentication, and user management.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `talkapi-db` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### 3. Update Environment Variables

1. Open your `.env` file in the Backend directory
2. Update the Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase_migrations.sql`
3. Paste and run the SQL commands
4. This will create all necessary tables and functions

## 📊 Database Schema

### Tables Created

#### 1. `api_usage`
Tracks daily API usage per user and endpoint:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- endpoint (VARCHAR)
- request_count (INTEGER)
- usage_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `api_history`
Stores API call history and favorites:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- user_query (TEXT)
- generated_code (TEXT)
- endpoint (VARCHAR)
- status (VARCHAR)
- execution_result (JSONB)
- is_favorite (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. `user_profiles`
Extended user information and limits:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- username (VARCHAR)
- full_name (VARCHAR)
- email (VARCHAR)
- plan_type (VARCHAR, default: 'free')
- daily_limit (INTEGER, default: 5)
- api_calls_today (INTEGER, default: 0)
- last_api_call_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Functions Created

#### 1. `track_api_usage(p_user_id, p_endpoint)`
Automatically tracks API usage and updates user limits.

#### 2. `reset_daily_api_calls()`
Resets daily API call counters (can be scheduled).

#### 3. `update_updated_at_column()`
Automatically updates the `updated_at` timestamp.

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure users can only access their own data:

- Users can only view/insert/update their own API usage
- Users can only view/insert/update/delete their own API history
- Users can only view/insert/update their own profile

### Authentication
Supabase provides built-in authentication with:
- Email/password signup and login
- Social login (Google, GitHub, etc.)
- Magic link authentication
- JWT token management

## 🛠️ Integration with Flask Backend

### 1. Install Dependencies
```bash
pip install supabase==2.8.0
```

### 2. Import and Use
```python
from supabase_client import get_supabase_manager

# Get the manager
manager = get_supabase_manager()

# Track API usage
manager.track_api_usage(user_id, "/ask")

# Save API history
manager.save_api_history(
    user_id=user_id,
    user_query="How do I get weather data?",
    generated_code="fetch(...)",
    endpoint="https://api.openweathermap.org/...",
    status="Success"
)

# Check rate limits
if manager.check_rate_limit(user_id):
    # Allow the request
    pass
else:
    # Rate limit exceeded
    pass
```

## 📈 Usage Tracking

### Daily Limits
- **Free Plan**: 5 requests per day
- **Pro Plan**: 100 requests per day (configurable)
- **Enterprise**: Unlimited

### Rate Limiting
The system automatically:
1. Tracks each API call
2. Updates daily counters
3. Enforces limits per user
4. Resets counters daily

## 🔧 Configuration Options

### Plan Types
You can configure different plan types in the `user_profiles` table:

```sql
-- Free plan
UPDATE user_profiles SET plan_type = 'free', daily_limit = 5 WHERE user_id = '...';

-- Pro plan
UPDATE user_profiles SET plan_type = 'pro', daily_limit = 100 WHERE user_id = '...';

-- Enterprise plan
UPDATE user_profiles SET plan_type = 'enterprise', daily_limit = 999999 WHERE user_id = '...';
```

### Custom Limits
You can set custom daily limits for specific users:

```sql
UPDATE user_profiles SET daily_limit = 50 WHERE user_id = '...';
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Errors
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active
- Ensure your IP is not blocked

#### 2. RLS Policy Errors
- Make sure RLS is enabled on all tables
- Verify policies are created correctly
- Check that users are authenticated

#### 3. Function Errors
- Ensure all functions are created in the SQL migration
- Check function permissions
- Verify function parameters match

### Debug Commands

```python
# Test connection
manager = get_supabase_manager()
try:
    response = manager.client.table('api_usage').select('*').limit(1).execute()
    print("✅ Connection successful")
except Exception as e:
    print(f"❌ Connection failed: {e}")

# Check user profile
profile = manager.get_user_profile(user_id)
print(f"User profile: {profile}")

# Get usage stats
stats = manager.get_usage_stats(user_id)
print(f"Usage stats: {stats}")
```

## 📋 Next Steps

1. **Configure Authentication**: Set up email templates and social providers
2. **Test Integration**: Run the backend and test API calls
3. **Monitor Usage**: Check the Supabase dashboard for usage analytics
4. **Scale Up**: Consider upgrading your Supabase plan for production

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Python Client](https://supabase.com/docs/reference/python)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

**Need Help?** Check the Supabase dashboard logs or create an issue in your project repository. 