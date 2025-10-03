import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock } from 'lucide-react';

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Legal Documents</h1>
                    <p className="text-xl text-blue-200">Our commitment to transparency and your privacy</p>
                </div>

                <div className="space-y-8">
                    <Card className="bg-black/20 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <FileText className="w-6 h-6 text-blue-400" />
                                Terms of Service
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p className="text-gray-300 mb-6">
                                Welcome to Talkapi. By accessing or using our service, you agree to be bound by these terms.
                            </p>
                            
                            <h3 className="text-lg font-semibold text-white">Acceptance of Terms</h3>
                            <p className="text-gray-300 mb-6">
                                By creating an account or using Talkapi, you acknowledge that you have read, understood,
                                and agree to be bound by these Terms of Service.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Service Description</h3>
                            <p className="text-gray-300 mb-6">
                                Talkapi is a platform that helps developers generate API calls from natural language queries.
                            </p>

                            <h3 className="text-lg font-semibold text-white">User Responsibilities</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li>You must provide accurate information when creating your account</li>
                                <li>You are responsible for maintaining the security of your account</li>
                                <li>You must not use the service for any illegal or unauthorized purposes</li>
                                <li>You must respect usage limits associated with your plan</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white">Modifications to Terms</h3>
                            <p>
                                We reserve the right to modify these terms at any time. We will notify users of significant 
                                changes via email or through our service notifications.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <Shield className="w-6 h-6 text-green-400" />
                                Privacy Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p>
                                We respect your privacy and are committed to protecting your personal data. 
                                This policy explains what information we collect and how we use it.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Information We Collect</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Account information (name, email, authentication data)</li>
                                <li>Usage data (API calls made, queries submitted)</li>
                                <li>Technical data (IP address, browser type, device information)</li>
                                <li>Payment information (processed securely by third-party providers)</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white">How We Use Your Information</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li>To provide and improve our services</li>
                                <li>To process payments and manage your account</li>
                                <li>To communicate with you about your account or service updates</li>
                                <li>To analyze usage patterns and improve our platform</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white">Data Sharing and Protection</h3>
                            <p>
                                We do not sell your personal data to third parties. We may share data with service providers 
                                who help us operate our platform, but only under strict confidentiality agreements.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Your Rights</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Access your personal data</li>
                                <li>Correct inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Object to processing of your data</li>
                                <li>Data portability</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <Lock className="w-6 h-6 text-purple-400" />
                                Security Notice
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p>
                                Security is paramount to us. We implement industry-standard security measures 
                                to protect your data and ensure the integrity of our service.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Security Measures</h3>
                            <ul className="list-disc list-inside space-y-2">
                                <li>All data transmissions are encrypted using TLS/SSL</li>
                                <li>API documentation is processed in memory and not permanently stored</li>
                                <li>Regular security audits and vulnerability assessments</li>
                                <li>Secure authentication using industry-standard protocols</li>
                                <li>Limited data retention policies</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white">Data Retention</h3>
                            <p>
                                We retain your data only as long as necessary to provide our services or as required by law. 
                                API call history may be retained based on your subscription plan.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Incident Response</h3>
                            <p>
                                In the unlikely event of a security incident, we will notify affected users within 72 hours 
                                and provide detailed information about the incident and our response measures.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Contact Us</h3>
                            <p>
                                If you have any questions about our security practices or need to report a security concern, 
                                please contact us immediately at security@talkapi.ai
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center mt-12 p-6 bg-black/20 rounded-xl border border-white/10">
                    <p className="text-gray-300">
                        Last updated: {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                    <p className="text-gray-400 mt-2">
                        For questions about these legal documents, contact us at legal@talkapi.ai
                    </p>
                </div>
            </div>
        </div>
    );
}