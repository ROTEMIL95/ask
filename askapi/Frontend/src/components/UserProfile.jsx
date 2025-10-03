import React, { useState } from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, User, Mail, Calendar, Zap, Crown, Edit, Save, X } from 'lucide-react'
import { AuthDebug } from './AuthDebug'

export const UserProfile = () => {
  const {
    user,
    profile,
    loading,
    error,
    updateUsername,
    updateFullName,
    updateEmail,
    getUsageStats,
    canMakeApiCall,
    isAuthenticated,
    hasProfile
  } = useUserProfile()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    email: ''
  })

  // Initialize edit form when profile loads
  React.useEffect(() => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        email: profile.email || ''
      })
    }
  }, [profile])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditForm({
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      email: profile?.email || ''
    })
    setEditing(false)
  }

  const handleSave = async () => {
    const updates = {}
    let hasChanges = false

    // Check for changes
    if (editForm.username !== profile?.username) {
      updates.username = editForm.username
      hasChanges = true
    }
    if (editForm.full_name !== profile?.full_name) {
      updates.full_name = editForm.full_name
      hasChanges = true
    }
    if (editForm.email !== profile?.email) {
      updates.email = editForm.email
      hasChanges = true
    }

    if (hasChanges) {
      const success = await updateProfile(updates)
      if (success) {
        setEditing(false)
      }
    } else {
      setEditing(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Error loading profile: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Please log in to view your profile.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const usageStats = getUsageStats()

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove this after fixing auth issues */}
      <AuthDebug />
      
      {/* Profile Information */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                  <p className="text-sm">{profile?.username || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="text-sm">{profile?.full_name || 'Not set'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile?.email || user?.email || 'Not set'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>
            Your API usage and plan information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageStats && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Plan Type</span>
                </div>
                <Badge variant={usageStats.planType === 'free' ? 'secondary' : 'default'}>
                  {usageStats.planType.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>API Calls Today</span>
                  <span className="font-medium">
                    {usageStats.apiCallsToday} / {usageStats.dailyLimit}
                  </span>
                </div>
                <Progress 
                  value={(usageStats.apiCallsToday / usageStats.dailyLimit) * 100} 
                  className="h-2"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Remaining calls today</span>
                  <span className={usageStats.remainingCalls === 0 ? 'text-red-500 font-medium' : ''}>
                    {usageStats.remainingCalls}
                  </span>
                </div>
              </div>

              {usageStats.lastApiCallDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last API call: {new Date(usageStats.lastApiCallDate).toLocaleDateString()}</span>
                </div>
              )}

              {!canMakeApiCall() && (
                <Alert>
                  <AlertDescription>
                    You've reached your daily API call limit. Upgrade your plan for more calls.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Additional account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="text-sm font-mono">{user?.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Created</span>
            <span className="text-sm">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm">
              {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 