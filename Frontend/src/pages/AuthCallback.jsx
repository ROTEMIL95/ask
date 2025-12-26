import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, userProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import authProxy from '../lib/authProxy';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadUserFromProxy } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {

        // Get the hash fragment from URL (contains auth tokens)
        const hashFragment = window.location.hash.substring(1);

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


        if (!accessToken || !refreshToken) {
          setError('Invalid authentication tokens received');
          setLoading(false);
          return;
        }

        // Set the session in Supabase
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {

          setError('Failed to authenticate');
          setLoading(false);
          return;
        }


        // Store session in authProxy (for consistency with email/password login)
        if (data?.session) {
          authProxy.setSession(data.session);

        }

        // Get or create user profile
        if (data?.user) {

          try {
            const { data: profile, error: profileError } = await userProfile.getProfile(data.user.id);

            if (!profile && !profileError) {
              // Profile doesn't exist, create it

              const { error: createError } = await userProfile.createProfile(
                data.user.id,
                data.user.email,
                data.user.user_metadata?.username || data.user.user_metadata?.full_name?.split(' ')[0],
                data.user.user_metadata?.full_name || data.user.user_metadata?.name
              );

              if (createError) {

              } else {

              }
            } else if (profileError) {

            } else {

            }
          } catch (profileErr) {

          }
        }

        setSuccess(true);

        // Load user data in auth context
        if (loadUserFromProxy) {
          await loadUserFromProxy();
        }

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } catch (err) {

        setError('An error occurred during authentication');
      }

      setLoading(false);
    };

    handleAuthCallback();
  }, [navigate, loadUserFromProxy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 p-8 rounded-xl shadow-2xl text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Processing Authentication</h2>
          <p className="text-gray-300">Please wait while we complete your sign-in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 p-8 rounded-xl shadow-2xl text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 p-8 rounded-xl shadow-2xl text-center max-w-md">
          <div className="text-green-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Successful!</h2>
          <p className="text-gray-300 mb-6">You have been successfully signed in. Redirecting you to the home page...</p>
          <div className="text-gray-400 text-sm">Redirecting in a few seconds...</div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;