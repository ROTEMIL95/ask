import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { useUserProfile } from "../hooks/useUserProfile";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, refreshProfile, loading: profileLoading } = useUserProfile();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    // Refresh user profile to get updated plan status
    const fetchUpdatedProfile = async () => {
      setIsRefreshing(true);
      console.log("🔄 Refreshing user profile after payment success...");

      // Wait a bit for Tranzila callback to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      await refreshProfile();
      setIsRefreshing(false);
      console.log("✅ Profile refreshed successfully");
    };

    fetchUpdatedProfile();
  }, [refreshProfile]);

  useEffect(() => {
    // Redirect to home after showing success for 5 seconds
    if (!isRefreshing) {
      const timer = setTimeout(() => {
        navigate('/home');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [navigate, isRefreshing]);

  const transactionId = searchParams.get('transaction_id') || searchParams.get('index');
  const orderId = searchParams.get('order_id');

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        background: "radial-gradient(1200px 600px at 20% 10%, rgba(59,130,246,.25), transparent 60%), " +
          "radial-gradient(900px 500px at 90% 0%, rgba(139,92,246,.22), transparent 60%), #0b1020"
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01)), #121a3a",
          border: "1px solid rgba(162,179,214,.16)",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
          textAlign: "center"
        }}
      >
        {isRefreshing ? (
          <>
            <Loader2
              size={64}
              className="animate-spin"
              style={{
                color: "#60a5fa",
                margin: "0 auto 24px"
              }}
            />
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 12
              }}
            >
              Processing Payment...
            </h1>
            <p
              style={{
                color: "#9ca3af",
                fontSize: 16,
                marginBottom: 24
              }}
            >
              Please wait while we update your account
            </p>
          </>
        ) : (
          <>
            <CheckCircle
              size={64}
              style={{
                color: "#10b981",
                margin: "0 auto 24px"
              }}
            />

            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 12
              }}
            >
              Payment Successful!
            </h1>

            <p
              style={{
                color: "#9ca3af",
                fontSize: 16,
                marginBottom: 24
              }}
            >
              Your account has been upgraded to <strong style={{ color: "#60a5fa" }}>{profile?.plan_type?.toUpperCase() || "Pro"}</strong>
            </p>

            {profile && (
              <div
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  fontSize: 14,
                  color: "#60a5fa"
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>Plan:</strong> {profile.plan_type?.toUpperCase() || "PRO"}
                </div>
                <div>
                  <strong>Daily Limit:</strong> {profile.daily_limit || 100} requests
                </div>
              </div>
            )}
          </>
        )}

        {transactionId && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              fontSize: 14,
              color: "#10b981"
            }}
          >
            Transaction ID: {transactionId}
          </div>
        )}

        {orderId && (
          <div
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              fontSize: 14,
              color: "#60a5fa"
            }}
          >
            Order ID: {orderId}
          </div>
        )}

        {!isRefreshing && (
          <>
            <p
              style={{
                color: "#6b7280",
                fontSize: 14,
                marginBottom: 24
              }}
            >
              Redirecting to home in 5 seconds...
            </p>

            <button
              onClick={() => navigate('/home')}
              style={{
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                width: "100%"
              }}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
