import React, { useState, useEffect } from 'react';
import { X, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BetaBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has dismissed the banner
        const dismissed = localStorage.getItem('betaBannerDismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Store dismissal permanently (no expiry)
        localStorage.setItem('betaBannerDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="relative z-50 animate-in slide-in-from-top duration-500">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-3 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-semibold text-sm sm:text-base">
                                We're in Beta!
                            </span>
                            <span className="text-xs sm:text-sm opacity-90">
                                We're actively improving the platform. Your feedback helps us grow.
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            to={createPageUrl("Contact")}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                        >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Give Feedback</span>
                            <span className="sm:hidden">Feedback</span>
                        </Link>

                        <button
                            onClick={handleDismiss}
                            className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                            aria-label="Dismiss banner"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
