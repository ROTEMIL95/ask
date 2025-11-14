import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentFail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorCode = searchParams.get('Response') || searchParams.get('error_code');
  const errorMessage = searchParams.get('error_message') || 'Payment was declined';
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
        <XCircle
          size={64}
          style={{
            color: "#ef4444",
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
          Payment Failed
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: 16,
            marginBottom: 24
          }}
        >
          {errorMessage}
        </p>

        {errorCode && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              fontSize: 14,
              color: "#ef4444"
            }}
          >
            Error Code: {errorCode}
          </div>
        )}

        {orderId && (
          <div
            style={{
              background: "rgba(107, 114, 128, 0.1)",
              border: "1px solid rgba(107, 114, 128, 0.3)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              fontSize: 14,
              color: "#9ca3af"
            }}
          >
            Order ID: {orderId}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              flex: 1
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => navigate('/home')}
            style={{
              background: "rgba(107, 114, 128, 0.2)",
              color: "#fff",
              border: "1px solid rgba(107, 114, 128, 0.3)",
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              flex: 1
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
