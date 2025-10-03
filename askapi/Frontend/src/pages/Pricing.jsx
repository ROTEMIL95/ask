import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CheckCircle, Crown } from "lucide-react";
import authProxy from "../lib/authProxy";
import { useUserProfile } from "../hooks/useUserProfile";

const Pricing = () => {
  const { isAuthenticated } = useAuth();
  const { planType, profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

  const handlePaidPlanClick = (plan) => {
    if (!isAuthenticated) {
      // Redirect to login with a return URL
      navigate('/login?returnTo=/checkout?plan=' + plan);
      return;
    }

    // User is logged in, get user ID and proceed with payment
    const user = authProxy.getUser();
    if (!user?.id) {
      console.error('User ID not found, redirecting to login');
      navigate('/login?returnTo=/checkout&plan=' + plan);
      return;
    }

    // Redirect to checkout page with plan and user info
    navigate(`/checkout?plan=${plan}&user_id=${user.id}`);
  };

  function handleFreePlanClick() {
    const route = isAuthenticated ? '/home' : '/login'
    navigate(route)
  }

  // Helper function to determine button state for each plan
  const getPlanButtonState = (plan) => {
    if (!isAuthenticated) {
      return { type: 'login', disabled: false };
    }
    
    if (profileLoading) {
      return { type: 'loading', disabled: true };
    }
    
    const currentPlan = planType || 'free';
    
    if (currentPlan === plan) {
      return { type: 'current', disabled: true };
    }
    
    // Logic for upgrades/downgrades
    const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
    const currentLevel = planHierarchy[currentPlan];
    const targetLevel = planHierarchy[plan];
    
    if (targetLevel > currentLevel) {
      return { type: 'upgrade', disabled: false };
    } else if (targetLevel < currentLevel) {
      return { type: 'downgrade', disabled: false };
    }
    
    return { type: 'upgrade', disabled: false };
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-10">Choose Your Plan</h1>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* Free Plan */}
        <div className={`text-card-foreground shadow relative bg-[#0B1535] rounded-xl overflow-hidden border ${
          planType === 'free' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-white/10'
        }`}>
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="tracking-tight text-2xl font-bold text-white">Free Plan</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-white">$0<span className="text-lg font-normal text-gray-400"> / per month</span></div>
            <ul className="mt-6 space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Up to 50 API requests total (convert + run)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Converter & Runner access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Use your own API key</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Community support</span>
              </li>
            </ul>
            <div className="mt-8">
              {(() => {
                const buttonState = getPlanButtonState('free');
                if (buttonState.type === 'current') {
                  return (
                    <Button
                      disabled
                      className="w-full py-3 rounded-lg font-semibold bg-green-600 text-white cursor-not-allowed opacity-80"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Your Current Plan
                    </Button>
                  );
                }
                return (
                  <Button
                    onClick={handleFreePlanClick}
                    className="w-full py-3 rounded-lg font-semibold transition bg-white text-black hover:bg-gray-200"
                  >
                    {buttonState.type === 'downgrade' ? 'Downgrade to Free' : 'Start Free'}
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className={`text-card-foreground relative bg-[#0B1535] rounded-xl overflow-hidden shadow-lg scale-[1.02] border ${
          planType === 'pro' ? 'border-purple-400 ring-2 ring-purple-500/20' : 'border-purple-500'
        }`}>
          <div className="absolute top-5 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow whitespace-nowrap">
            {planType === 'pro' ? 'Your Plan' : 'Most Popular'}
          </div>
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="tracking-tight text-2xl font-bold text-purple-300">Pro Beta</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-white">$19<span className="text-lg font-normal text-gray-400"> / per month</span></div>
            <ul className="mt-6 space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>500 code generations (convert)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>2000 API runs (execute)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Multiple code languages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Saved history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Priority email support</span>
              </li>
            </ul>
            <div className="mt-8">
              {(() => {
                const buttonState = getPlanButtonState('pro');
                if (buttonState.type === 'current') {
                  return (
                    <div className="space-y-2">
                      <Button
                        disabled
                        className="w-full py-3 rounded-lg font-semibold bg-purple-600 text-white cursor-not-allowed opacity-80"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Your Current Plan
                      </Button>
                      {profile?.subscription_status === 'active' && (
                        <p className="text-xs text-gray-400 text-center">
                          Active since {profile?.subscription_start_date ? 
                            new Date(profile.subscription_start_date).toLocaleDateString() : 'N/A'}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <Button
                    onClick={() => handlePaidPlanClick('pro')}
                    disabled={buttonState.disabled}
                    className="w-full py-3 rounded-lg font-semibold transition bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {buttonState.type === 'loading' ? 'Loading...' :
                     buttonState.type === 'login' ? 'Login to Subscribe – $19/mo' :
                     buttonState.type === 'upgrade' ? 'Upgrade to Pro – $19/mo' :
                     'Subscribe – $19/mo'}
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className={`text-card-foreground shadow relative bg-[#0B1535] rounded-xl overflow-hidden border ${
          planType === 'enterprise' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/10'
        }`}>
          {planType === 'enterprise' && (
            <div className="absolute top-5 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow whitespace-nowrap">
              Your Plan
            </div>
          )}
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="tracking-tight text-2xl font-bold text-white">Enterprise</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-white">Custom<span className="text-lg font-normal text-gray-400"> / annual</span></div>
            <ul className="mt-6 space-y-3 text-gray-200">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Custom quotas & SLAs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Dedicated region / VPC</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>SSO/SAML & RBAC</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Security & audit reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>White-glove onboarding</span>
              </li>
            </ul>
            <div className="mt-8">
              {(() => {
                const buttonState = getPlanButtonState('enterprise');
                if (buttonState.type === 'current') {
                  return (
                    <div className="space-y-2">
                      <Button
                        disabled
                        className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 text-white cursor-not-allowed opacity-80"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Your Current Plan
                      </Button>
                      {profile?.subscription_status === 'active' && (
                        <p className="text-xs text-gray-400 text-center">
                          Active since {profile?.subscription_start_date ? 
                            new Date(profile.subscription_start_date).toLocaleDateString() : 'N/A'}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <a
                    href="mailto:office@1000-2000.com"
                    className="block w-full py-3 rounded-lg font-semibold transition bg-white text-black hover:bg-gray-200 text-center"
                  >
                    {buttonState.type === 'upgrade' ? 'Upgrade to Enterprise' : 'Contact Sales'}
                  </a>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
