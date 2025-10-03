import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
            {/* Header */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-white hover:text-blue-300 hover:bg-white/5 transition-all duration-200 rounded-md"
                            >
                                <Link to="/">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Home
                                </Link>
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">TalkAPI.ai</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                        Refund Policy
                    </h1>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-lg mb-8 text-gray-300 leading-relaxed">
                            TalkAPI.ai is a digital service platform that provides API documentation tools and automated AI generation services. Due to the nature of digital goods and services, please review our refund and cancellation terms below:
                        </p>

                        <div className="space-y-8">
                            {/* Refund Policy Section */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🧾</span>
                                    Refund Policy
                                </h2>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>All payments are final and non-refundable once the service is delivered or access to the platform has been granted.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>In special cases of technical failure directly caused by our system (not by external APIs), users may contact support for a refund request within 7 days of the transaction.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>Refunds, if approved, will be processed within 7 business days to the original payment method.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Subscription Cancellation Section */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🔁</span>
                                    Subscription Cancellation
                                </h2>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>Users on monthly or annual plans may cancel at any time through their user dashboard.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>Cancellation will stop future billing, but no partial refunds will be issued for unused time.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-blue-400 mt-1">•</span>
                                        <span>Once cancelled, access to premium features will remain active until the end of the billing cycle.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Disputes Section */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">❗</span>
                                    Disputes
                                </h2>
                                <p className="text-gray-300 mb-4">
                                    If you believe your payment was made in error or unauthorized, please contact us at:
                                </p>
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Mail className="w-5 h-5" />
                                    <a href="mailto:office@1000-2000.com" className="hover:text-blue-300 transition-colors">
                                    office@1000-2000.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mt-12 p-6 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">Need Help?</h3>
                            <p className="text-gray-300 mb-4">
                                If you have any questions about our refund policy or need assistance with your account, our support team is here to help.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    asChild
                                    className="border-blue-400 text-white bg-blue-800 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                                >
                                    <a href="mailto:office@1000-2000.com">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Contact Support
                                    </a>
                                </Button>
                          
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 