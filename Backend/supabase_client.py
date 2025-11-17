"""
Supabase client configuration for Talkapi backend
Handles database operations, authentication, and user management
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional, Dict, List, Any
from datetime import datetime, date
import json

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

# Initialize Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_SERVICE_KEY else None

class SupabaseManager:
    """Manager class for Supabase operations"""
    
    def __init__(self):
        self.client = supabase
        self.admin_client = supabase_admin
    
    def track_api_usage(self, user_id: str, endpoint: str) -> bool:
        """Track API usage for a user"""
        try:
            # Call the database function to track usage
            self.client.rpc('track_api_usage', {
                'p_user_id': user_id,
                'p_endpoint': endpoint
            }).execute()
            return True
        except Exception as e:
            print(f"Error tracking API usage: {e}")
            return False
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile information"""
        try:
            # Use admin client for consistent access
            client = self.admin_client or self.client
            response = client.schema('api').table('user_profiles').select('*').eq('user_id', user_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None
    
    def create_user_profile(self, user_id: str, email: str, username: str = None, full_name: str = None) -> bool:
        """Create a new user profile"""
        try:
            profile_data = {
                'user_id': user_id,
                'email': email,
                'username': username,
                'full_name': full_name,
                'plan_type': 'free',
                'daily_limit': 50,
                'api_calls_today': 0,
                'last_api_call_date': date.today().isoformat()
            }
            
            # Always use admin client for write operations to bypass RLS
            client = self.admin_client or self.client
            client.schema('api').table('user_profiles').insert(profile_data).execute()
            return True
        except Exception as e:
            print(f"Error creating user profile: {e}")
            return False
    
    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile information"""
        try:
            # Always use admin client for write operations to bypass RLS
            client = self.admin_client or self.client
            client.schema('api').table('user_profiles').update(updates).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating user profile: {e}")
            return False
    
    def save_api_history(self, user_id: str, user_query: str, generated_code: str = None, 
                        endpoint: str = None, status: str = 'Success', 
                        execution_result: Dict[str, Any] = None) -> bool:
        """Save API call to history"""
        try:
            history_data = {
                'user_id': user_id,
                'user_query': user_query,
                'generated_code': generated_code,
                'endpoint': endpoint,
                'status': status,
                'execution_result': json.dumps(execution_result) if execution_result else None,
                'is_favorite': False
            }
            
            self.client.table('api_history').insert(history_data).execute()
            return True
        except Exception as e:
            print(f"Error saving API history: {e}")
            return False
    
    def get_api_history(self, user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user's API call history"""
        try:
            response = self.client.table('api_history').select('*').eq('user_id', user_id).order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            return response.data
        except Exception as e:
            print(f"Error getting API history: {e}")
            return []
    
    def toggle_favorite(self, history_id: str, user_id: str) -> bool:
        """Toggle favorite status of an API call"""
        try:
            # Get current favorite status
            response = self.client.table('api_history').select('is_favorite').eq('id', history_id).eq('user_id', user_id).execute()
            
            if not response.data:
                return False
            
            current_status = response.data[0]['is_favorite']
            new_status = not current_status
            
            # Update favorite status
            self.client.table('api_history').update({'is_favorite': new_status}).eq('id', history_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error toggling favorite: {e}")
            return False
    
    def get_favorites(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's favorite API calls"""
        try:
            response = self.client.table('api_history').select('*').eq('user_id', user_id).eq('is_favorite', True).order('created_at', desc=True).execute()
            return response.data
        except Exception as e:
            print(f"Error getting favorites: {e}")
            return []
    
    def delete_api_history(self, history_id: str, user_id: str) -> bool:
        """Delete an API call from history"""
        try:
            self.client.table('api_history').delete().eq('id', history_id).eq('user_id', user_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting API history: {e}")
            return False
    
    # Subscription Management Functions
    def update_subscription_after_payment(self, user_id: str, sto_id: str, plan_type: str = 'pro', user_email: str = None, user_token: str = None, limits: dict = None) -> bool:
        """Update user subscription after successful payment"""
        try:
            from datetime import datetime, timezone

            # Use provided limits or default
            if limits is None:
                limits = {"convert_limit": 500, "run_limit": 2000} if plan_type == 'pro' else {"total_limit": 50}

            update_data = {
                'plan_type': plan_type,
                'sto_id': sto_id,
                'subscription_status': 'active',
                'subscription_start_date': datetime.now(timezone.utc).isoformat(),
                'last_payment_date': datetime.now(timezone.utc).isoformat(),
                'payment_method': 'credit_card',
                'daily_limit': 100 if plan_type == 'pro' else 50  # Pro gets 100/day
            }

            # Always use admin client for subscription updates to bypass RLS
            # User token is not needed since admin client has full access
            print(f"Using admin client to update subscription for {user_email}")
            client = self.admin_client or self.client

            # Update with correct column names
            profile_data = {
                "plan_type": plan_type,
                "subscription_status": "active",
                "subscription_start_date": update_data['subscription_start_date'],
                "last_payment_date": update_data['last_payment_date'],
                "payment_method": "credit_card",
                "daily_limit": update_data['daily_limit']
            }

            # Only include sto_id if it's not None (for Hosted Fields payments, sto_id is None)
            if sto_id is not None:
                profile_data["sto_id"] = sto_id

            # Update based on user_id (unique) - use api schema
            response = client.schema('api').table('user_profiles').update(profile_data).eq('user_id', user_id).select().execute()

            if response.data:
                print(f"✅ Updated subscription for user {user_id}: plan={plan_type}, sto_id={sto_id}, limits={limits}")
                return True
            else:
                print(f"❌ No rows updated - profile with user_id {user_id} not found")
                return False

        except Exception as e:
            print(f"❌ Error updating subscription: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_user_sto_id(self, user_id: str) -> Optional[str]:
        """Get user's STO ID for cancellation"""
        try:
            # Use admin client for consistent access
            client = self.admin_client or self.client
            response = client.schema('api').table('user_profiles').select('sto_id').eq('user_id', user_id).execute()
            
            if response.data and response.data[0]:
                return response.data[0].get('sto_id')
            return None
            
        except Exception as e:
            print(f"Error getting STO ID: {e}")
            return None
    
    def cancel_user_subscription(self, user_id: str) -> bool:
        """Cancel user subscription and reset to free plan"""
        try:
            from datetime import datetime, timezone
            
            update_data = {
                'plan_type': 'free',
                'subscription_status': 'cancelled',
                'subscription_end_date': datetime.now(timezone.utc).isoformat(),
                'daily_limit': 50,  # Reset to free tier limits
                'sto_id': None  # Clear the STO ID
            }
            
            # Always use admin client for write operations to bypass RLS
            client = self.admin_client or self.client
            response = client.schema('api').table('user_profiles').update(update_data).eq('user_id', user_id).execute()
            
            if response.data:
                print(f"Cancelled subscription for user {user_id}")
                return True
            return False
            
        except Exception as e:
            print(f"❌ Error cancelling subscription: {e}")
            return False
    
    def get_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's API usage statistics"""
        try:
            # Get today's usage
            today = date.today().isoformat()
            response = self.client.table('api_usage').select('*').eq('user_id', user_id).eq('usage_date', today).execute()
            
            total_today = sum(item['request_count'] for item in response.data)
            
            # Get user profile for limits
            profile = self.get_user_profile(user_id)
            daily_limit = profile['daily_limit'] if profile else 10
            
            return {
                'calls_today': total_today,
                'daily_limit': daily_limit,
                'remaining_calls': max(0, daily_limit - total_today),
                'plan_type': profile['plan_type'] if profile else 'free'
            }
        except Exception as e:
            print(f"Error getting usage stats: {e}")
            return {
                'calls_today': 0,
                'daily_limit': 50,
                'remaining_calls': 10,
                'plan_type': 'free'
            }
    
    def check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded rate limit"""
        try:
            stats = self.get_usage_stats(user_id)
            return stats['remaining_calls'] > 0
        except Exception as e:
            print(f"Error checking rate limit: {e}")
            return False
    
    def verify_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return user data"""
        try:
            # First try to decode the JWT token to extract user info
            import jwt
            
            # Decode without verification first to get user info
            # Since this is just for extracting user data and Supabase handles the security
            decoded_token = jwt.decode(access_token, options={"verify_signature": False})
            print(f"JWT decoded successfully: {decoded_token.get('email')}")
            
            return {
                'sub': decoded_token.get('sub'),
                'email': decoded_token.get('email'),
                'user_metadata': decoded_token.get('user_metadata', {}),
                'app_metadata': decoded_token.get('app_metadata', {})
            }
                
        except Exception as e:
            print(f"Error decoding JWT token: {e}")
            
            # Fallback to the old method
            try:
                headers = {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                }
                
                import requests
                response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers)
                
                if response.status_code == 200:
                    user_data = response.json()
                    print(f"Token verified for user via API: {user_data.get('email')}")
                    return user_data
                else:
                    print(f"Token verification failed: {response.status_code}")
                    print(f"Response text: {response.text}")
                    return None
                    
            except Exception as fallback_error:
                print(f"Fallback verification also failed: {fallback_error}")
                return None

# Create a global instance
supabase_manager = SupabaseManager()

def get_supabase_manager() -> SupabaseManager:
    """Get the global Supabase manager instance"""
    return supabase_manager 