import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth, supabase } from '../lib/supabase.jsx'
import authProxy from '../lib/authProxy.jsx'
import {sanitizeErrorMessage} from '../services/auth.service.jsx'

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

      const session = authProxy.getSession()
      const user = authProxy.getUser()
      
      if (session && user) {
        setUser(user)

        return true
      } else {
        setUser(null)

        return false
      }
    } catch (error) {

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

          const errorMsg = 'Authentication service not configured. Please contact support.'
          setError(errorMsg)
          setLoading(false)
          return
        }
        
        // Check for session using authProxy (which handles localStorage)
        const session = authProxy.getSession()
        
        if (!session) {

          setUser(null)
          setLoading(false)
          return
        }
        
        // Get user from session (already available from authProxy)
        const currentUser = authProxy.getUser()
        
        if (!currentUser) {

          setUser(null)
          setLoading(false)
          return
        }

        // Set the user from the authProxy session
        setUser(currentUser)

      } catch (err) {

        setError(sanitizeErrorMessage(err.message))
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Note: Auth state changes are now handled manually via authProxy
    // The old Supabase onAuthStateChange listener is disabled since we use backend proxy

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
      

      const { data, error } = await authProxy.signUp(email, password, name)
      
      if (error) {

        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      

      // Handle different signup scenarios
      if (data?.user) {
        if (!data.user.email_confirmed_at) {
          // User needs email confirmation (if enabled in Supabase)

          return { 
            success: true, 
            data,
            message: 'Account created successfully! Please check your email to confirm your account before signing in.'
          }
        } else {
          // User is already confirmed, automatically sign them in

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
      

      const { data, error } = await authProxy.signIn(email, password)

      if (error) {

        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      

      // Update the user state in AuthContext immediately
      if (data?.user) {
        setUser(data.user)

      }

      return { success: true, data }
    } catch (err) {

      const sanitizedError = sanitizeErrorMessage(err.message)
      setError(sanitizedError)
      return { success: false, error: sanitizedError }
    } finally {
      // Always set loading to false at the end
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
      

      const { data, error } = await auth.signInWithGoogle()
      
      if (error) {

        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }
      

      return { success: true, data }
    } catch (err) {

      const sanitizedError = sanitizeErrorMessage(err.message)
      setError(sanitizedError)
      return { success: false, error: sanitizedError }
    } finally {
      setLoading(false)
    }
  }

  // Reset password function
  const resetPassword = async (email) => {
    try {
      setLoading(true)
      setError(null)


      const { error } = await auth.resetPassword(email)

      if (error) {

        const sanitizedError = sanitizeErrorMessage(error.message)
        setError(sanitizedError)
        return { success: false, error: sanitizedError }
      }


      return { success: true, message: 'Password reset email sent! Please check your inbox.' }
    } catch (err) {

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


      // Add timeout to authProxy.signOut - don't wait forever
      const signOutPromise = authProxy.signOut()
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {

          resolve({ error: null })
        }, 3000) // 3 second timeout
      })

      const { error } = await Promise.race([signOutPromise, timeoutPromise])

      if (error) {

        // Don't fail the logout just because of an error
        // Clear the state anyway
      }

      // Update AuthContext state (clear user) - THIS IS THE MOST IMPORTANT PART
      setUser(null)
      setError(null)

      return { success: true }
    } catch (err) {

      // Even on error, clear the user state
      setUser(null)
      setError(null)

      return { success: true } // Return success anyway since state is cleared
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
    resetPassword,
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