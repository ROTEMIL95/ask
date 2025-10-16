import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3, CheckCircle2 } from 'lucide-react';
import { getConsent, saveConsent } from '@/utils/cookieConsent';

export default function CookieSettings({ onClose }) {
    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: false
    });

    useEffect(() => {
        // Load existing preferences
        const existingConsent = getConsent();
        if (existingConsent) {
            setPreferences({
                essential: true, // Always true
                analytics: existingConsent.analytics || false
            });
        }
    }, []);

    const handleToggle = (category) => {
        if (category === 'essential') return; // Cannot disable essential cookies

        setPreferences(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleSave = () => {
        saveConsent({ analytics: preferences.analytics });
        onClose();
    };

    const handleAcceptAll = () => {
        setPreferences({
            essential: true,
            analytics: true
        });
        saveConsent({ analytics: true });
        onClose();
    };

    const handleRejectAll = () => {
        setPreferences({
            essential: true,
            analytics: false
        });
        saveConsent({ analytics: false });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-blue-500/30 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-gray-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Cookie className="w-6 h-6 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">Cookie Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <p className="text-gray-300 mb-6">
                        We use cookies to enhance your experience. You can choose which types of cookies to allow.
                        Note that blocking some types of cookies may impact your experience on our site.
                    </p>

                    {/* Cookie Categories */}
                    <div className="space-y-4">
                        {/* Essential Cookies */}
                        <div className="bg-black/20 border border-gray-700 rounded-lg p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Essential Cookies</h3>
                                        <p className="text-xs text-gray-400 mt-1">Always Active</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-semibold text-green-400">Required</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                These cookies are necessary for the website to function and cannot be switched off.
                                They are usually only set in response to actions made by you, such as logging in,
                                setting privacy preferences, or filling in forms.
                            </p>
                            <div className="mt-3 text-xs text-gray-400">
                                <strong className="text-gray-300">Used for:</strong> Authentication, session management,
                                security features, and basic site functionality.
                            </div>
                        </div>

                        {/* Analytics Cookies */}
                        <div className="bg-black/20 border border-gray-700 rounded-lg p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">Analytics Cookies</h3>
                                        <p className="text-xs text-gray-400 mt-1">Optional</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle('analytics')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                                        preferences.analytics ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                                    role="switch"
                                    aria-checked={preferences.analytics}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                These cookies help us understand how visitors interact with our website by collecting
                                and reporting information anonymously. This helps us improve the website and your experience.
                            </p>
                            <div className="mt-3 text-xs text-gray-400">
                                <strong className="text-gray-300">Services:</strong> Google Analytics
                                <br />
                                <strong className="text-gray-300">Data collected:</strong> Page views, session duration,
                                bounce rate, user interactions (anonymized)
                            </div>
                        </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-gray-300">
                            <strong className="text-white">Privacy Note:</strong> We respect your privacy and are
                            committed to protecting your personal data. Your preferences will be saved for 12 months.
                            You can change your settings at any time using the "Cookie Settings" link in the footer.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-gray-700 p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAcceptAll}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Accept All
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Save Preferences
                        </button>
                        <button
                            onClick={handleRejectAll}
                            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Reject All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
