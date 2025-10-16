/**
 * Cookie Consent Management Utility
 * Handles consent storage, Google Analytics loading, and preference management
 */

const CONSENT_STORAGE_KEY = 'talkapi_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365; // 12 months

/**
 * Cookie consent preferences structure
 * @typedef {Object} CookiePreferences
 * @property {boolean} essential - Always true, required for site functionality
 * @property {boolean} analytics - Google Analytics tracking
 * @property {string} timestamp - When consent was given
 * @property {string} version - Consent policy version
 */

/**
 * Get current consent preferences from localStorage
 * @returns {CookiePreferences|null}
 */
export function getConsent() {
    try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!stored) return null;

        const consent = JSON.parse(stored);

        // Check if consent has expired
        const consentDate = new Date(consent.timestamp);
        const expiryDate = new Date(consentDate);
        expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);

        if (new Date() > expiryDate) {
            // Consent expired, remove it
            localStorage.removeItem(CONSENT_STORAGE_KEY);
            return null;
        }

        return consent;
    } catch (error) {
        console.error('Error reading cookie consent:', error);
        return null;
    }
}

/**
 * Save consent preferences to localStorage
 * @param {Object} preferences - Cookie category preferences
 * @param {boolean} preferences.analytics - Allow analytics cookies
 */
export function saveConsent(preferences) {
    try {
        const consent = {
            essential: true, // Always required
            analytics: preferences.analytics || false,
            timestamp: new Date().toISOString(),
            version: '1.0' // Update this when privacy policy changes
        };

        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));

        // Load or remove Google Analytics based on consent
        if (consent.analytics) {
            loadGoogleAnalytics();
        } else {
            removeGoogleAnalytics();
        }

        return consent;
    } catch (error) {
        console.error('Error saving cookie consent:', error);
        return null;
    }
}

/**
 * Accept all cookies (convenience function)
 */
export function acceptAllCookies() {
    return saveConsent({ analytics: true });
}

/**
 * Reject all non-essential cookies
 */
export function rejectAllCookies() {
    return saveConsent({ analytics: false });
}

/**
 * Check if user has given consent for a specific category
 * @param {string} category - Cookie category (e.g., 'analytics')
 * @returns {boolean}
 */
export function hasConsent(category) {
    const consent = getConsent();
    if (!consent) return false;
    return consent[category] === true;
}

/**
 * Check if user has made any consent choice
 * @returns {boolean}
 */
export function hasConsentChoice() {
    return getConsent() !== null;
}

/**
 * Clear all consent preferences (for testing or user request)
 */
export function clearConsent() {
    try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        removeGoogleAnalytics();
    } catch (error) {
        console.error('Error clearing cookie consent:', error);
    }
}

/**
 * Load Google Analytics if consent is given
 */
export function loadGoogleAnalytics() {
    // Check if already loaded
    if (window.gtag) {
        console.log('Google Analytics already loaded');
        return;
    }

    const GA_TRACKING_ID = 'G-DL2KF04XLX';

    try {
        // Create and append gtag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
        document.head.appendChild(script);

        // Initialize dataLayer and gtag
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', GA_TRACKING_ID, {
            anonymize_ip: true, // Anonymize IP for GDPR compliance
            cookie_flags: 'SameSite=None;Secure'
        });

        console.log('Google Analytics loaded with user consent');
    } catch (error) {
        console.error('Error loading Google Analytics:', error);
    }
}

/**
 * Remove Google Analytics scripts and cookies
 */
export function removeGoogleAnalytics() {
    try {
        // Remove GA cookies
        const gaCookies = document.cookie.split(';').filter(cookie =>
            cookie.trim().startsWith('_ga') ||
            cookie.trim().startsWith('_gid') ||
            cookie.trim().startsWith('_gat')
        );

        gaCookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        });

        // Remove gtag from window
        if (window.gtag) {
            delete window.gtag;
        }
        if (window.dataLayer) {
            delete window.dataLayer;
        }

        console.log('Google Analytics removed');
    } catch (error) {
        console.error('Error removing Google Analytics:', error);
    }
}

/**
 * Initialize cookie consent system
 * Call this on app startup
 */
export function initializeCookieConsent() {
    const consent = getConsent();

    if (consent && consent.analytics) {
        // User has previously consented to analytics
        loadGoogleAnalytics();
    } else {
        // No consent or analytics rejected
        removeGoogleAnalytics();
    }
}
