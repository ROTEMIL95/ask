import { useState, useEffect } from 'react'
import { userProfile, auth, supabase } from '../lib/supabase.jsx'

// Function to sanitize error messages for user display
const sanitizeErrorMessage = (errorMessage) => {
  if (!errorMessage) return 'An unexpected error occurred'
  
  // Convert to lowercase for easier matching
  const message = errorMessage.toLowerCase()
  
  // Technical backend errors to replace
  if (message.includes('user from sub claim in jwt does not exist')) {
    return 'Authentication session expired. Please sign in again.'
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Session expired. Please sign in again.'
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return 'Profile not found. Please try again.'
  }
  
  if (message.includes('network error') || message.includes('fetch')) {
    return 'Connection error. Please check your internet connection and try again.'
  }
  
  if (message.includes('internal server error') || message.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  // Default user-friendly message for unknown errors
  return 'Something went wrong. Please try again.'
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  // Get current user and profile
  const fetchProfile = async (userId) => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useUserProfile] Fetching profile for user:', userId)
      const { data, error } = await userProfile.getProfile(userId)

      if (error) {
        console.error('Error fetching profile:', error)
        setError(sanitizeErrorMessage(error.message))
        return null
      }

      console.log('[useUserProfile] Profile fetched successfully:', data?.plan_type)
      return data
    } catch (err) {
      console.error('Error in fetchProfile:', err)
      setError(sanitizeErrorMessage(err.message))
      return null
    } finally {
      console.log('[useUserProfile] Setting loading to false')
      setLoading(false)
    }
  }

  // Create new profile
  const createProfile = async (userId, email, username = null, fullName = null) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await userProfile.createProfile(userId, email, username, fullName)
      
      if (error) {
        console.error('Error creating profile:', error)
        setError(sanitizeErrorMessage(error.message))
        return false
      }
      
      setProfile(data)
      return true
    } catch (err) {
      console.error('Error in createProfile:', err)
      setError(sanitizeErrorMessage(err.message))
      return false
    } finally {
      setLoading(false)
    }
  }

  // Update profile
  const updateProfile = async (updates) => {
    if (!user?.id) {
      setError('No user logged in')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await userProfile.updateProfile(user.id, updates)
      
      if (error) {
        console.error('Error updating profile:', error)
        setError(sanitizeErrorMessage(error.message))
        return false
      }
      
      // Refresh profile data
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)
      return true
    } catch (err) {
      console.error('Error in updateProfile:', err)
      setError(sanitizeErrorMessage(err.message))
      return false
    } finally {
      setLoading(false)
    }
  }

  // Initialize user and profile
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // First check if there's an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setError(sanitizeErrorMessage(sessionError.message))
          setLoading(false)
          return
        }
        
        if (!session) {
          console.log('No active session found')
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Get current user
        const { user: currentUser, error: userError } = await auth.getCurrentUser()
        
        if (userError) {
          // Don't log or set error for "no session" or JWT errors when no user is logged in
          // This is normal behavior during initialization
          const errorMessage = userError.message?.toLowerCase() || ''
          if (errorMessage.includes('no session') || 
              errorMessage.includes('user from sub claim in jwt does not exist') ||
              errorMessage.includes('invalid jwt')) {
            console.log('No active user session - this is normal for new users')
            setUser(null)
            setProfile(null)
          } else {
            console.error('Error getting current user:', userError)
            setError(sanitizeErrorMessage(userError.message))
          }
          setLoading(false)
          return
        }

        if (!currentUser) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setUser(currentUser)
        
        // Try to get existing profile
        const existingProfile = await fetchProfile(currentUser.id)
        
        if (!existingProfile) {
          // Create new profile if none exists
          const created = await createProfile(
            currentUser.id,
            currentUser.email,
            currentUser.user_metadata?.username,
            currentUser.user_metadata?.full_name
          )
          
          if (created) {
            const newProfile = await fetchProfile(currentUser.id)
            setProfile(newProfile)
          }
        } else {
          setProfile(existingProfile)
        }
      } catch (err) {
        console.error('Error initializing user:', err)
        setError(sanitizeErrorMessage(err.message))
      } finally {
        setLoading(false)
      }
    }

    initializeUser()

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Helper functions for common profile operations
  const updateUsername = async (username) => {
    return updateProfile({ username })
  }

  const updateFullName = async (fullName) => {
    return updateProfile({ full_name: fullName })
  }

  const updateEmail = async (email) => {
    return updateProfile({ email })
  }

  const updatePlanType = async (planType) => {
    return updateProfile({ plan_type: planType })
  }

  const updateDailyLimit = async (dailyLimit) => {
    return updateProfile({ daily_limit: dailyLimit })
  }

  // Get usage statistics
  const getUsageStats = () => {
    if (!profile) return null
    
    return {
      planType: profile.plan_type || 'free',
      dailyLimit: profile.daily_limit || 50,
      apiCallsToday: profile.api_calls_today || 0,
      remainingCalls: Math.max(0, (profile.daily_limit || 50) - (profile.api_calls_today || 0)),
      lastApiCallDate: profile.last_api_call_date
    }
  }

  // Check if user can make API calls
  const canMakeApiCall = () => {
    const stats = getUsageStats()
    if (!stats) return false
    
    return stats.remainingCalls > 0
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user?.id) return false
    
    try {
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)
      return true
    } catch (err) {
      console.error('Error refreshing profile:', err)
      return false
    }
  }

  return {
    // State
    user,
    profile,
    loading,
    error,
    
    // Actions
    createProfile,
    updateProfile,
    refreshProfile,
    updateUsername,
    updateFullName,
    updateEmail,
    updatePlanType,
    updateDailyLimit,
    
    // Helpers
    getUsageStats,
    canMakeApiCall,
    
    // Computed values
    isAuthenticated: !!user,
    hasProfile: !!profile,
    username: profile?.username,
    fullName: profile?.full_name,
    email: profile?.email,
    planType: profile?.plan_type || 'free',
    dailyLimit: profile?.daily_limit || 50,
    apiCallsToday: profile?.api_calls_today || 0
  }
} 