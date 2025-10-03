import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Home, CreditCard, RefreshCw, MessageCircle } from 'lucide-react';

export default function Fail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const userId = searchParams.get('user_id');
  const plan = searchParams.get('plan') || 'pro';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">Your {plan.toUpperCase()} plan payment could not be processed</p>
        </div>

        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">What happened?</h3>
          <ul className="text-sm text-red-700 text-left space-y-1">
            <li>• Payment was declined or canceled</li>
            <li>• Credit card information may be incorrect</li>
            <li>• Payment processor encountered an error</li>
            <li>• Transaction was abandoned</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/pricing')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Payment Again
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>

          <button 
            onClick={() => window.open('https://wa.me/972509058991', '_blank')}
            className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </button>
        </div>

        {userId && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Failed transaction for user: {userId.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Plan: {plan.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
