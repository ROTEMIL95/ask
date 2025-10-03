#!/usr/bin/env python3
"""
Setup script for Talkapi Backend
"""

import os
import subprocess
import sys

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = '.env'
    if not os.path.exists(env_file):
        with open(env_file, 'w') as f:
            f.write("# OpenAI API Configuration\n")
            f.write("# Get your API key from: https://platform.openai.com/api-keys\n")
            f.write("OPENAI_API_KEY=your_openai_api_key_here\n")
            f.write("OPENAI_PROJECT_ID=your_openai_project_id_here\n\n")
            f.write("# Flask Configuration\n")
            f.write("FLASK_ENV=production\n")
            f.write("FLASK_DEBUG=False\n")
        print(f"✅ Created {env_file} file")
        print("⚠️  Please edit the .env file and add your OpenAI API key and project ID")
    else:
        print(f"✅ {env_file} file already exists")

def install_dependencies():
    """Install Python dependencies"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def check_openai_key():
    """Check if OpenAI API key and project ID are set"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        api_key_ok = os.getenv('OPENAI_API_KEY') and os.getenv('OPENAI_API_KEY') != 'your_openai_api_key_here'
        project_id_ok = os.getenv('OPENAI_PROJECT_ID') and os.getenv('OPENAI_PROJECT_ID') != 'your_openai_project_id_here'
        
        if api_key_ok and project_id_ok:
            print("✅ OpenAI API key and project ID are configured")
            return True
        else:
            print("⚠️  OpenAI configuration incomplete")
            if not api_key_ok:
                print("   - API key not configured")
            if not project_id_ok:
                print("   - Project ID not configured")
            print("   Please edit the .env file and add your API key and project ID")
            return False
    except ImportError:
        print("⚠️  python-dotenv not available, skipping API key check")
        return False

def main():
    print("🚀 Setting up Talkapi Backend...\n")
    
    # Install dependencies
    print("📦 Installing dependencies...")
    install_dependencies()
    
    # Create .env file
    print("\n🔧 Creating environment file...")
    create_env_file()
    
    # Check API key
    print("\n🔑 Checking OpenAI API key...")
    try:
        from dotenv import load_dotenv
        check_openai_key()
    except ImportError:
        print("⚠️  python-dotenv not installed, skipping API key check")
    
    print("\n🎉 Setup complete!")
    print("\n📝 Next steps:")
    print("1. Edit the .env file and add your OpenAI API key and project ID")
    print("2. Run: python app.py")
    print("3. The server will start on http://localhost:5000")

if __name__ == '__main__':
    main() 