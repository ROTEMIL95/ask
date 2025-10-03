import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing auth callback...');
        
        // Get the hash fragment from URL (contains auth tokens)
        const hashFragment = window.location.hash.substring(1);
        console.log('Hash fragment:', hashFragment);
        
        if (!hashFragment) {
          setError('No authentication data received');
          setLoading(false);
          return;
        }

        // Parse the hash fragment
        const params = new URLSearchParams(hashFragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const tokenType = params.get('token_type');
        const type = params.get('type');

        console.log('Auth callback type:', type);

        if (type === 'signup') {
          // Email confirmation for signup
          if (accessToken && refreshToken) {
            // Set the session in Supabase
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error('Session error:', sessionError);
              setError('Failed to confirm email verification');
              setLoading(false);
              return;
            }

            console.log('Email verified and session set:', data);
            setSuccess(true);
            
            // Load user data in auth context
            if (loadUser) {
              await loadUser();
            }

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 2000);
          } else {
            setError('Invalid authentication tokens received');
          }
        } else if (type === 'recovery') {
          // Password recovery
          setError('Password recovery not implemented yet');
        } else {
          setError('Unknown authentication type');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during authentication');
      }
      
      setLoading(false);
    };

    handleAuthCallback();
  }, [navigate, loadUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Processing Authentication</h2>
          <p className="text-gray-300">Please wait while we verify your email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Email Verified Successfully!</h2>
          <p className="text-gray-300 mb-6">Your email has been confirmed. You will be redirected to the dashboard shortly.</p>
          <div className="text-gray-400 text-sm">Redirecting in a few seconds...</div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;