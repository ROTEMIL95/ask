
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
    Users, 
    BarChart3, 
    Activity, 
    Settings, 
    Download, 
    Mail, 
    Trash2, 
    Crown, 
    Ban, 
    TrendingUp,
    Shield,
    AlertTriangle,
    Eye,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const PLAN_LIMITS = {
    free: 50,
    starter: 200,
    pro: Infinity
};

export default function AdminDashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [histories, setHistories] = useState([]);
    const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [reloading, setReloading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const initAdmin = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
                
                if (!user.role || user.role !== 'admin') {
                    window.location.href = createPageUrl('Home');
                    return;
                }
                
                await loadData();
            } catch (e) {
                setError('Access denied. Admin privileges required.');
                setTimeout(() => window.location.href = createPageUrl('Home'), 2000);
            } finally {
                setLoading(false);
            }
        };
        initAdmin();
    }, []);

    const loadData = async () => {
        setReloading(true);
        setError('');
        try {
            const [allUsers, allHistories] = await Promise.all([
                User.list('-created_date', 50), // Optimized: reduced limit from 100 to 50
                History.list('-created_date', 25) // Optimized: reduced limit from 50 to 25
            ]);
            setUsers(allUsers);
            setHistories(allHistories);
        } catch (e) {
            setError('Failed to load admin data. Please try again.');
        } finally {
            setReloading(false);
        }
    };

    const handleUserAction = async (userId, action, value = null) => {
        try {
            switch (action) {
                case 'disable':
                    await User.update(userId, { status: 'disabled' });
                    alert('User account disabled');
                    break;
                case 'upgrade':
                    await User.update(userId, { plan: value });
                    alert(`User upgraded to ${value} plan`);
                    break;
                case 'makeAdmin':
                    await User.update(userId, { role: value ? 'admin' : 'user' });
                    alert(`User admin status ${value ? 'granted' : 'revoked'}`);
                    break;
                case 'resetUsage':
                    await User.update(userId, { apiCallsToday: 0, lastApiCallDate: new Date().toISOString().split('T')[0] });
                    alert('User daily usage reset');
                    break;
                case 'delete':
                    if (confirm('Are you sure you want to permanently delete this user?')) {
                        await User.delete(userId);
                        alert('User deleted permanently');
                    }
                    break;
            }
            await loadData();
        } catch (e) {
            alert('Action failed: ' + e.message);
        }
    };

    const exportUsageReport = () => {
        const csvData = users.map(user => ({
            Email: user.email,
            'Full Name': user.full_name,
            Plan: user.plan || 'free',
            'Calls Today': user.apiCallsToday || 0,
            'Plan Limit': PLAN_LIMITS[user.plan || 'free'] === Infinity ? 'Unlimited' : PLAN_LIMITS[user.plan || 'free'],
            'Last API Call': user.lastApiCallDate || 'Never',
            'Joined Date': format(new Date(user.created_date), 'yyyy-MM-dd'),
            Status: user.status || 'active',
            'Is Admin': user.role === 'admin' ? 'Yes' : 'No'
        }));
        
        const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talkapi-usage-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !reloading) { // only show main error if not reloading
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert className="max-w-md bg-red-900/20 border-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const filteredUsers = selectedPlanFilter === 'all' 
        ? users 
        : users.filter(user => (user.plan || 'free') === selectedPlanFilter);

    const planStats = users.reduce((acc, user) => {
        const plan = user.plan || 'free';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {});

    const planChartData = Object.entries(planStats).map(([plan, count]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count
    }));

    // Mock daily usage data for the last 7 days
    const dailyUsageData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayHistories = histories.filter(h => {
            const historyDate = new Date(h.created_date).toDateString();
            return historyDate === date.toDateString();
        });
        return {
            date: format(date, 'MMM dd'),
            calls: dayHistories.length
        };
    });

    const totalCallsToday = users.reduce((sum, user) => sum + (user.apiCallsToday || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-400" />
                        <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
                    </div>
                    <Button onClick={loadData} disabled={reloading} variant="outline" className="text-white border-white/20 bg-black/20 hover:bg-white/10">
                        {reloading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        {reloading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>
                
                {error && reloading && (
                     <Alert className="mb-4 bg-red-900/20 border-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-300">{error}</AlertDescription>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-4 w-full max-w-md bg-black/20">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Logs
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        User Management ({filteredUsers.length})
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Select value={selectedPlanFilter} onValueChange={setSelectedPlanFilter}>
                                            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                                                <SelectValue placeholder="Filter by plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Plans</SelectItem>
                                                <SelectItem value="free">Free</SelectItem>
                                                <SelectItem value="starter">Starter</SelectItem>
                                                <SelectItem value="pro">Pro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-white/10">
                                                <TableHead className="text-gray-300">User Email</TableHead>
                                                <TableHead className="text-gray-300">Plan</TableHead>
                                                <TableHead className="text-gray-300">Calls Today</TableHead>
                                                <TableHead className="text-gray-300">Total Calls</TableHead>
                                                <TableHead className="text-gray-300">Joined</TableHead>
                                                <TableHead className="text-gray-300">Status</TableHead>
                                                <TableHead className="text-gray-300">Is Admin</TableHead>
                                                <TableHead className="text-gray-300">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((user) => {
                                                const userHistories = histories.filter(h => h.created_by === user.email);
                                                const planLimit = PLAN_LIMITS[user.plan || 'free'];
                                                const callsToday = user.apiCallsToday || 0;
                                                
                                                return (
                                                    <TableRow key={user.id} className="border-white/10">
                                                        <TableCell className="text-white">{user.email}</TableCell>
                                                        <TableCell>
                                                            <Badge className={`${
                                                                user.plan === 'pro' ? 'bg-purple-600' : 
                                                                user.plan === 'starter' ? 'bg-blue-600' : 'bg-gray-600'
                                                            }`}>
                                                                {(user.plan || 'free').toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-white">
                                                            {callsToday} / {planLimit === Infinity ? '∞' : planLimit}
                                                        </TableCell>
                                                        <TableCell className="text-white">{userHistories.length}</TableCell>
                                                        <TableCell className="text-gray-300">
                                                            {format(new Date(user.created_date), 'MMM dd, yyyy')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={user.status === 'disabled' ? 'bg-red-600' : 'bg-green-600'}>
                                                                {user.status || 'active'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <input
                                                                type="checkbox"
                                                                checked={user.role === 'admin'}
                                                                onChange={(e) => handleUserAction(user.id, 'makeAdmin', e.target.checked)}
                                                                className="w-4 h-4"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUserAction(user.id, 'resetUsage')}
                                                                    className="text-green-400 border-green-400"
                                                                    title="Reset Daily Usage"
                                                                >
                                                                    <RefreshCw className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUserAction(user.id, 'disable')}
                                                                    className="text-orange-400 border-orange-400"
                                                                    title="Disable Account"
                                                                >
                                                                    <Ban className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUserAction(user.id, 'delete')}
                                                                    className="text-red-400 border-red-400"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Daily API Usage (Last 7 Days)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dailyUsageData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9CA3AF" />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#1F2937', 
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Bar dataKey="calls" fill="#8B5CF6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="bg-black/20 border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Users by Plan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={planChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {planChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                            <Card className="bg-black/20 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400">Total Users</p>
                                            <p className="text-3xl font-bold text-white">{users.length}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-black/20 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400">API Calls Today</p>
                                            <p className="text-3xl font-bold text-white">{totalCallsToday}</p>
                                        </div>
                                        <BarChart3 className="w-8 h-8 text-green-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-black/20 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400">Pro Users</p>
                                            <p className="text-3xl font-bold text-white">{planStats.pro || 0}</p>
                                        </div>
                                        <Crown className="w-8 h-8 text-purple-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-black/20 border-white/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-400">Total API Calls</p>
                                            <p className="text-3xl font-bold text-white">{histories.length}</p>
                                        </div>
                                        <Activity className="w-8 h-8 text-yellow-400" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="space-y-6">
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Recent Activity Logs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {histories.slice(0, 10).map((history) => (
                                        <div key={history.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <p className="text-white font-medium">API Call: {history.endpoint || 'Unknown'}</p>
                                                <p className="text-gray-400 text-sm">by {history.created_by}</p>
                                                <p className="text-gray-500 text-xs">{history.userQuery || 'No query recorded'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-300 text-sm">
                                                    {format(new Date(history.created_date), 'MMM dd, HH:mm')}
                                                </p>
                                                <Badge className={history.status === 'Success' ? 'bg-green-600' : 'bg-red-600'}>
                                                    {history.status || 'Unknown'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Admin Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={exportUsageReport} className="w-full bg-blue-600 hover:bg-blue-700">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Usage Report (CSV)
                                </Button>
                                
                                <div className="pt-4 border-t border-white/10">
                                    <h3 className="text-white font-semibold mb-2">System Statistics</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">Total API Calls Today:</span>
                                            <span className="text-white ml-2">{totalCallsToday}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Active Admins:</span>
                                            <span className="text-white ml-2">{users.filter(u => u.role === 'admin').length}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Disabled Users:</span>
                                            <span className="text-white ml-2">{users.filter(u => u.status === 'disabled').length}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Premium Users:</span>
                                            <span className="text-white ml-2">{users.filter(u => u.plan && u.plan !== 'free').length}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
