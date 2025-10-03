#!/usr/bin/env python3
"""
Setup script to configure Anthropic environment variables
"""

import os
from pathlib import Path

def setup_environment():
    """Set up the .env file with Anthropic credentials"""
    
    # Anthropic API key (you need to add your own)
    anthropic_key = "your_anthropic_api_key_here"
    
    # OpenWeatherMap API key
    openweathermap_key = "d1f4a5d4c0c7259ecc3371c5c2946d36"
    
    # Supabase configuration (you'll need to add your actual credentials)
    supabase_url = "your_supabase_project_url"
    supabase_anon_key = "your_supabase_anon_key"
    
    # Create .env file content
    env_content = f"""# Anthropic Configuration
ANTHROPIC_API_KEY={anthropic_key}

# OpenWeatherMap Configuration
OPENWEATHERMAP_API_KEY={openweathermap_key}

# Supabase Configuration
SUPABASE_URL={supabase_url}
SUPABASE_ANON_KEY={supabase_anon_key}

# Note: You need to add your actual Anthropic API key for Claude to work
# Get your API key from: https://console.anthropic.com/
"""
    
    # Write to .env file
    env_file = Path('.env')
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print("✅ Environment file created successfully!")
    print(f"📁 Created: {env_file.absolute()}")
    print("🤖 Anthropic API key needs to be configured")
    print("🌤️ OpenWeatherMap API key configured")
    print("🗄️ Supabase configuration added (update with your actual credentials)")
    print("\n🚀 You can now run the backend with: python app.py")
    print("\n📋 Next steps:")
    print("1. Get your Anthropic API key from https://console.anthropic.com/")
    print("2. Update the .env file with your actual Anthropic API key")
    print("3. Create a Supabase project at https://supabase.com")
    print("4. Get your project URL and anon key from Settings > API")
    print("5. Update the .env file with your actual Supabase credentials")
    print("6. Run the SQL migration: supabase_migrations.sql")

if __name__ == "__main__":
    setup_environment() 