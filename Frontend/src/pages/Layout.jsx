
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, LogIn, LogOut, UserCircle, LayoutDashboard, Loader2, Menu, X, BookOpen, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import CookieConsent from '@/components/CookieConsent';
import { initializeCookieConsent } from '@/utils/cookieConsent';

export default function Layout({ children }) {
    const { user, loading, isAuthenticated, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // User authentication is now handled by AuthContext - no need for local state management

    // Initialize cookie consent system on mount
    useEffect(() => {
        initializeCookieConsent();
    }, []);

    useEffect(() => {
        // Close mobile menu when location changes
        setMobileMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        // Scroll to top on every page transition
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.pathname]);

    const handleLogin = () => {
        // Navigate to login page instead of using User.login()
        window.location.href = createPageUrl("Login");
    };
    const handleLogout = async () => {
        // Prevent multiple simultaneous logout attempts
        if (isLoggingOut) {
            console.log('⏳ Logout already in progress...');
            return;
        }

        try {
            setIsLoggingOut(true);
            console.log('🚪 Starting logout...');

            const result = await signOut();

            if (result.success) {
                console.log('✅ Successfully signed out');
                navigate(createPageUrl("Home"));
            } else {
                console.error('❌ Error signing out:', result.error);
                // Even if there's an error, navigate to home
                navigate(createPageUrl("Home"));
            }
        } catch (e) {
            console.error('❌ Error during logout:', e);
            // Even on error, navigate to home to reset the UI
            navigate(createPageUrl("Home"));
        } finally {
            setIsLoggingOut(false);
        }
    };

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
            {/* Cookie Consent Banner */}
            <CookieConsent />

            <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <Link to={createPageUrl("Home")} className="flex items-center gap-2 sm:gap-3">
                            <img
                                src="/images/logoTalk.webp"
                                alt="AskAPI Logo"
                                className="w-32 h-32 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-24 xl:w-38 xl:h-24 object-contain"
                            />
                        </Link>
                        
                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-6">
                            <Link to={createPageUrl("Documentation")} className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                Docs
                            </Link>
                            
                            <Link to={createPageUrl("HowItWorks")} className="text-gray-300 hover:text-white transition-colors">
                                How It Works
                            </Link>

                            {/* Temporarily disabled - Pricing page */}
                            {/* <Link to={createPageUrl("Pricing")} className="text-gray-300 hover:text-white transition-colors">
                                Pricing
                            </Link> */}

                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            ) : isAuthenticated ? (
                                <div className="flex items-center gap-4">
                                    {/* Admin check - you can customize this based on your user metadata */}
                                    {user.user_metadata?.role === 'admin' && (
                                        <Link to={createPageUrl("Admin")} className="flex items-center gap-2 text-gray-300 hover:text-white">
                                            <LayoutDashboard className="w-4 h-4" /> Admin
                                        </Link>
                                    )}
                                    <Link to={createPageUrl("Account")} className="flex items-center gap-2 text-gray-300 hover:text-white">
                                        <UserCircle className="w-4 h-4" /> My Account
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        className="flex items-center gap-2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoggingOut ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Logging out...
                                            </>
                                        ) : (
                                            <>
                                                <LogOut className="w-4 h-4" /> Logout
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={handleLogin} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                                    <LogIn className="w-4 h-4" /> Sign In
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMobileMenu}
                                className="text-white hover:bg-white/10"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4">
                            <div className="flex flex-col space-y-4">
                                <Link 
                                    to={createPageUrl("Documentation")} 
                                    className="text-gray-300 hover:text-white transition-colors py-2 flex items-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Documentation
                                </Link>
                                
                                <Link
                                    to={createPageUrl("HowItWorks")}
                                    className="text-gray-300 hover:text-white transition-colors py-2"
                                >
                                    How It Works
                                </Link>

                                {/* Temporarily disabled - Pricing page */}
                                {/* <Link
                                    to={createPageUrl("Pricing")}
                                    className="text-gray-300 hover:text-white transition-colors py-2"
                                >
                                    Pricing
                                </Link> */}

                                {loading ? (
                                    <div className="flex items-center gap-2 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        <span className="text-gray-400">Loading...</span>
                                    </div>
                                ) : isAuthenticated ? (
                                    <>
                                        {/* Admin check - you can customize this based on your user metadata */}
                                        {user.user_metadata?.role === 'admin' && (
                                            <Link 
                                                to={createPageUrl("Admin")} 
                                                className="flex items-center gap-2 text-gray-300 hover:text-white py-2"
                                            >
                                                <LayoutDashboard className="w-4 h-4" /> Admin
                                            </Link>
                                        )}
                                        <Link
                                            to={createPageUrl("Account")}
                                            className="flex items-center gap-2 text-gray-300 hover:text-white py-2"
                                        >
                                            <UserCircle className="w-4 h-4" /> My Account
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="flex items-center gap-2 text-gray-300 hover:text-white py-2 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoggingOut ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Logging out...
                                                </>
                                            ) : (
                                                <>
                                                    <LogOut className="w-4 h-4" /> Logout
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <Link 
                                        to={createPageUrl("Login")} 
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors text-left"
                                    >
                                        <LogIn className="w-4 h-4" /> Sign In
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-black/20 border-t border-white/10 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-4">
                        <Link to={createPageUrl("Documentation")} className="text-gray-400 hover:text-white text-sm sm:text-base">
                            Documentation
                        </Link>
                        <Link to={createPageUrl("Legal")} className="text-gray-400 hover:text-white text-sm sm:text-base">
                            Terms and Conditions
                        </Link>
                        <Link to={createPageUrl("Contact")} className="text-gray-400 hover:text-white text-sm sm:text-base">
                            Contact
                        </Link>
                        <Link to={createPageUrl("RefundPolicy")} className="text-gray-400 hover:text-white text-sm sm:text-base">
                            Refund Policy
                        </Link>
                        <Link to={createPageUrl("Legal")} className="text-gray-400 hover:text-white text-sm sm:text-base">
                            Cookie Settings
                        </Link>
                        {/* <Link to={createPageUrl("Status")} className="text-gray-400 hover:text-white text-sm sm:text-base">
                            Status
                        </Link> */}
                    </div>
                    <p className="text-gray-400 text-sm">© 2025 Talkapi. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
