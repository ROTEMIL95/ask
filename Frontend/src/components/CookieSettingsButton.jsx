import React, { useState } from 'react';
import { Cookie } from 'lucide-react';
import CookieSettings from './CookieSettings';

export default function CookieSettingsButton() {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowSettings(true)}
                className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors flex items-center gap-2"
            >
                <Cookie className="w-4 h-4" />
                Cookie Settings
            </button>

            {showSettings && (
                <CookieSettings onClose={() => setShowSettings(false)} />
            )}
        </>
    );
}
