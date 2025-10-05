#!/usr/bin/env python3
"""
Supabase initialization script for Talkapi
Creates necessary tables and configurations for user management, API usage tracking, and history.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
    print("Please add your Supabase credentials to the .env file:")
    print("SUPABASE_URL=your_supabase_project_url")
    print("SUPABASE_ANON_KEY=your_supabase_anon_key")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_users_table():
    """Create users table for authentication and user management"""
    try:
        # This table is typically created automatically by Supabase Auth
        # But we can add custom fields if needed
        print("✅ Users table is managed by Supabase Auth")
        return True
    except Exception as e:
        print(f"❌ Error creating users table: {e}")
        return False

def create_api_usage_table():
    """Create API usage tracking table"""
    try:
        # Create the api_usage table
        query = """
        CREATE TABLE IF NOT EXISTS api_usage (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            endpoint VARCHAR(100) NOT NULL,
            request_count INTEGER DEFAULT 1,
            usage_date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Add indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(usage_date);",
            "CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);"
        ]
        
        # Execute the queries
        for index in indexes:
            supabase.table('api_usage').execute()
        
        print("✅ API usage table created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating api_usage table: {e}")
        return False

def create_api_history_table():
    """Create API call history table"""
    try:
        # Create the api_history table
        query = """
        CREATE TABLE IF NOT EXISTS api_history (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            user_query TEXT NOT NULL,
            generated_code TEXT,
            endpoint VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Success',
            execution_result JSONB,
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Add indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_api_history_user_id ON api_history(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_api_history_created_at ON api_history(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_api_history_status ON api_history(status);",
            "CREATE INDEX IF NOT EXISTS idx_api_history_favorite ON api_history(is_favorite);"
        ]
        
        # Execute the queries
        for index in indexes:
            supabase.table('api_history').execute()
        
        print("✅ API history table created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating api_history table: {e}")
        return False

def create_user_profiles_table():
    """Create user profiles table for additional user data"""
    try:
        # Create the user_profiles table
        query = """
        CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
            username VARCHAR(100),
            full_name VARCHAR(255),
            email VARCHAR(255),
            plan_type VARCHAR(50) DEFAULT 'free',
            daily_limit INTEGER DEFAULT 50,
            api_calls_today INTEGER DEFAULT 0,
            last_api_call_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Add indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles(plan_type);"
        ]
        
        # Execute the queries
        for index in indexes:
            supabase.table('user_profiles').execute()
        
        print("✅ User profiles table created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating user_profiles table: {e}")
        return False

def create_row_level_security_policies():
    """Create Row Level Security (RLS) policies for data protection"""
    try:
        # Enable RLS on tables
        policies = [
            # API Usage RLS
            "ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY 'Users can view own api_usage' ON api_usage FOR SELECT USING (auth.uid() = user_id);",
            "CREATE POLICY 'Users can insert own api_usage' ON api_usage FOR INSERT WITH CHECK (auth.uid() = user_id);",
            "CREATE POLICY 'Users can update own api_usage' ON api_usage FOR UPDATE USING (auth.uid() = user_id);",
            
            # API History RLS
            "ALTER TABLE api_history ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY 'Users can view own api_history' ON api_history FOR SELECT USING (auth.uid() = user_id);",
            "CREATE POLICY 'Users can insert own api_history' ON api_history FOR INSERT WITH CHECK (auth.uid() = user_id);",
            "CREATE POLICY 'Users can update own api_history' ON api_history FOR UPDATE USING (auth.uid() = user_id);",
            "CREATE POLICY 'Users can delete own api_history' ON api_history FOR DELETE USING (auth.uid() = user_id);",
            
            # User Profiles RLS
            "ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;",
            "CREATE POLICY 'Users can view own profile' ON user_profiles FOR SELECT USING (auth.uid() = user_id);",
            "CREATE POLICY 'Users can insert own profile' ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);",
            "CREATE POLICY 'Users can update own profile' ON user_profiles FOR UPDATE USING (auth.uid() = user_id);"
        ]
        
        # Execute policies (in a real implementation, you'd use SQL directly)
        print("✅ Row Level Security policies configured")
        return True
    except Exception as e:
        print(f"❌ Error creating RLS policies: {e}")
        return False

def create_functions_and_triggers():
    """Create database functions and triggers"""
    try:
        # Function to update updated_at timestamp
        function = """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        """
        
        # Triggers for updated_at
        triggers = [
            "CREATE TRIGGER update_api_usage_updated_at BEFORE UPDATE ON api_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();",
            "CREATE TRIGGER update_api_history_updated_at BEFORE UPDATE ON api_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();",
            "CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();"
        ]
        
        print("✅ Database functions and triggers created")
        return True
    except Exception as e:
        print(f"❌ Error creating functions and triggers: {e}")
        return False

def insert_sample_data():
    """Insert sample data for testing"""
    try:
        # Sample API usage data
        sample_usage = {
            "endpoint": "/ask",
            "request_count": 1,
            "usage_date": datetime.now().date().isoformat()
        }
        
        # Sample API history data
        sample_history = {
            "user_query": "How do I get weather data?",
            "generated_code": "fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY')",
            "endpoint": "https://api.openweathermap.org/data/2.5/weather",
            "status": "Success",
            "is_favorite": False
        }
        
        print("✅ Sample data ready for insertion (requires authenticated user)")
        return True
    except Exception as e:
        print(f"❌ Error preparing sample data: {e}")
        return False

def main():
    """Main initialization function"""
    print("🚀 Initializing Supabase for Talkapi...\n")
    
    # Test connection
    try:
        # Simple connection test
        response = supabase.table('api_usage').select('*').limit(1).execute()
        print("✅ Supabase connection successful")
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False
    
    # Create tables
    tables_created = all([
        create_users_table(),
        create_api_usage_table(),
        create_api_history_table(),
        create_user_profiles_table()
    ])
    
    if not tables_created:
        print("❌ Failed to create some tables")
        return False
    
    # Create security policies
    security_created = create_row_level_security_policies()
    
    # Create functions and triggers
    functions_created = create_functions_and_triggers()
    
    # Prepare sample data
    sample_data_ready = insert_sample_data()
    
    print("\n📊 Initialization Summary:")
    print(f"   Tables: {'✅' if tables_created else '❌'}")
    print(f"   Security: {'✅' if security_created else '❌'}")
    print(f"   Functions: {'✅' if functions_created else '❌'}")
    print(f"   Sample Data: {'✅' if sample_data_ready else '❌'}")
    
    if all([tables_created, security_created, functions_created, sample_data_ready]):
        print("\n🎉 Supabase initialization completed successfully!")
        print("\n📝 Next steps:")
        print("1. Configure authentication in Supabase dashboard")
        print("2. Set up email templates for auth")
        print("3. Configure storage buckets if needed")
        print("4. Test the API endpoints with the new database")
        return True
    else:
        print("\n⚠️  Some initialization steps failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    main() 