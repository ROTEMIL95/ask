import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Home, CreditCard, User } from 'lucide-react';

export default function Success() {
  const [searchParams] = useSearchParams();
  const { user, loadUserFromProxy } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const userId = searchParams.get('user_id');
  const plan = searchParams.get('plan') || 'pro';

  useEffect(() => {
    // Refresh user data to get updated plan info
    const refreshUserData = async () => {
      if (loadUserFromProxy) {
        await loadUserFromProxy();
      }
      setLoading(false);
    };
    
    // Wait a moment for the backend to process the payment callback
    setTimeout(refreshUserData, 2000);
  }, [loadUserFromProxy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h1>
          <p className="text-gray-600">Your {plan.toUpperCase()} plan is now active</p>
        </div>

        {loading ? (
          <div className="mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Updating your account...</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-700 text-left space-y-1">
              <li>• Your account has been upgraded to {plan.toUpperCase()}</li>
              <li>• You now have access to premium features</li>
              <li>• Start using the API with your new limits</li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
          
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            View Pricing Plans
          </button>
        </div>

        {userId && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Transaction completed for user: {userId.slice(0, 8)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
