import { useState, useEffect, useRef, useCallback } from 'react';
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
    const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
    const [hasShownFeedbackToday, setHasShownFeedbackToday] = useState(false);

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
            // Check if we should show feedback popup instead of upgrade modal
            if (usage.plan === 'free' && user && user.id) {
                // Get user profile to check last feedback date
                const { data: profile, error: profileError } = await userProfile.getProfile(user.id);
                
                if (!profileError && profile) {
                    const lastFeedbackDate = profile.last_feedback;
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Show feedback popup if no feedback today
                    if (!lastFeedbackDate || lastFeedbackDate.split('T')[0] !== today) {
                        setShowFeedbackPopup(true);
                        return false; // Block the API call
                    }
                }
            } else if (usage.plan === 'free' && (!user || !user.id)) {
                // Show sign-in message for anonymous users
                const signInMessage = `You've reached your daily limit of ${usage.limit} API calls!\n\n🔐 Sign in or create a free account to:\n• Get 5 bonus API calls\n• Track your usage\n• Save your API history\n• Access premium features\n\nCreate an account now to continue using Talkapi!`;
                alert(signInMessage);
                setShowUpgradeModal(true);
                return false; // Block the API call
            }
            
            // Show upgrade modal for other cases
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

    const handleFeedbackSubmitted = useCallback(() => {
        // Reload usage to reflect the bonus calls
        loadUsage();
        setShowFeedbackPopup(false);
    }, [loadUsage]);

    return {
        usage,
        trackApiCall,
        showUpgradeModal,
        setShowUpgradeModal,
        showFeedbackPopup,
        setShowFeedbackPopup,
        handleFeedbackSubmitted,
        loadUsage
    };
} 