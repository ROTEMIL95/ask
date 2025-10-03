"""
Monthly Quota Management for TalkAPI
Handles user quota checking and decrementing for API usage
"""

from supabase_client import supabase_manager
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

def check_and_decrement(supabase_mgr, user_id: str, usage: str = "convert") -> None:
    """
    Check if user has quota remaining and decrement it
    
    Args:
        supabase_mgr: Supabase manager instance
        user_id: User ID to check quota for (or "anonymous" for anonymous users)
        usage: Type of usage ("convert" or "run")
    
    Raises:
        ValueError: If quota exceeded or user not found
    """
    if not user_id:
        raise ValueError("User ID is required")
    
    try:
        # Handle anonymous users
        if user_id == "anonymous":
            # For anonymous users, we'll use a simple in-memory counter or check against a default limit
            # This is a simplified approach - in production you might want to store this in a separate table
            profile = {
                'plan_type': 'free',
                'total_limit': 10,  # Anonymous users get 10 free calls
                'api_calls_today': 0,
                'last_api_call_date': date.today().isoformat()
            }
        else:
            # Get user profile to check current quota
            profile = supabase_mgr.get_user_profile(user_id)
            if not profile:
                raise ValueError("User profile not found")
        
        plan_type = profile.get('plan_type', 'free')
        current_date = date.today().isoformat()
        last_call_date = profile.get('last_api_call_date')
        
        # Reset daily counters if it's a new day
        if last_call_date != current_date:
            # Reset daily counters
            if user_id != "anonymous":
                # Only update database for real users
                supabase_mgr.update_user_profile(user_id, {
                    'last_api_call_date': current_date,
                    'api_calls_today': 0
                })
            profile['api_calls_today'] = 0
            profile['last_api_call_date'] = current_date
        
        # Check quota based on plan type
        if plan_type == 'pro':
            # Pro plan: 500 convert + 2000 run per month
            if usage == "convert":
                convert_limit = profile.get('convert_limit', 500)
                if profile.get('api_calls_today', 0) >= convert_limit:
                    raise ValueError("Daily convert quota exceeded for Pro plan")
            elif usage == "run":
                run_limit = profile.get('run_limit', 2000)
                if profile.get('api_calls_today', 0) >= run_limit:
                    raise ValueError("Daily run quota exceeded for Pro plan")
        else:
            # Free plan: 50 total per month
            total_limit = profile.get('total_limit', 50)
            if profile.get('api_calls_today', 0) >= total_limit:
                raise ValueError("Daily quota exceeded for Free plan")
        
        # Decrement quota
        new_count = profile.get('api_calls_today', 0) + 1
        if user_id != "anonymous":
            # Only update database for real users
            supabase_mgr.update_user_profile(user_id, {
                'api_calls_today': new_count
            })
        
        logger.info(f"Quota decremented for user {user_id}, usage: {usage}, new count: {new_count}")

    except Exception as e:
        if isinstance(e, ValueError):
            raise
        logger.error(f"Error checking/decrementing quota for user {user_id}: {e}")
        raise ValueError("Failed to check quota")

def get_remaining_quota(supabase_mgr, user_id: str) -> dict:
    """
    Get remaining quota for a user
    
    Args:
        supabase_mgr: Supabase manager instance
        user_id: User ID to check quota for (or "anonymous" for anonymous users)
    
    Returns:
        dict: Quota information
    """
    try:
        # Handle anonymous users
        if user_id == "anonymous":
            # For anonymous users, return default quota info
            return {
                'plan_type': 'anonymous',
                'total_remaining': 10,  # Anonymous users get 10 free calls
                'total_limit': 10
            }
        
        profile = supabase_mgr.get_user_profile(user_id)
        if not profile:
            return {"error": "User profile not found"}
        
        plan_type = profile.get('plan_type', 'free')
        current_date = date.today().isoformat()
        last_call_date = profile.get('last_api_call_date')
        
        # Reset daily counters if it's a new day
        if last_call_date != current_date:
            supabase_mgr.update_user_profile(user_id, {
                'last_api_call_date': current_date,
                'api_calls_today': 0
            })
            profile['api_calls_today'] = 0
        
        if plan_type == 'pro':
            return {
                'plan_type': 'pro',
                'convert_remaining': max(0, 500 - profile.get('api_calls_today', 0)),
                'run_remaining': max(0, 2000 - profile.get('api_calls_today', 0)),
                'convert_limit': 500,
                'run_limit': 2000
            }
        else:
            return {
                'plan_type': 'free',
                'total_remaining': max(0, 50 - profile.get('api_calls_today', 0)),
                'total_limit': 50
            }

    except Exception as e:
        logger.error(f"Error getting quota for user {user_id}: {e}")
        return {"error": "Failed to get quota information"}

def reset_daily_quota(supabase_mgr, user_id: str) -> bool:
    """
    Reset daily quota for a user (admin function)
    
    Args:
        supabase_mgr: Supabase manager instance
        user_id: User ID to reset quota for (or "anonymous" for anonymous users)
    
    Returns:
        bool: Success status
    """
    try:
        # Anonymous users don't need quota reset
        if user_id == "anonymous":
            return True
            
        current_date = date.today().isoformat()
        return supabase_mgr.update_user_profile(user_id, {
            'last_api_call_date': current_date,
            'api_calls_today': 0
        })
    except Exception as e:
        logger.error(f"Error resetting quota for user {user_id}: {e}")
        return False
