import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUserProfile } from '../hooks/useUserProfile'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { hasProfile, loading: profileLoading } = useUserProfile()
  const location = useLocation()

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // If profile is required, check if user has a profile
  if (requireProfile && !profileLoading) {
    if (!hasProfile) {
      // User is authenticated but doesn't have a profile yet
      // This might happen during signup process
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Setting up your profile...</p>
          </div>
        </div>
      )
    }
  }

  // Show loading while checking profile
  if (requireProfile && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  return children
}

// Higher-order component for protecting routes
export const withAuth = (Component, requireProfile = false) => {
  return (props) => (
    <ProtectedRoute requireProfile={requireProfile}>
      <Component {...props} />
    </ProtectedRoute>
  )
} 