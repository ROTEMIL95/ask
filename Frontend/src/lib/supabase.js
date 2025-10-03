import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
  console.warn('Using placeholder values - authentication will not work until proper credentials are set')
  console.warn('See SUPABASE_SETUP.md for detailed setup instructions')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // or custom storage for SSR
  }
})

// Get access token from current session
export const getAccessToken = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting session:', error)
      return { token: null, error }
    }

    if (!session) {
      console.log('No active session found')
      return { token: null, error: { message: 'No active session found', status: 401 } }
    }

    return { token: session.access_token, error: null }
  } catch (err) {
    console.error('Error in getAccessToken:', err)
    return { token: null, error: err }
  }
}

// Authentication helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, name) => {
    try {
      console.log('Supabase signUp called with:', {
        email: email,
        name: name,
        password: password ? 'Yes (length: ' + password.length + ')' : 'No'
      })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      })

      console.log('data:', data)
      if (data?.user && !error) {
        console.log('User created successfully:', data.user.id)
        // Profile will be created on first login instead of during signup
        // This avoids any potential database errors during signup
      }

      return { data, error }
    } catch (err) {
      console.error('Sign up error:', err)
      return { data: null, error: err }
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    console.log("🚀 ~ password:", password)
    console.log("🚀 ~ email:", email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      console.log("🚀 ~ data:", data)

      const { data: { session } } = await supabase.auth.getSession()
      console.log("🚀 ~ session:", session)
      if (data?.user && !error) {
        console.log('User signed in successfully:', data.user.id)

        // Get or create user profile
        try {
          const { data: profile, error: profileError } = await userProfile.getProfile(data.user.id)

          if (!profile && !profileError) {
            // Profile doesn't exist, create it
            const { error: createError } = await userProfile.createProfile(
              data.user.id,
              data.user.email,
              data.user.user_metadata?.username,
              data.user.user_metadata?.full_name
            )

            if (createError) {
              console.error('Error creating user profile:', createError)
            } else {
              console.log('User profile created during sign in')
            }
          } else if (profileError) {
            console.error('Error getting user profile:', profileError)
          } else {
            console.log('User profile loaded successfully')
          }
        } catch (profileErr) {
          console.error('Error handling user profile:', profileErr)
        }
      }

      return { data, error }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: err }
    }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        // Don't log errors for normal "no session" scenarios
        const errorMessage = error.message?.toLowerCase() || ''
        if (errorMessage.includes('user from sub claim in jwt does not exist') ||
          errorMessage.includes('invalid jwt') ||
          errorMessage.includes('no session')) {
          console.log('No active user session - this is normal for new users')
          return { user: null, error: { message: 'No session' } }
        } else {
          console.error('Error getting current user:', error)
        }
      }

      return { user, error }
    } catch (err) {
      console.error('Error getting current user:', err)
      return { user: null, error: err }
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    try {
      return supabase.auth.onAuthStateChange(callback)
    } catch (err) {
      console.error('Error setting up auth state listener:', err)
      return { data: { subscription: null } }
    }
  }
}

