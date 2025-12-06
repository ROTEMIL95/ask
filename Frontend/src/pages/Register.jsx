import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2, CheckCircle, User } from 'lucide-react';
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

export default function Register() {
    const { signUp, signInWithGoogle, loading, error: authError, clearError } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: []
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedCookies, setAcceptedCookies] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Input changed:', { name, value: name === 'password' ? '***' + value.slice(-3) : value });
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Check password strength when password changes
        if (name === 'password') {
            checkPasswordStrength(value);
        }

        // Clear error when user starts typing
        if (error || authError) {
            setError('');
            clearError();
        }
    };

    const checkPasswordStrength = (password) => {
        const feedback = [];
        let score = 0;

        if (password.length >= 8) {
            score += 1;
            feedback.push('At least 8 characters');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
            feedback.push('Contains lowercase letter');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
            feedback.push('Contains uppercase letter');
        }
        if (/[0-9]/.test(password)) {
            score += 1;
            feedback.push('Contains number');
        }
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
            feedback.push('Contains special character');
        }

        setPasswordStrength({ score, feedback });
    };

    const validateForm = () => {
        console.log('Validating form data:', {
            email: formData.email,
            emailLength: formData.email?.length || 0,
            password: formData.password ? 'Yes (length: ' + formData.password.length + ')' : 'No',
            passwordStrength: passwordStrength.score,
            acceptedTerms: acceptedTerms,
            acceptedCookies: acceptedCookies
        });
        
        if (!formData.name || !formData.email || !formData.password) {
            console.log('Validation failed: Missing name, email or password');
            setError('Please fill in all required fields.');
            return false;
        }
        if (passwordStrength.score < 3) {
            console.log('Validation failed: Password too weak (score: ' + passwordStrength.score + ')');
            setError('Password is too weak. Please choose a stronger password.');
            return false;
        }
        if (!acceptedTerms) {
            console.log('Validation failed: Terms and conditions not accepted');
            setError('Please accept the Terms and Conditions to continue.');
            return false;
        }
        if (!acceptedCookies) {
            console.log('Validation failed: Cookie settings not accepted');
            setError('Please accept the Cookie Settings to continue.');
            return false;
        }
        console.log('Form validation passed');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        // Debug: Log the form data being sent
        console.log('Form data being sent to signUp:', {
            email: formData.email,
            password: formData.password ? '***' + formData.password.slice(-3) : 'empty'
        });

        const result = await signUp(formData.email, formData.password, formData.name);

        // Debug: Log the result
        console.log('SignUp result:', result);

        if (result.success) {
            // Navigate to home page after successful registration
            navigate(createPageUrl('Home'));
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }
    };

    const handleGoogleSignUp = async () => {
        setError('');
        const result = await signInWithGoogle();

        if (!result.success && result.error) {
            setError(result.error || 'Failed to sign up with Google. Please try again.');
        }
        // Note: On success, user will be redirected to Google OAuth page
        // They will come back to /auth/callback after authentication
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength.score >= 4) return 'text-green-400';
        if (passwordStrength.score >= 3) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white px-4 sm:px-6 py-8">
            <div className="w-full max-w-md">
                {/* Back to Home Link */}
                <Link 
                    to={createPageUrl("Home")} 
                    className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Registration Form */}
                <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            Create Account
                        </h1>
                        <p className="text-blue-200">
                            Join Talkapi and start building better APIs
                        </p>
                    </div>

                    {(error || authError) && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                            {error || authError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-300">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    className="pl-10 bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

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
                                    placeholder="Create a strong password"
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
                            
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    passwordStrength.score >= 4 ? 'bg-green-500' :
                                                    passwordStrength.score >= 3 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                                            {passwordStrength.score >= 4 ? 'Strong' :
                                             passwordStrength.score >= 3 ? 'Good' :
                                             passwordStrength.score >= 2 ? 'Fair' : 'Weak'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        {passwordStrength.feedback.map((item, index) => (
                                            <div key={index} className="flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Terms and Conditions Checkbox */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-white/20 bg-black/30 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                    required
                                />
                                <label htmlFor="terms" className="text-sm text-gray-300">
                                    I agree to the{' '}
                                    <Link 
                                        to={createPageUrl("Legal")} 
                                        className="text-blue-400 hover:text-blue-300 underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Terms and Conditions
                                    </Link>
                                </label>
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="cookies"
                                    checked={acceptedCookies}
                                    onChange={(e) => setAcceptedCookies(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-white/20 bg-black/30 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                    required
                                />
                                <label htmlFor="cookies" className="text-sm text-gray-300">
                                    I accept the{' '}
                                    <Link 
                                        to={createPageUrl("Legal")} 
                                        className="text-blue-400 hover:text-blue-300 underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Cookie Settings
                                    </Link>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading || !acceptedTerms || !acceptedCookies}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-black/20 text-gray-400"></span>
                        </div>
                    </div>

                    {/* Google Sign Up Button */}
                    <Button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 border border-gray-300 flex items-center justify-center gap-3"
                    >
                        <GoogleIcon />
                        Sign up with Google
                    </Button>

                    {/* Sign In Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-300">
                            Already have an account?{' '}
                            <Link 
                                to={createPageUrl("Login")} 
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 