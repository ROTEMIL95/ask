import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, supabase } from '../lib/supabase'
import authProxy from '../lib/authProxy'
import {sanitizeErrorMessage} from '../services/auth.service'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}




export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Function to load user from authProxy
  const loadUserFromProxy = async () => {
    try {
      console.log('🔄 Loading user from authProxy...')
      const session = authProxy.getSession()
      const user = authProxy.getUser()
      
      if (session && user) {
        setUser(user)
        console.log('✅ User loaded from authProxy:', user.email)
        console.log('✅ isAuthenticated:', !!user)
        return true
      } else {
        setUser(null)
        console.log('❌ No user session found in authProxy')
        return false
      }
    } catch (error) {
      console.error('Error loading user from authProxy:', error)
      setUser(null)
      return false
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check if Supabase credentials are properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('Supabase credentials not configured. Authentication will not work.')
          const errorMsg = 'Authentication service not configured. Please contact support.'
          setError(errorMsg)
          setLoading(false)
          return
        }
        
        // Check for session using authProxy (which handles localStorage)
        const session = authProxy.getSession()
        
        if (!session) {
          console.log('No active session found')
          setUser(null)
          setLoading(false)
          return
        }
        
        // Get user from session (already available from authProxy)
        const currentUser = authProxy.getUser()
        
        if (!currentUser) {
          console.log('No user data in session')
          setUser(null)
          setLoading(false)
          return
        }

        // Set the user from the authProxy session
        setUser(currentUser)
        console.log('Auth initialized with user:', currentUser.email)
      } catch (err) {
        console.error('Error initializing auth:', err)
        setError(sanitizeErrorMessage(err.message))
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Note: Auth state changes are now handled manually via authProxy
    // The old Supabase onAuthStateChange listener is disabled since we use backend proxy
    console.log('AuthContext initialized - using authProxy for state management')
  }, [])

  // Sign up function
  const signUp = async (email, password, name) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Supabase credentials are configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const errorMsg = 'Authentication service not configured. Please contact support.'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
      
      console.log('Attempting to sign up with email:', email)
      console.log('Name provided:', name)
      console.log('Password provided:', password ? 'Yes (length: ' + password.length + ')' : 'No')
      const { data, error } = await authProxy.signUp(email, password, name)
      
      if (error) {
        console.error('Sign up error:', error)
        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      
      console.log('Sign up successful:', data)
      
      // Handle different signup scenarios
      if (data?.user) {
        if (!data.user.email_confirmed_at) {
          // User needs email confirmation (if enabled in Supabase)
          console.log('User needs email confirmation')
          return { 
            success: true, 
            data,
            message: 'Account created successfully! Please check your email to confirm your account before signing in.'
          }
        } else {
          // User is already confirmed, automatically sign them in
          console.log('User is confirmed, automatically signing in')
          const signInResult = await signIn(email, password)
          if (signInResult.success) {
            return { 
              success: true, 
              data: signInResult.data,
              message: 'Account created and signed in successfully!'
            }
          } else {
            return { 
              success: false, 
              error: 'Account created but automatic sign-in failed. Please sign in manually.'
            }
          }
        }
      }
      
      // If no user data but no error, try to sign in automatically
      // This handles the case where email confirmation is disabled
      console.log('No user data in response, attempting automatic sign-in')
      const signInResult = await signIn(email, password)
      if (signInResult.success) {
        return { 
          success: true, 
          data: signInResult.data,
          message: 'Account created and signed in successfully!'
        }
      } else {
        return { 
          success: true, 
          data,
          message: 'Account created successfully! Please sign in to continue.'
        }
      }
    } catch (err) {
      console.error('Sign up error:', err)
      const sanitizedError = sanitizeErrorMessage(err.message)
      setError(sanitizedError)
      return { success: false, error: sanitizedError }
    } finally {
      setLoading(false)
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Supabase credentials are configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const errorMsg = 'Authentication service not configured. Please contact support.'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
      
      console.log('Attempting to sign in with email!!!:', email)
      const { data, error } = await authProxy.signIn(email, password)
      console.log("🚀 ~ signIn ~ error:", error)
      console.log("🚀 ~ signIn ~ data:", data)
      
      if (error) {
        console.error('Sign in error:', error)
        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      
      console.log('Sign in successful:', data)
      
      // Update the user state in AuthContext immediately
      if (data?.user) {
        setUser(data.user)
        console.log('✅ User state updated in AuthContext:', data.user.email)
        console.log('✅ AuthContext isAuthenticated should now be:', !!data.user)
        
        // Force immediate re-render with updated state
        setLoading(false)
      }
      
      return { success: true, data }
    } catch (err) {
      console.error('Sign in error:', err)
      const sanitizedError = sanitizeErrorMessage(err.message)
      setError(sanitizedError)
      return { success: false, error: sanitizedError }
    } finally {
      setLoading(false)
    }
  }

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Supabase credentials are configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const errorMsg = 'Authentication service not configured. Please contact support.'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
      
      console.log('Attempting to sign in with Google')
      const { data, error } = await auth.signInWithGoogle()
      
      if (error) {
        console.error('Google sign in error:', error)
        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      
      console.log('Google sign in initiated:', data)
      return { success: true, data }
    } catch (err) {
      console.error('Google sign in error:', err)
      const sanitizedError = sanitizeErrorMessage(err.message)
      setError(sanitizedError)
      return { success: false, error: sanitizedError }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await authProxy.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      
      // Update AuthContext state after successful signout
      setUser(null)
      setError(null)
      console.log('User signed out and AuthContext state cleared')
      
      return { success: true }
    } catch (err) {
      console.error('Sign out error:', err)
      const sanitizedError = sanitizeErrorMessage(err.message)
      setError(sanitizedError)
      return { success: false, error: sanitizedError }
    } finally {
      setLoading(false)
    }
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  const value = {
    // State
    user,
    loading,
    error,
    
    // Actions
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    clearError,
    loadUserFromProxy,
    
    // Computed values
    isAuthenticated: !!user,
    userId: user?.id,
    userEmail: user?.email
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 