// API History helpers
export const apiHistory = {
  // Get user's API history
  getHistory: async (userId, limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from('api_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return { data, error }
  },

  // Save API call to history
  saveHistory: async (userId, query, generatedCode, endpoint, status = 'Success', result = null) => {
    const { data, error } = await supabase
      .from('api_history')
      .insert({
        user_id: userId,
        user_query: query,
        generated_code: generatedCode,
        endpoint,
        status,
        execution_result: result,
        is_favorite: false
      })

    return { data, error }
  },

  // Toggle favorite status
  toggleFavorite: async (historyId, userId) => {
    // First get current status
    const { data: current } = await supabase
      .from('api_history')
      .select('is_favorite')
      .eq('id', historyId)
      .eq('user_id', userId)
      .single()

    if (!current) return { error: 'Record not found' }

    // Update to opposite status
    const { data, error } = await supabase
      .from('api_history')
      .update({ is_favorite: !current.is_favorite })
      .eq('id', historyId)
      .eq('user_id', userId)

    return { data, error }
  },

  // Get favorites
  getFavorites: async (userId) => {
    const { data, error } = await supabase
      .from('api_history')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Delete history item
  deleteHistory: async (historyId, userId) => {
    const { data, error } = await supabase
      .from('api_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', userId)

    return { data, error }
  }
}

// User Profile helpers
export const userProfile = {
  // Get user profile
  getProfile: async (userId) => {
    try {
      // Get access token for authentication
      const { token, error: tokenError } = await getAccessToken()

      if (tokenError) {
        console.error('Error getting access token:', tokenError)
        return { data: null, error: tokenError }
      }

      if (!token) {
        console.error('No access token available')
        return { data: null, error: { message: 'No active session found', status: 401 } }
      }

      // Make authenticated request to user_profiles
      const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*&user_id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      })

      if (response.status === 401) {
        console.error('Unauthorized access to user profile')
        return { data: null, error: { message: 'Unauthorized access', status: 401 } }
      }

      if (!response.ok) {
        console.error('Error fetching user profile:', response.status, response.statusText)
        return { data: null, error: { message: `HTTP ${response.status}: ${response.statusText}`, status: response.status } }
      }

      const data = await response.json()

      // If no profile exists, return null data (not an error)
      if (!data || data.length === 0) {
        console.log('No user profile found for user:', userId)
        return { data: null, error: null }
      }

      return { data: data[0], error: null }
    } catch (err) {
      console.error('Error in getProfile:', err)
      return { data: null, error: err }
    }
  },

  // Create user profile
  createProfile: async (userId, email, username = null, fullName = null, initialUpdates = {}) => {
    try {
      // Get access token for authentication
      const { token, error: tokenError } = await getAccessToken()

      if (tokenError) {
        console.error('Error getting access token:', tokenError)
        return { data: null, error: tokenError }
      }

      if (!token) {
        console.error('No access token available')
        return { data: null, error: { message: 'No active session found', status: 401 } }
      }

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

      // Make authenticated request to create user profile
      const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(profileData)
      })

      if (response.status === 401) {
        console.error('Unauthorized access to create user profile')
        return { data: null, error: { message: 'Unauthorized access', status: 401 } }
      }

      if (!response.ok) {
        console.error('Error creating user profile:', response.status, response.statusText)
        return { data: null, error: { message: `HTTP ${response.status}: ${response.statusText}`, status: response.status } }
      }

      const data = await response.json()
      return { data: data[0], error: null }
    } catch (err) {
      console.error('Error in createProfile:', err)
      return { data: null, error: err }
    }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    try {
      // Get access token for authentication
      const { token, error: tokenError } = await getAccessToken()

      if (tokenError) {
        console.error('Error getting access token:', tokenError)
        return { data: null, error: tokenError }
      }

      if (!token) {
        console.error('No access token available')
        return { data: null, error: { message: 'No active session found', status: 401 } }
      }

      // First check if profile exists
      const { data: existingProfile, error: getError } = await userProfile.getProfile(userId)

      if (getError) {
        console.error('Error checking if profile exists:', getError)
        return { data: null, error: getError }
      }

      // If profile doesn't exist, create it first with the updates
      if (!existingProfile) {
        console.log('Profile does not exist, creating new profile for user:', userId)

        // Get current user info for profile creation
        const { user: currentUser, error: userError } = await auth.getCurrentUser()
        if (userError) {
          console.error('Error getting current user for profile creation:', userError)
          return { data: null, error: userError }
        }

        // Create the profile with the updates included
        const { data: newProfile, error: createError } = await userProfile.createProfile(
          userId,
          currentUser.email,
          currentUser.user_metadata?.username,
          currentUser.user_metadata?.full_name,
          updates // Pass updates as initial values
        )

        if (createError) {
          console.error('Error creating profile:', createError)
          return { data: null, error: createError }
        }

        return { data: newProfile, error: null }
      }

      // Profile exists, proceed with update using direct REST API call with proper headers
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updates)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error updating user profile:', response.status, errorText)
          return { data: null, error: { message: `HTTP ${response.status}: ${errorText}`, status: response.status } }
        }

        const data = await response.json()
        return { data: data[0] || null, error: null }
      } catch (fetchError) {
        console.error('Network error updating profile:', fetchError)
        
        // Fallback to Supabase client if direct fetch fails
        try {
          console.log('Falling back to Supabase client method...')
          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating user profile with Supabase client:', updateError)
            return { data: null, error: updateError }
          }

          return { data: updatedProfile, error: null }
        } catch (supabaseError) {
          console.error('Both direct fetch and Supabase client failed:', supabaseError)
          return { data: null, error: supabaseError }
        }
      }
    } catch (err) {
      console.error('Error in updateProfile:', err)
      return { data: null, error: err }
    }
  }
}

// Usage tracking helpers
export const usageTracking = {
  // Get usage statistics
  getUsageStats: async (userId) => {
    try {
      // Get access token for authentication
      const { token, error: tokenError } = await getAccessToken()

      if (tokenError) {
        console.error('Error getting access token:', tokenError)
        return { error: tokenError }
      }

      if (!token) {
        console.error('No access token available')
        return { error: { message: 'No active session found', status: 401 } }
      }

      // Get today's usage
      const today = new Date().toISOString().split('T')[0]

      const usageResponse = await fetch(`${supabaseUrl}/rest/v1/api_usage?select=*&user_id=eq.${userId}&usage_date=eq.${today}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      })

      if (usageResponse.status === 401) {
        console.error('Unauthorized access to usage data')
        return { error: { message: 'Unauthorized access', status: 401 } }
      }

      if (!usageResponse.ok) {
        console.error('Error fetching usage data:', usageResponse.status, usageResponse.statusText)
        return { error: { message: `HTTP ${usageResponse.status}: ${usageResponse.statusText}`, status: usageResponse.status } }
      }

      const usageData = await usageResponse.json()

      // Get user profile for limits
      const { data: profile, error: profileError } = await userProfile.getProfile(userId)

      if (profileError) return { error: profileError }

      const totalToday = usageData.reduce((sum, item) => sum + item.request_count, 0)
      const dailyLimit = profile?.daily_limit || 5

      return {
        data: {
          calls_today: totalToday,
          daily_limit: dailyLimit,
          remaining_calls: Math.max(0, dailyLimit - totalToday),
          plan_type: profile?.plan_type || 'free'
        },
        error: null
      }
    } catch (err) {
      console.error('Error in getUsageStats:', err)
      return { error: err }
    }
  },

  // Check if user has exceeded rate limit
  checkRateLimit: async (userId) => {
    const { data, error } = await usageTracking.getUsageStats(userId)

    if (error) return { canProceed: false, error }

    return { canProceed: data.remaining_calls > 0, data }
  }
}

// Real-time subscriptions
export const realtime = {
  // Subscribe to API history changes
  subscribeToHistory: (userId, callback) => {
    return supabase
      .channel('api_history')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'api_history',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  },

  // Subscribe to usage changes
  subscribeToUsage: (userId, callback) => {
    return supabase
      .channel('api_usage')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'api_usage',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }
}

export default supabase 