# Fix for Supabase 406 (Not Acceptable) Error

## Problem
The application was getting a 406 (Not Acceptable) error when trying to access user profiles that don't exist in the `user_profiles` table. The error occurred because the code was using `.single()` which expects exactly one row, but when no profile exists, it returns a 406 error.

## Root Cause
The `userProfile.getProfile()` function in `Frontend/src/lib/supabase.js` was using `.single()` which throws an error when no matching row is found.

## Solution
Changed the `userProfile.getProfile()` function to use `.maybeSingle()` instead of `.single()`. This method returns `null` for the data when no row is found, rather than throwing an error.

### Changes Made

#### 1. Updated `userProfile.getProfile()` function
**File:** `Frontend/src/lib/supabase.js`

**Before:**
```javascript
getProfile: async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
},
```

**After:**
```javascript
getProfile: async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles

    if (error) {
      console.error('Error getting user profile:', error)
      return { data: null, error }
    }

    // If no profile exists, return null data (not an error)
    if (!data) {
      console.log('No user profile found for user:', userId)
      return { data: null, error: null }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Error in getProfile:', err)
    return { data: null, error: err }
  }
},
```

#### 2. Updated auth functions to handle null profiles
**File:** `Frontend/src/lib/supabase.js`

Updated the sign-in function to check for `!profile && !profileError` instead of checking for a specific error code.

#### 3. Updated components to handle missing profiles
**Files:** 
- `Frontend/src/components/UsageTracker.jsx`
- `Frontend/src/pages/Pricing.jsx`

Added logic to automatically create user profiles when they don't exist:

```javascript
// If profile doesn't exist, create it
if (!profile && !profileError) {
  console.log('Creating user profile for:', currentUser.id);
  const { data: newProfile, error: createError } = await userProfile.createProfile(
    currentUser.id,
    currentUser.email,
    currentUser.user_metadata?.username,
    currentUser.user_metadata?.full_name
  );
  
  if (createError) {
    console.error('Error creating user profile:', createError);
    // Continue with default values
    userProfileData = null;
  } else {
    userProfileData = newProfile;
  }
}
```

## Benefits
1. **No more 406 errors**: The application gracefully handles missing user profiles
2. **Automatic profile creation**: User profiles are created automatically when needed
3. **Better error handling**: Clear distinction between actual errors and missing data
4. **Improved user experience**: Users don't see cryptic error messages

## Testing
To test the fix:
1. Try accessing the application with a user that doesn't have a profile
2. The application should now create the profile automatically instead of showing a 406 error
3. Check the browser console for log messages about profile creation

## Files Modified
- `Frontend/src/lib/supabase.js` - Updated getProfile function and auth handlers
- `Frontend/src/components/UsageTracker.jsx` - Added profile creation logic
- `Frontend/src/pages/Pricing.jsx` - Added profile creation logic

## Related Issues
This fix resolves the issue where users would see a 406 error when trying to access their account or usage information for the first time. 