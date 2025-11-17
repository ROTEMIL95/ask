
import React, { useState, useEffect } from 'react';
import { cancelSubscription } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Added Tabs components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    User as UserIcon, 
    Crown, 
    TrendingUp, 
    CreditCard,
    History as HistoryIcon,
    Loader2,
    Star // Added Star icon import
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UsageDisplay } from '@/components/UsageTracker';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { auth, userProfile } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';

const PLAN_FEATURES = {
    free: {
        name: 'Free',
        price: '$0/month',
        color: 'bg-gray-600',
        features: ['10 API calls/day', '25 API calls/month', '1 week history', 'Basic email support']
    },
    starter: {
        name: 'Starter',
        price: '$9/month',
        color: 'bg-blue-600',
        features: ['25 API calls/day', '200 API calls/month', 'Full history', 'Email + Private API support']
    },
    pro: {
        name: 'Pro',
        price: '$19/month',
        color: 'bg-purple-600',
        features: ['100 API calls/day', '3000 API calls/month', 'Full history', 'Priority support', 'Team sharing']
    },
    enterprise: {
        name: 'Enterprise',
        price: 'Custom',
        color: 'bg-gradient-to-r from-yellow-600 to-orange-600',
        features: ['Unlimited API calls', 'Full history', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
    }
};

export default function AccountPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [recentHistory, setRecentHistory] = useState([]);
    const [favorites, setFavorites] = useState([]); // Added favorites state
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const { usage, loadUsage } = useUsageTracking();
    const { profile, planType, fullName, loading: profileLoading, refreshProfile } = useUserProfile();

    useEffect(() => {
        console.log('[Account] useEffect triggered - starting loadAccountData');
        const loadAccountData = async () => {
            try {
                console.log('[Account] Step 1: Getting current user...');
                const { user: currentUser, error } = await auth.getCurrentUser();
                if (error) {
                    console.error('[Account] Error getting current user:', error);
                    // Redirect to login if not authenticated
                    window.location.href = createPageUrl('Login');
                    return;
                }

                console.log('[Account] Step 2: User found:', currentUser?.email);
                setUser(currentUser);

                console.log('[Account] Step 3: Loading usage...');
                await loadUsage();
                console.log('[Account] Step 3: Usage loaded successfully');

                // Load recent API call history and favorites with error handling
                console.log('[Account] Step 4: Loading history...');
                setHistoryLoading(true);
                try {
                    // For now, we'll skip history loading since we need to implement it with Supabase
                    // TODO: Implement history loading with Supabase
                    setRecentHistory([]);
                    setFavorites([]);
                    console.log('[Account] Step 4: History set to empty (not implemented)');
                } catch (historyError) {
                    console.error('[Account] Failed to load history:', historyError);
                    // Don't block the page if history fails to load
                    setRecentHistory([]);
                    setFavorites([]); // Ensure favorites are also reset on error
                } finally {
                    setHistoryLoading(false);
                    console.log('[Account] Step 4: History loading completed');
                }
            } catch (e) {
                console.error('[Account] Error loading account data:', e);
                // Redirect to login if not authenticated
                window.location.href = createPageUrl('Login');
            } finally {
                console.log('[Account] Step 5: Setting loading to FALSE');
                setLoading(false);
            }
        };
        loadAccountData();
    }, []); // Run only once on mount - avoid infinite loop from function dependency

    // Only check local loading state - profileLoading can cause infinite loop
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your account...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
                <Alert className="max-w-md bg-red-900/20 border-red-500">
                    <AlertDescription className="text-red-300">
                        Please sign in to view your account.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const currentPlan = PLAN_FEATURES[planType] || PLAN_FEATURES['free']; // Use actual plan type from profile
    const joinedDate = format(new Date(user.created_at), 'MMMM dd, yyyy');

    // Handle subscription cancellation
    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
            return;
        }

        setCancelLoading(true);
        try {
            const result = await cancelSubscription();
            
            if (result.status === 'success') {
                alert('Your subscription has been cancelled successfully. You have been reverted to the free plan.');
                // Refresh the user profile data 
                await refreshProfile(); // Trigger profile refresh
                await loadUsage(); // Also refresh usage data
                // Redirect to home page
                navigate('/home');
            } else {
                alert(result.message || 'Failed to cancel subscription. Please try again or contact support.');
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert(error.message || 'Failed to cancel subscription. Please contact support.');
        } finally {
            setCancelLoading(false);
        }
    };

    // Helper function to render history table
    const renderHistoryTable = (items) => (
        items.length > 0 ? (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10">
                            <TableHead className="text-gray-300">Query</TableHead>
                            <TableHead className="text-gray-300">Endpoint</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-gray-300">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id} className="border-white/10">
                                <TableCell className="text-white max-w-xs truncate">
                                    {item.userQuery || 'N/A'}
                                </TableCell>
                                <TableCell className="text-gray-300 font-mono text-sm">
                                    {item.endpoint || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge className={item.status === 'Success' ? 'bg-green-600' : 'bg-red-600'}>
                                        {item.status || 'Unknown'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-300">
                                    {format(new Date(item.created_date), 'MMM dd, HH:mm')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
            <div className="text-center py-8">
                <HistoryIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No entries yet</p>
                <p className="text-gray-500 text-sm">Start using Talkapi to see your history here.</p>
            </div>
        )
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <UserIcon className="w-8 h-8 text-blue-400" />
                    <h1 className="text-4xl font-bold text-white">My Account</h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Profile & Plan Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    Profile Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Name</p>
                                    <p className="text-white font-medium">{fullName || user.user_metadata?.full_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Email</p>
                                    <p className="text-white font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Member Since</p>
                                    <p className="text-white font-medium">{joinedDate}</p>
                                </div>
                                {user.user_metadata?.role === 'admin' && (
                                    <Badge className="bg-yellow-600 text-yellow-100">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Administrator
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Current Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge className={currentPlan.color}>
                                        {currentPlan.name}
                                    </Badge>
                                    <span className="text-white font-bold">{currentPlan.price}</span>
                                </div>
                                
                                <ul className="space-y-2">
                                    {currentPlan.features.map((feature, index) => (
                                        <li key={index} className="text-gray-300 text-sm flex items-center">
                                            <div className="w-1 h-1 bg-blue-400 rounded-full mr-2"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {planType === 'enterprise' ? (
                                    // Enterprise users only see their status
                                    <div className="space-y-3">
                                        {profile?.subscription_status === 'active' && (
                                            <div className="p-3 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg border border-yellow-500/20">
                                                <p className="text-xs text-yellow-400 font-medium">Enterprise Account</p>
                                                {profile?.subscription_start_date && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Active since: {format(new Date(profile.subscription_start_date), 'MMM dd, yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <Button 
                                            onClick={handleCancelSubscription}
                                            variant="outline"
                                            className="w-full border-red-500/50 text-red-400 hover:bg-red-900/20"
                                            disabled={cancelLoading}
                                        >
                                            {cancelLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Cancel Enterprise Plan'
                                            )}
                                        </Button>
                                    </div>
                                ) : planType === 'pro' ? (
                                    // Pro users see both upgrade and cancel options
                                    <div className="space-y-3">
                                        {profile?.subscription_status === 'active' && (
                                            <div className="p-2 bg-purple-900/20 rounded-lg border border-purple-500/20">
                                                <p className="text-xs text-purple-400 font-medium">Pro Account Active</p>
                                                {profile?.subscription_start_date && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Since: {format(new Date(profile.subscription_start_date), 'MMM dd, yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Upgrade to Enterprise */}
                                        <div className="p-3 bg-gradient-to-r from-yellow-900/10 to-orange-900/10 rounded-lg border border-yellow-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Crown className="w-4 h-4 text-yellow-400" />
                                                <span className="text-sm font-medium text-yellow-400">Upgrade Available</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">
                                                Get unlimited API calls and dedicated support with Enterprise
                                            </p>
                                            <Button 
                                                asChild 
                                                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                                            >
                                                <Link to={createPageUrl("Contact")}>
                                                    Upgrade to Enterprise
                                                </Link>
                                            </Button>
                                        </div>
                                        
                                        {/* Cancel Subscription */}
                                        <Button 
                                            onClick={handleCancelSubscription}
                                            variant="outline"
                                            className="w-full border-gray-600 text-gray-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/50"
                                            disabled={cancelLoading}
                                        >
                                            {cancelLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Cancelling...
                                                </>
                                            ) : (
                                                'Cancel Pro Subscription'
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    // Free users see upgrade button
                                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                                        <Link to={createPageUrl("Pricing")}>
                                            Upgrade Plan
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Usage & Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    API Usage Today
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <UsageDisplay usage={usage} showLabel={true} />
                                
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{usage.count}</p>
                                        <p className="text-gray-400 text-sm">Calls Today</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-white">
                                            {usage.limit === Infinity ? '∞' : usage.limit - usage.count}
                                        </p>
                                        <p className="text-gray-400 text-sm">Remaining</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{historyLoading ? '-' : recentHistory.length}</p>
                                        <p className="text-gray-400 text-sm">Recent Calls</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <HistoryIcon className="w-5 h-5" />
                                    Activity {/* Changed title from "Recent API Calls" to "Activity" */}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="recent"> {/* Added Tabs component */}
                                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                                        <TabsTrigger value="recent">Recent Calls</TabsTrigger>
                                        <TabsTrigger value="favorites" className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400" /> Favorites
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="recent" className="mt-4">
                                        {historyLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                            </div>
                                        ) : renderHistoryTable(recentHistory)} {/* Use renderHistoryTable */}
                                    </TabsContent>
                                    <TabsContent value="favorites" className="mt-4">
                                        {historyLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                            </div>
                                        ) : renderHistoryTable(favorites)} {/* Use renderHistoryTable for favorites */}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
