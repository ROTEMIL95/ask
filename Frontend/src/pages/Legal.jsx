import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock, Cookie } from 'lucide-react';

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms and Conditions</h1>
                    <p className="text-xl text-blue-200">Our legal policies and commitment to your privacy</p>
                </div>

                <div className="space-y-8">
                    <Card className="bg-black/20 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <FileText className="w-6 h-6 text-blue-400" />
                                Terms and Conditions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p className="text-gray-300 mb-6">
                                Welcome to Talkapi. By accessing or using our service, you agree to be bound by these terms and conditions.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Acceptance of Terms</h3>
                            <p className="text-gray-300 mb-6">
                                By creating an account or using Talkapi, you acknowledge that you have read, understood,
                                and agree to be bound by these Terms and Conditions.
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
                                <li>Cookie data (as detailed in our Cookie Policy below)</li>
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
                                <Cookie className="w-6 h-6 text-orange-400" />
                                Cookie Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-300 space-y-4">
                            <p>
                                This Cookie Policy explains how Talkapi uses cookies and similar technologies to recognize you
                                when you visit our platform. It explains what these technologies are, why we use them, and your
                                rights to control our use of them.
                            </p>

                            <h3 className="text-lg font-semibold text-white">What Are Cookies?</h3>
                            <p>
                                Cookies are small data files that are placed on your computer or mobile device when you visit a
                                website. Cookies are widely used by website owners to make their websites work, or to work more
                                efficiently, as well as to provide reporting information.
                            </p>

                            <h3 className="text-lg font-semibold text-white">What Cookies Do We Use?</h3>

                            <div className="ml-4 space-y-4">
                                <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                                    <h4 className="font-semibold text-white mb-2">Essential Cookies (Always Active)</h4>
                                    <p className="text-sm mb-2">
                                        These cookies are strictly necessary for the website to function and cannot be switched off.
                                        They are usually only set in response to actions made by you.
                                    </p>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        <li><strong>Authentication:</strong> Supabase auth tokens stored in localStorage</li>
                                        <li><strong>Session Management:</strong> Maintains your logged-in state</li>
                                        <li><strong>User Preferences:</strong> Beta banner dismissal, UI settings</li>
                                        <li><strong>Security:</strong> CSRF protection and secure session handling</li>
                                    </ul>
                                </div>

                                <div className="bg-black/30 p-4 rounded-lg border border-blue-500/30">
                                    <h4 className="font-semibold text-white mb-2">Analytics Cookies (Optional - Requires Consent)</h4>
                                    <p className="text-sm mb-2">
                                        These cookies help us understand how visitors interact with our website by collecting
                                        and reporting information anonymously.
                                    </p>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        <li><strong>Google Analytics (_ga, _gid, _gat):</strong> Tracks page views, session duration,
                                            and user behavior patterns</li>
                                        <li><strong>Purpose:</strong> Helps us improve website performance and user experience</li>
                                        <li><strong>Data collected:</strong> IP address (anonymized), browser type, pages visited,
                                            time spent on pages</li>
                                        <li><strong>Retention:</strong> _ga: 2 years, _gid: 24 hours, _gat: 1 minute</li>
                                    </ul>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white">How We Use localStorage</h3>
                            <p>
                                In addition to cookies, we use browser localStorage for:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Storing authentication session data (Supabase auth tokens)</li>
                                <li>Remembering your cookie consent preferences (12 months)</li>
                                <li>Saving UI preferences (e.g., beta banner dismissal)</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white">Managing Your Cookie Preferences</h3>
                            <p>
                                You have the right to decide whether to accept or reject cookies. You can exercise your
                                cookie rights by setting your preferences in the Cookie Consent banner that appears when
                                you first visit our website, or by clicking the "Cookie Settings" link in the footer.
                            </p>
                            <p>
                                You can also set or amend your web browser controls to accept or refuse cookies. If you
                                choose to reject cookies, you may still use our website, but your access to some
                                functionality and areas may be restricted.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Third-Party Cookies</h3>
                            <p>
                                We use Google Analytics, a third-party service, to analyze website usage. Google Analytics
                                sets cookies to help us understand how users interact with our site. Google may use this
                                data in accordance with their own Privacy Policy. You can opt-out of Google Analytics by
                                rejecting analytics cookies in our Cookie Settings or by installing the
                                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer"
                                   className="text-blue-400 hover:text-blue-300 underline ml-1">
                                    Google Analytics Opt-out Browser Add-on
                                </a>.
                            </p>

                            <h3 className="text-lg font-semibold text-white">Updates to This Cookie Policy</h3>
                            <p>
                                We may update this Cookie Policy from time to time to reflect changes to the cookies we use
                                or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy
                                regularly to stay informed about our use of cookies.
                            </p>
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
                                please contact us immediately at office@1000-2000.com
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
                        For questions about these legal documents, contact us at office@1000-2000.com
                    </p>
                </div>
            </div>
        </div>
    );
}