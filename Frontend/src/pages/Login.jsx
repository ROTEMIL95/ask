import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';

// Google icon component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

export default function Login() {
    const { signIn, signUp, resetPassword, loading, error: authError, clearError } = useAuth();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('returnTo');
    const planParam = searchParams.get('plan');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (error || authError) {
            setError('');
            setSuccessMessage('');
            clearError();
        }
    };

    const handleCheckboxChange = (checked) => {
        setFormData(prev => ({
            ...prev,
            rememberMe: checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.email || !formData.password) {
            setError('Please fill in all required fields.');
            return;
        }

        const result = isSignUp 
            ? await signUp(formData.email, formData.password)
            : await signIn(formData.email, formData.password);

        if (result.success) {
            // Show success message if provided
            if (result.message) {
                // For email confirmation, show message but don't navigate
                // if (result.message.includes('check your email')) {
                //     setSuccessMessage(result.message);
                //     return;
                // }
                // For successful signup and signin, show success message briefly
                setSuccessMessage(result.message);
                    // Redirect to returnTo URL if provided, otherwise go to Home
                    if (returnTo) {
                        const redirectUrl = returnTo + (planParam ? `&plan=${planParam}` : '');
                        navigate(redirectUrl);
                    } else {
                        navigate(createPageUrl('Home'));
                    }
                return;
            }
            // Navigate after successful auth
            if (returnTo) {
                const redirectUrl = returnTo + (planParam ? `&plan=${planParam}` : '');
                navigate(redirectUrl);
            } else {
                navigate(createPageUrl('Home'));
            }
        } else {
            setError(result.error || 'Authentication failed. Please try again.');
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setFormData({
            email: '',
            password: '',
            rememberMe: false
        });
        setError('');
        setSuccessMessage('');
        clearError();
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetMessage('');
        setError('');

        if (!resetEmail) {
            setError('Please enter your email address.');
            return;
        }

        setResetLoading(true);
        const result = await resetPassword(resetEmail);
        setResetLoading(false);

        if (result.success) {
            setResetMessage(result.message || 'Password reset email sent! Please check your inbox.');
            // Clear the modal after 3 seconds
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetMessage('');
            }, 3000);
        } else {
            setError(result.error || 'Failed to send password reset email. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white px-4 sm:px-6">
            <div className="w-full max-w-md">
                {/* Back to Home Link */}
                <Link 
                    to={createPageUrl("Home")} 
                    className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Login Form */}
                <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h1>
                        <p className="text-blue-200">
                            {isSignUp 
                                ? 'Create your Talkapi account to get started'
                                : 'Sign in to your Talkapi account'
                            }
                        </p>
                    </div>

                    {(error || authError) && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                            {error || authError}
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                    className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-10 bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="rememberMe"
                                    checked={formData.rememberMe}
                                    onCheckedChange={handleCheckboxChange}
                                    className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label htmlFor="rememberMe" className="text-sm text-gray-300">
                                    Remember me
                                </label>
                            </div>
                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                                </>
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Toggle Mode or Register Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-300">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            {isSignUp ? (
                                <button 
                                    onClick={toggleMode}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Sign in
                                </button>
                            ) : (
                                <Link 
                                    to={createPageUrl("Register")}
                                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                >
                                    Create account
                                </Link>
                            )}
                        </p>
                    </div>
                </div>

                {/* Forgot Password Modal */}
                {showForgotPassword && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-slate-900 to-blue-900 border border-white/20 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
                            <p className="text-gray-300 mb-6">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            {resetMessage && (
                                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
                                    {resetMessage}
                                </div>
                            )}

                            {error && !resetMessage && (
                                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="resetEmail" className="text-sm font-medium text-gray-300">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="resetEmail"
                                            name="resetEmail"
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                            required
                                            disabled={resetLoading}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setResetEmail('');
                                            setResetMessage('');
                                            setError('');
                                        }}
                                        disabled={resetLoading}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                                    >
                                        {resetLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 