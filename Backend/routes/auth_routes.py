"""
Authentication proxy routes to handle Supabase auth through backend
This bypasses CORS issues by proxying requests through the backend server
"""

from flask import Blueprint, request, jsonify
import requests
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

@auth_bp.route('/signin', methods=['POST', 'OPTIONS'])
def signin():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    """Proxy sign in requests to Supabase"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Make request to Supabase auth API
        supabase_response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'email': email,
                'password': password
            }
        )
        
        if supabase_response.status_code == 200:
            # Success - return the response data
            response_data = supabase_response.json()
            logger.info(f"User signed in successfully: {email}")
            return jsonify(response_data), 200
        else:
            # Error - return error details
            error_data = supabase_response.json() if supabase_response.content else {}
            logger.error(f"Sign in failed for {email}: {error_data}")
            return jsonify(error_data), supabase_response.status_code
            
    except Exception as e:
        logger.error(f"Error in signin proxy: {str(e)}")
        return jsonify({'error': 'Internal server error during authentication'}), 500

@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    """Proxy sign up requests to Supabase"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Get frontend URL for email confirmation redirect
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5174')
        
        # Make request to Supabase auth API
        supabase_response = requests.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            headers={
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'email': email,
                'password': password,
                'options': {
                    'emailRedirectTo': f"{frontend_url}/auth/callback"
                }
            }
        )
        
        if supabase_response.status_code in [200, 201]:
            # Success - return the response data
            response_data = supabase_response.json()
            logger.info(f"User signed up successfully: {email}")
            return jsonify(response_data), supabase_response.status_code
        else:
            # Error - return error details
            error_data = supabase_response.json() if supabase_response.content else {}
            logger.error(f"Sign up failed for {email}: {error_data}")
            return jsonify(error_data), supabase_response.status_code
            
    except Exception as e:
        logger.error(f"Error in signup proxy: {str(e)}")
        return jsonify({'error': 'Internal server error during registration'}), 500

@auth_bp.route('/signout', methods=['POST', 'OPTIONS'])
def signout():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    """Proxy sign out requests to Supabase"""
    try:
        # Get authorization header from request
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        # Make request to Supabase auth API
        supabase_response = requests.post(
            f"{SUPABASE_URL}/auth/v1/logout",
            headers={
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Authorization': auth_header
            }
        )
        
        logger.info("User signed out successfully")
        return jsonify({'message': 'Signed out successfully'}), 200
            
    except Exception as e:
        logger.error(f"Error in signout proxy: {str(e)}")
        return jsonify({'error': 'Internal server error during sign out'}), 500

@auth_bp.route('/user', methods=['GET', 'OPTIONS'])
def get_user():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    """Proxy get user requests to Supabase"""
    try:
        # Get authorization header from request
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        # Make request to Supabase auth API
        supabase_response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Authorization': auth_header
            }
        )
        
        if supabase_response.status_code == 200:
            # Success - return the response data
            response_data = supabase_response.json()
            return jsonify(response_data), 200
        else:
            # Error - return error details
            error_data = supabase_response.json() if supabase_response.content else {}
            return jsonify(error_data), supabase_response.status_code
            
    except Exception as e:
        logger.error(f"Error in get user proxy: {str(e)}")
        return jsonify({'error': 'Internal server error getting user'}), 500

@auth_bp.route('/session', methods=['GET'])
def get_session():
    """Proxy get session requests to Supabase"""
    try:
        # Get authorization header from request
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header required'}), 401
        
        # Make request to Supabase auth API
        supabase_response = requests.get(
            f"{SUPABASE_URL}/auth/v1/token",
            headers={
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Authorization': auth_header
            }
        )
        
        if supabase_response.status_code == 200:
            # Success - return the response data
            response_data = supabase_response.json()
            return jsonify(response_data), 200
        else:
            # Error - return error details
            error_data = supabase_response.json() if supabase_response.content else {}
            return jsonify(error_data), supabase_response.status_code
            
    except Exception as e:
        logger.error(f"Error in get session proxy: {str(e)}")
        return jsonify({'error': 'Internal server error getting session'}), 500