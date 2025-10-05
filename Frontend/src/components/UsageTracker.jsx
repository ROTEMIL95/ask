
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { auth, userProfile, supabase } from '@/lib/supabase';

const PLAN_LIMITS = {
    free: 50,
    starter: 100,
    pro: 100
};

const MONTHLY_LIMITS = {
    free: 1000,
    starter: 2000,
    pro: 2000
};

export function useUsageTracking() {
    const [usage, setUsage] = useState({ 
        count: 0, 
        limit: 50, 
        plan: 'free',
        monthlyCount: 0,
        monthlyLimit: 1000
    });
    const [user, setUser] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Refs for debouncing API call persistence
    const debounceTimerRef = useRef(null);
    const apiCallsToPersistRef = useRef(0); // Stores the latest count that needs to be persisted to the backend
    const lastPersistedCountRef = useRef(0); // Stores the last count successfully persisted to the backend

    const persistApiCallsToBackend = useCallback(async (countToPersist, dateToPersist) => {
        try {
            // First check if there's an active session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.log('No active session found, skipping backend persistence');
                return;
            }
            
            // Only update if there's a logged-in user context
            if (user) {
                const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
                
                // First check if profile exists, create if it doesn't
                const { data: profile, error: getError } = await userProfile.getProfile(user.id);
                
                if (!profile && !getError) {
                    // Profile doesn't exist, create it first
                    const { error: createError } = await userProfile.createProfile(
                        user.id,
                        user.email,
                        user.user_metadata?.username,
                        user.user_metadata?.full_name
                    );
                    
                    if (createError) {
                        console.error('Failed to create user profile for usage tracking:', createError);
                        return;
                    }
                }
                
                // Now update the profile with usage data
                const { error } = await userProfile.updateProfile(user.id, {
                    api_calls_today: countToPersist,
                    last_api_call_date: dateToPersist,
                    api_calls_monthly: usage.monthlyCount + 1, // Increment monthly count
                    last_api_call_month: currentMonth
                });
                if (error) {
                    console.error('Failed to persist API usage:', error);
                } else {
                    lastPersistedCountRef.current = countToPersist; // Update the last successfully persisted count
                }
            }
        } catch (e) {
            console.error('Failed to persist API usage:', e);
            // In a real application, you might want to implement retry logic or more robust error handling
        }
    }, [user, usage.monthlyCount]); // Depend on 'user' and monthlyCount to ensure it uses the latest data

    const loadUsage = useCallback(async () => {
        try {
            // First check if there's an active session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Error getting session:', sessionError);
                // Fall back to anonymous usage
                const today = new Date().toISOString().split('T')[0];
                const anonUsage = JSON.parse(sessionStorage.getItem('anonUsage') || '{}');
                
                let count = anonUsage.count || 0;
                if (anonUsage.date !== today) {
                    count = 0;
                }
                
                setUsage({ count, limit: 50, plan: 'free', monthlyCount: 0, monthlyLimit: 1000 });
                sessionStorage.setItem('anonUsage', JSON.stringify({ count, date: today }));
                return;
            }
            
            // If no active session, use anonymous usage
            if (!session) {
                console.log('No active session found, using anonymous usage');
                const today = new Date().toISOString().split('T')[0];
                const anonUsage = JSON.parse(sessionStorage.getItem('anonUsage') || '{}');
                
                let count = anonUsage.count || 0;
                if (anonUsage.date !== today) {
                    count = 0;
                }
                
                setUsage({ count, limit: 50, plan: 'free', monthlyCount: 0, monthlyLimit: 1000 });
                sessionStorage.setItem('anonUsage', JSON.stringify({ count, date: today }));
                return;
            }
            
            // Now get the current user
            const { user: currentUser, error } = await auth.getCurrentUser();
            if (error) {
                console.error('Error getting current user:', error);
                // Fall back to anonymous usage
                const today = new Date().toISOString().split('T')[0];
                const anonUsage = JSON.parse(sessionStorage.getItem('anonUsage') || '{}');
                
                let count = anonUsage.count || 0;
                if (anonUsage.date !== today) {
                    count = 0;
                }
                
                setUsage({ count, limit: 50, plan: 'free', monthlyCount: 0, monthlyLimit: 1000 });
                sessionStorage.setItem('anonUsage', JSON.stringify({ count, date: today }));
                return;
            }
            
            setUser(currentUser);
            
            // Get user profile for plan and usage data
            const { data: profile, error: profileError } = await userProfile.getProfile(currentUser.id);
            
            let userProfileData = profile;
            
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
            } else if (profileError) {
                console.error('Error getting user profile:', profileError);
                // Continue with default values
                userProfileData = null;
            }
            
            const today = new Date().toISOString().split('T')[0];
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            const userPlan = userProfileData?.plan_type || 'free';
            const dailyLimit = PLAN_LIMITS[userPlan];
            const monthlyLimit = MONTHLY_LIMITS[userPlan];
            
            let dailyCallCount = userProfileData?.api_calls_today || 0;
            let monthlyCallCount = userProfileData?.api_calls_monthly || 0;
            
            // Reset daily counter if it's a new day
            if (userProfileData?.last_api_call_date !== today) {
                dailyCallCount = 0;
                // Immediately persist the reset count to backend
                const { error: updateError } = await userProfile.updateProfile(currentUser.id, {
                    api_calls_today: 0,
                    last_api_call_date: today
                });
                if (updateError) {
                    console.error('Failed to reset daily usage count:', updateError);
                }
            }
            
            // Reset monthly counter if it's a new month
            if (userProfileData?.last_api_call_month !== currentMonth) {
                monthlyCallCount = 0;
                // Immediately persist the reset monthly count to backend
                const { error: updateError } = await userProfile.updateProfile(currentUser.id, {
                    api_calls_monthly: 0,
                    last_api_call_month: currentMonth
                });
                if (updateError) {
                    console.error('Failed to reset monthly usage count:', updateError);
                }
            }
            
            setUsage({ 
                count: dailyCallCount, 
                limit: dailyLimit, 
                plan: userPlan,
                monthlyCount: monthlyCallCount,
                monthlyLimit: monthlyLimit
            });
            lastPersistedCountRef.current = dailyCallCount; // Initialize last persisted count from the backend data
            apiCallsToPersistRef.current = dailyCallCount; // Initialize count to be persisted
        } catch (e) {
            console.error('Error loading usage:', e);
            // For anonymous users, use session storage
            const today = new Date().toISOString().split('T')[0];
            const anonUsage = JSON.parse(sessionStorage.getItem('anonUsage') || '{}');
            
            let count = anonUsage.count || 0;
            if (anonUsage.date !== today) {
                count = 0;
            }
            
            setUsage({ count, limit: 10, plan: 'free' });
            sessionStorage.setItem('anonUsage', JSON.stringify({ count, date: today }));
            // Anonymous usage does not involve backend persistence, so no ref updates for them
        }
    }, []);

    useEffect(() => {
        loadUsage();
        // Cleanup: Clear any pending debounce timeout when the component unmounts
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [loadUsage]);


    const trackApiCall = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if user has reached daily limit
        if (usage.count >= usage.limit) {
            setShowUpgradeModal(true);
            return false; // Block the API call
        }
        
        // Check if user has reached monthly limit
        if (usage.monthlyCount >= usage.monthlyLimit) {
            setShowUpgradeModal(true);
            return false; // Block the API call
        }

        const newDailyCount = usage.count + 1;
        const newMonthlyCount = usage.monthlyCount + 1;
        
        // Always update local state immediately for UI responsiveness and accurate limit checks
        setUsage(prev => ({ 
            ...prev, 
            count: newDailyCount,
            monthlyCount: newMonthlyCount
        }));
        
        // Handle backend persistence for logged-in users with debouncing
        if (user) {
            apiCallsToPersistRef.current = newDailyCount; // Update the latest count that needs to be persisted
            
            // Clear any existing timer to reset the debounce period
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            
            // Set a new timer to call the persistence function after a delay
            debounceTimerRef.current = setTimeout(() => {
                // Only persist if the current count (apiCallsToPersistRef.current) is greater than
                // the last successfully persisted count, meaning there are new calls to save.
                // This prevents redundant writes if no further calls were made during the debounce period.
                if (apiCallsToPersistRef.current > lastPersistedCountRef.current) {
                    persistApiCallsToBackend(apiCallsToPersistRef.current, today);
                }
            }, 1000); // Debounce for 1 second (1000 milliseconds)
        } else {
            // For anonymous users, continue to store usage immediately in session storage
            try {
                sessionStorage.setItem('anonUsage', JSON.stringify({ 
                    count: newDailyCount, 
                    date: today 
                }));
            } catch (e) {
                console.error('Failed to store anonymous API usage:', e);
            }
        }
        
        // Show warning at 80% usage (based on the immediate local count)
        if (newDailyCount >= usage.limit * 0.8 && newDailyCount < usage.limit) {
            alert(`Warning: You've used ${newDailyCount} of ${usage.limit} daily API calls. Consider upgrading your plan.`);
        }
        
        if (newMonthlyCount >= usage.monthlyLimit * 0.8 && newMonthlyCount < usage.monthlyLimit) {
            alert(`Warning: You've used ${newMonthlyCount} of ${usage.monthlyLimit} monthly API calls. Consider upgrading your plan.`);
        }
        
        return true; // Allow the API call
    }, [usage, user, persistApiCallsToBackend]);

    return {
        usage,
        trackApiCall,
        showUpgradeModal,
        setShowUpgradeModal,
        loadUsage
    };
}

export function UsageDisplay({ usage, showLabel = true, onFeedbackClick, user }) {
    const dailyPercentage = usage.limit === Infinity ? 0 : (usage.count / usage.limit) * 100;
    const monthlyPercentage = usage.monthlyLimit === Infinity ? 0 : (usage.monthlyCount / usage.monthlyLimit) * 100;
    const isNearDailyLimit = dailyPercentage >= 80;
    const isNearMonthlyLimit = monthlyPercentage >= 80;
    const isOverDailyLimit = usage.count >= usage.limit;
    const navigate = useNavigate();
    
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
