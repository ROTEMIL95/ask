import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUserProfile } from '../hooks/useUserProfile'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

export const AuthDebug = () => {
  const { user, loading, error, isAuthenticated } = useAuth()
  const { profile, hasProfile } = useUserProfile()

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Auth Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Loading:</strong>
            <Badge variant={loading ? "destructive" : "default"} className="ml-2">
              {loading ? "Loading" : "Ready"}
            </Badge>
          </div>
          <div>
            <strong>Authenticated:</strong>
            <Badge variant={isAuthenticated ? "default" : "secondary"} className="ml-2">
              {isAuthenticated ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>Has Profile:</strong>
            <Badge variant={hasProfile ? "default" : "secondary"} className="ml-2">
              {hasProfile ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <strong>User ID:</strong>
            <span className="ml-2 font-mono text-xs">
              {user?.id || "None"}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {user && (
          <div className="space-y-2">
            <h4 className="font-semibold">User Info:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
              <div><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at).toLocaleString()}</div>
            </div>
          </div>
        )}

        {profile && (
          <div className="space-y-2">
            <h4 className="font-semibold">Profile Info:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Username:</strong> {profile.username || "Not set"}</div>
              <div><strong>Full Name:</strong> {profile.full_name || "Not set"}</div>
              <div><strong>Plan:</strong> {profile.plan_type}</div>
              <div><strong>Daily Limit:</strong> {profile.daily_limit}</div>
              <div><strong>Calls Today:</strong> {profile.api_calls_today}</div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <strong>Environment:</strong>
          <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? "Set" : "Not set"}</div>
          <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Not set"}</div>
        </div>
      </CardContent>
    </Card>
  )
} 