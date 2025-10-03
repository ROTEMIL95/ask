# Fix for Supabase 404 (Not Found) Error on Profile Updates

## Problem
The `userProfile.updateProfile()` function was returning a 404 (Not Found) error when trying to update a user profile that doesn't exist. This happened because the function was trying to PATCH a non-existent record.

## Root Cause
When a user doesn't have a profile in the `user_profiles` table, attempting to update it with a PATCH request returns a 404 error because there's no record to update.

## Solution
Modified the `updateProfile` function to:
1. First check if the profile exists
2. If it doesn't exist, create it with the updates as initial values
3. If it exists, proceed with the normal update

## Changes Made

### 1. Updated `userProfile.updateProfile()` function
**File:** `Frontend/src/lib/supabase.js`

**Before:**
```javascript
updateProfile: async (userId, updates) => {
  // Direct PATCH request - would fail with 404 if profile doesn't exist
  const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    // ... headers and body
  })
}
```

**After:**
```javascript
updateProfile: async (userId, updates) => {
  // First check if profile exists
  const { data: existingProfile, error: getError } = await userProfile.getProfile(userId)
  
  if (getError) {
    return { data: null, error: getError }
  }

  // If profile doesn't exist, create it first with the updates
  if (!existingProfile) {
    const { user: currentUser, error: userError } = await auth.getCurrentUser()
    if (userError) {
      return { data: null, error: userError }
    }

    // Create profile with updates as initial values
    const { data: newProfile, error: createError } = await userProfile.createProfile(
      userId,
      currentUser.email,
      currentUser.user_metadata?.username,
      currentUser.user_metadata?.full_name,
      updates // Pass updates as initial values
    )

    if (createError) {
      return { data: null, error: createError }
    }

    return { data: newProfile, error: null }
  }

  // Profile exists, proceed with normal update
  const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    // ... headers and body
  })
}
```

### 2. Enhanced `userProfile.createProfile()` function
**File:** `Frontend/src/lib/supabase.js`

Added support for initial updates when creating profiles:

```javascript
createProfile: async (userId, email, username = null, fullName = null, initialUpdates = {}) => {
  // Prepare profile data with initial updates
  const profileData = {
    user_id: userId,
    email,
    username,
    full_name: fullName,
    plan_type: 'free',
    daily_limit: 5,
    api_calls_today: 0,
    ...initialUpdates // Apply any initial updates
  }

  // Create profile with combined data
  const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
    method: 'POST',
    body: JSON.stringify(profileData)
  })
}
```

## Benefits

### 1. No More 404 Errors
- Profile updates work even when the profile doesn't exist
- Automatic profile creation with the requested updates
- Seamless user experience

### 2. Better Error Handling
- Clear distinction between different error types
- Proper fallback to profile creation
- Detailed logging for debugging

### 3. Improved User Experience
- Users don't see cryptic 404 errors
- Profiles are created automatically when needed
- Updates work regardless of profile existence

## Usage Examples

### Updating Existing Profile
```javascript
const { data: updatedProfile, error } = await userProfile.updateProfile(userId, {
  plan_type: 'pro',
  daily_limit: 100
})

if (error) {
  console.error('Failed to update profile:', error.message)
} else {
  console.log('Profile updated:', updatedProfile)
}
```

### Updating Non-existent Profile
```javascript
// This will now create a profile with the updates instead of failing
const { data: newProfile, error } = await userProfile.updateProfile(userId, {
  plan_type: 'starter'
})

if (error) {
  console.error('Failed to create/update profile:', error.message)
} else {
  console.log('Profile created with updates:', newProfile)
}
```

## Migration Notes

### Backward Compatibility
- Function signature remains the same
- Return format is consistent
- Existing code works without changes

### Error Handling
- No changes needed to existing error handling
- 404 errors are now handled internally
- Other error types remain the same

## Testing

### Test Cases
1. **Update existing profile** - Should work normally
2. **Update non-existent profile** - Should create profile with updates
3. **Update with authentication error** - Should return 401
4. **Update with other errors** - Should return appropriate error

### Test Commands
```javascript
// Test with existing profile
const result1 = await userProfile.updateProfile(userId, { plan_type: 'pro' })

// Test with non-existent profile
const result2 = await userProfile.updateProfile(newUserId, { plan_type: 'starter' })

// Both should succeed without 404 errors
```

## Files Modified

1. **`Frontend/src/lib/supabase.js`**
   - Updated `userProfile.updateProfile()` to check for existing profiles
   - Enhanced `userProfile.createProfile()` to accept initial updates
   - Added proper error handling and logging

2. **Existing Components**
   - No changes required
   - All function calls remain the same
   - Error handling remains the same

## Related Issues

This fix resolves the issue where users would see 404 errors when trying to update their profiles for the first time, especially when:
- Users sign up but don't have profiles yet
- Users try to update usage tracking data
- Components try to update profile information

## Security Considerations

- All operations still require proper authentication
- Profile creation follows the same security rules as updates
- Row Level Security policies are enforced
- No sensitive data is exposed in error messages 