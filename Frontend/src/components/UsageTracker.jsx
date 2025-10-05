import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export function UsageDisplay({ usage, showLabel = true, onFeedbackClick, user }) {
    const dailyPercentage = usage.limit === Infinity ? 0 : (usage.count / usage.limit) * 100;
    const monthlyPercentage = usage.monthlyLimit === Infinity ? 0 : (usage.monthlyCount / usage.monthlyLimit) * 100;
    const isNearDailyLimit = dailyPercentage >= 80;
    const isNearMonthlyLimit = monthlyPercentage >= 80;
    const isOverDailyLimit = usage.count >= usage.limit;
    
    return (
        <div className="space-y-4">
            {showLabel && (
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                        <span className="text-gray-300 break-words">
                            Daily API Calls: {usage.count} / {usage.limit === Infinity ? '∞' : usage.limit}
                        </span>
                        <div className="flex items-center gap-2">
                            <Badge className={`${
                                usage.plan === 'pro' ? 'bg-purple-600' : 
                                usage.plan === 'starter' ? 'bg-blue-600' : 'bg-gray-600'
                            } shrink-0`}>
                                {usage.plan.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
            )}
            {/* Daily Progress */}
            {usage.limit !== Infinity && (
                <div className="space-y-1">
                    <div className="text-xs text-gray-400">Daily Usage</div>
                    <Progress 
                        value={dailyPercentage} 
                        className={`h-2 ${isNearDailyLimit ? 'bg-red-200' : 'bg-gray-200'}`}
                    />
                </div>
            )}
            {isNearDailyLimit && usage.limit !== Infinity && (
                <Alert className="bg-yellow-900/20 border-yellow-500/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <AlertDescription className="text-yellow-300 text-xs sm:text-sm flex items-center justify-between">
                        <span>You're approaching your daily limit. Consider upgrading for more calls.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onFeedbackClick}
                            className="text-xs border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black ml-2"
                        >
                            💝 Get 5 More Calls
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
            {isNearMonthlyLimit && usage.monthlyLimit !== Infinity && (
                <Alert className="bg-yellow-900/20 border-yellow-500/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <AlertDescription className="text-yellow-300 text-xs sm:text-sm">
                        You're approaching your monthly limit. Consider upgrading for more calls.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

export function UpgradeModal({ open, onClose }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white mx-4 max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                        Daily Limit Reached
                    </DialogTitle>
                    <DialogDescription className="text-gray-300 text-sm sm:text-base">
                        You've reached your daily API call limit. Upgrade your plan to continue using Talkapi today.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                            <h3 className="font-semibold text-blue-300 text-sm sm:text-base">Starter Plan</h3>
                            <p className="text-xs sm:text-sm text-gray-300">200 calls/day</p>
                            <p className="text-base sm:text-lg font-bold text-white">$9/month</p>
                        </div>
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 sm:p-4">
                            <h3 className="font-semibold text-purple-300 text-sm sm:text-base">Pro Plan</h3>
                            <p className="text-xs sm:text-sm text-gray-300">Unlimited calls</p>
                            <p className="text-base sm:text-lg font-bold text-white">$29/month</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
                            <Link to={createPageUrl("Pricing")}>
                                Upgrade Plan
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={onClose} className="border-gray-600 text-sm sm:text-base">
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}