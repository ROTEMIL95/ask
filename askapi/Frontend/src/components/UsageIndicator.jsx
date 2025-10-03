import React from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Zap, Crown, AlertTriangle } from 'lucide-react'

export const UsageIndicator = ({ className = '' }) => {
  const { profile, loading, getUsageStats, canMakeApiCall, isAuthenticated } = useUserProfile()

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Zap className="h-4 w-4 animate-pulse" />
        <span>Loading usage...</span>
      </div>
    )
  }

  const usageStats = getUsageStats()
  if (!usageStats) {
    return null
  }

  const { planType, dailyLimit, apiCallsToday, remainingCalls } = usageStats
  const usagePercentage = (apiCallsToday / dailyLimit) * 100
  const isLimitReached = remainingCalls === 0

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Plan and Usage Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          <span className="text-sm font-medium">API Usage</span>
        </div>
        <Badge variant={planType === 'free' ? 'secondary' : 'default'}>
          {planType.toUpperCase()}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span>Today's calls</span>
          <span className="font-medium">
            {apiCallsToday} / {dailyLimit}
          </span>
        </div>
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Remaining</span>
          <span className={isLimitReached ? 'text-red-500 font-medium' : ''}>
            {remainingCalls} calls
          </span>
        </div>
      </div>

      {/* Limit Reached Warning */}
      {isLimitReached && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Daily limit reached. Upgrade your plan for more calls.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Status */}
      {!isLimitReached && usagePercentage > 80 && (
        <Alert className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You're approaching your daily limit ({remainingCalls} calls remaining).
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Compact version for headers/navbars
export const CompactUsageIndicator = ({ className = '' }) => {
  const { profile, loading, getUsageStats, canMakeApiCall, isAuthenticated } = useUserProfile()

  if (!isAuthenticated || loading) {
    return null
  }

  const usageStats = getUsageStats()
  if (!usageStats) {
    return null
  }

  const { apiCallsToday, dailyLimit, remainingCalls } = usageStats
  const isLimitReached = remainingCalls === 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Zap className="h-4 w-4" />
      <span className="text-sm">
        {apiCallsToday}/{dailyLimit}
      </span>
      {isLimitReached && (
        <AlertTriangle className="h-4 w-4 text-red-500" />
      )}
    </div>
  )
} 