import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { hasConsentChoice, acceptAllCookies, rejectAllCookies } from '@/utils/cookieConsent';
import CookieSettings from './CookieSettings';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const hasChoice = hasConsentChoice();
        if (!hasChoice) {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        acceptAllCookies();
        setIsVisible(false);
    };

    const handleRejectAll = () => {
        rejectAllCookies();
        setIsVisible(false);
    };

    const handleCustomize = () => {
        setShowSettings(true);
    };

    const handleSettingsClose = () => {
        setShowSettings(false);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Cookie Consent Banner - Compact Bottom Left */}
            <div className="fixed bottom-4 left-4 z-50 max-w-md animate-in slide-in-from-left duration-500">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-blue-500/30 rounded-lg shadow-2xl backdrop-blur-xl">
                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0">
                                <Cookie className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-white mb-1">
                                    Cookie Consent
                                </h3>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    We use cookies to improve your experience.{' '}
                                    <Link
                                        to={createPageUrl("Legal")}
                                        className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Learn more
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleAcceptAll}
                                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-md transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Accept All
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRejectAll}
                                    className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-all duration-200"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={handleCustomize}
                                    className="flex-1 py-2 px-3 bg-transparent border border-blue-500/50 hover:border-blue-500 text-white text-sm font-medium rounded-md transition-all duration-200"
                                >
                                    Customize
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cookie Settings Modal */}
            {showSettings && (
                <CookieSettings onClose={handleSettingsClose} />
            )}
        </>
    );
}
