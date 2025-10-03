import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle, 
    AlertTriangle, 
    XCircle, 
    Clock,
    Zap,
    Database,
    Shield,
    Globe,
    TrendingUp,
    RefreshCw
} from 'lucide-react';

const StatusIndicator = ({ status, label, description, lastChecked }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'operational':
                return {
                    icon: CheckCircle,
                    color: 'text-green-400',
                    bgColor: 'bg-green-600',
                    textColor: 'text-green-100'
                };
            case 'degraded':
                return {
                    icon: AlertTriangle,
                    color: 'text-yellow-400',
                    bgColor: 'bg-yellow-600',
                    textColor: 'text-yellow-100'
                };
            case 'outage':
                return {
                    icon: XCircle,
                    color: 'text-red-400',
                    bgColor: 'bg-red-600',
                    textColor: 'text-red-100'
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-gray-400',
                    bgColor: 'bg-gray-600',
                    textColor: 'text-gray-100'
                };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                    <h3 className="text-white font-medium">{label}</h3>
                    <p className="text-gray-400 text-sm">{description}</p>
                </div>
            </div>
            <div className="text-right">
                <Badge className={`${config.bgColor} ${config.textColor} mb-1`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <p className="text-gray-500 text-xs">
                    Updated {lastChecked}
                </p>
            </div>
        </div>
    );
};

export default function StatusPage() {
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Mock system status data
    const [systemStatus] = useState({
        overall: 'operational',
        services: [
            {
                id: 'api-generation',
                label: 'API Code Generation',
                description: 'Core AI-powered code generation service',
                status: 'operational',
                uptime: 99.9
            },
            {
                id: 'authentication',
                label: 'User Authentication',
                description: 'Login and user management systems',
                status: 'operational',
                uptime: 99.8
            },
            {
                id: 'database',
                label: 'Database Systems',
                description: 'User data and API call history storage',
                status: 'operational',
                uptime: 99.9
            },
            {
                id: 'api-execution',
                label: 'API Call Execution',
                description: 'Real API testing and execution (Pro feature)',
                status: 'operational',
                uptime: 99.7
            },
            {
                id: 'billing',
                label: 'Billing & Payments',
                description: 'Subscription and payment processing',
                status: 'operational',
                uptime: 99.9
            },
            {
                id: 'cdn',
                label: 'Content Delivery',
                description: 'Global content delivery and static assets',
                status: 'operational',
                uptime: 99.9
            }
        ],
        incidents: [
            {
                id: 1,
                title: 'Scheduled Maintenance - Database Optimization',
                description: 'We performed routine database maintenance to improve performance.',
                status: 'resolved',
                createdAt: '2025-01-01T02:00:00Z',
                resolvedAt: '2025-01-01T03:30:00Z',
                severity: 'low'
            }
        ]
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            setLastUpdate(new Date());
            setIsRefreshing(false);
        }, 1000);
    };

    const formatUptime = (percentage) => {
        if (percentage >= 99.9) return 'Excellent';
        if (percentage >= 99.5) return 'Good';
        if (percentage >= 99.0) return 'Fair';
        return 'Poor';
    };

    const getOverallStatusConfig = () => {
        switch (systemStatus.overall) {
            case 'operational':
                return {
                    text: 'All Systems Operational',
                    color: 'text-green-400',
                    bgColor: 'bg-green-600/20',
                    borderColor: 'border-green-500/30'
                };
            case 'degraded':
                return {
                    text: 'Some Systems Degraded',
                    color: 'text-yellow-400',
                    bgColor: 'bg-yellow-600/20',
                    borderColor: 'border-yellow-500/30'
                };
            case 'outage':
                return {
                    text: 'System Outage',
                    color: 'text-red-400',
                    bgColor: 'bg-red-600/20',
                    borderColor: 'border-red-500/30'
                };
            default:
                return {
                    text: 'Status Unknown',
                    color: 'text-gray-400',
                    bgColor: 'bg-gray-600/20',
                    borderColor: 'border-gray-500/30'
                };
        }
    };

    const overallConfig = getOverallStatusConfig();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-16 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        System Status
                    </h1>
                    <p className="text-xl text-blue-200 max-w-3xl mx-auto text-center">
                        Current status of all Talkapi services and systems
                    </p>
                </div>

                {/* Overall Status */}
                <Card className={`mb-8 ${overallConfig.bgColor} border ${overallConfig.borderColor}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                                    <CheckCircle className={`w-8 h-8 ${overallConfig.color}`} />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${overallConfig.color}`}>
                                        {overallConfig.text}
                                    </h2>
                                    <p className="text-gray-300">
                                        Last updated: {lastUpdate.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                {isRefreshing ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Services Status */}
                <Card className="bg-black/20 border-white/10 mb-8">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-blue-400" />
                            Service Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {systemStatus.services.map((service) => (
                            <StatusIndicator
                                key={service.id}
                                status={service.status}
                                label={service.label}
                                description={service.description}
                                lastChecked="2 minutes ago"
                            />
                        ))}
                    </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-black/20 border-white/10">
                        <CardContent className="p-6 text-center">
                            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <h3 className="text-2xl font-bold text-white">99.9%</h3>
                            <p className="text-gray-400">Overall Uptime</p>
                            <p className="text-green-400 text-sm">Last 30 days</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-white/10">
                        <CardContent className="p-6 text-center">
                            <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <h3 className="text-2xl font-bold text-white">1.2s</h3>
                            <p className="text-gray-400">Avg Response Time</p>
                            <p className="text-blue-400 text-sm">API Generation</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-white/10">
                        <CardContent className="p-6 text-center">
                            <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <h3 className="text-2xl font-bold text-white">0</h3>
                            <p className="text-gray-400">Active Incidents</p>
                            <p className="text-green-400 text-sm">All systems healthy</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Incidents */}
                <Card className="bg-black/20 border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-yellow-400" />
                            Recent Incidents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {systemStatus.incidents.length > 0 ? (
                            <div className="space-y-4">
                                {systemStatus.incidents.map((incident) => (
                                    <div key={incident.id} className="bg-slate-800/30 rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-white font-medium">{incident.title}</h4>
                                                <p className="text-gray-400 text-sm mt-1">{incident.description}</p>
                                                <p className="text-gray-500 text-xs mt-2">
                                                    {new Date(incident.createdAt).toLocaleString()} - {new Date(incident.resolvedAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <Badge className="bg-green-600 text-green-100">
                                                Resolved
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <p className="text-gray-400">No recent incidents to report</p>
                                <p className="text-gray-500 text-sm">All systems have been running smoothly</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Subscribe to Updates */}
                <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-white/20 mt-8">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Stay Updated</h3>
                        <p className="text-gray-300 mb-4">
                            Get notified about service updates and planned maintenance
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Subscribe to Status Updates
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}