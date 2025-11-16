import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { handleRecurringPayment } from "@/services/payment.service";
import ReactInputMask from "react-input-mask";
import { formatPaymentData } from "@/utils/util.service";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { fullName, profile, loading: profileLoading } = useUserProfile();
  const [status, setStatus] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  })
  console.log("🚀 ~ Checkout ~ formData:", formData)

  const plan = searchParams.get('plan') || 'pro';
  const userId = searchParams.get('user_id');
  
  // Price configuration
  const sum = plan === 'pro' ? 1 : 19.99;

  // const origin = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
  // const SUCCESS = `${origin}/success?user_id=${userId}&plan=${plan}`;
  // const FAIL = `${origin}/fail?user_id=${userId}&plan=${plan}`;

  useEffect(() => {
    if (authLoading || profileLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/checkout&plan=${plan}&user_id=${userId}`);
      return;
    }
    
    // Populate email from user data
    if (user?.email) {
      editFormData('email', user.email);
    }
    
    // Populate full name - prefer profile data over user metadata
    const userName = fullName || user?.user_metadata?.full_name || '';
    if (userName) {
      editFormData('fullName', userName);
    }
  }, [isAuthenticated, authLoading, profileLoading, user, fullName, navigate, plan, userId]);

  function editFormData(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function onHandlePay(e) {
    e.preventDefault()

    // For hosted payment, we only need name and email
    if (!formData.fullName || !formData.email) {
      setErrMsg('Please enter your name and email')
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrMsg("")  // Clear previous errors

    try {
      // Call backend to get Tranzila hosted payment URL and data
      const backendUrl = import.meta.env.VITE_BACKEND_URL
      const session = JSON.parse(localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1]?.split('.')[0]}-auth-token`))

      if (!session?.access_token) {
        setErrMsg('Please log in to continue')
        setStatus("error")
        return
      }

      console.log("🌐 Creating hosted payment...")
      const response = await fetch(`${backendUrl}/payment/create-hosted-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          full_name: formData.fullName
        })
      })

      const data = await response.json()
      console.log("🌐 Hosted payment response:", data)

      if (!response.ok || data.status === 'error') {
        setErrMsg(data.message || "Failed to create payment. Please try again")
        setStatus("error")
        return
      }

      // Create hidden form and redirect to Tranzila (test terminals don't support iframe)
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.payment_url
      form.style.display = 'none'

      // Add all payment parameters as hidden fields
      Object.entries(data.payment_data).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)
      console.log("🚀 Redirecting to Tranzila payment page...")
      form.submit()

    } catch (error) {
      console.error("❌ Payment error:", error)
      setErrMsg(error.message || "Payment failed, please try again")
      setStatus("error")
    }
  }

  return (
    <div
      className="py-2"
      style={{
        background: "radial-gradient(1200px 600px at 20% 10%, rgba(59,130,246,.25), transparent 60%), " +
          "radial-gradient(900px 500px at 90% 0%, rgba(139,92,246,.22), transparent 60%), #0b1020"
      }}>
      <div style={{ maxWidth: 560, margin: "48px auto", padding: "0 18px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#fff" }}>
          Secure Checkout
        </h1>
        <p style={{ opacity: 0.85, marginBottom: 18, color: "#fff" }}>
          Card fields are securely hosted by Tranzila. We never store card data.
        </p>
        
        <div style={{
          background: "rgba(234, 179, 8, 0.1)",
          border: "1px solid rgba(234, 179, 8, 0.3)",
          borderRadius: 8,
          padding: 12,
          marginBottom: 18,
          color: "#eab308",
          fontSize: 14,
          textAlign: "center"
        }}>
          ⚠️ <strong>Live Payment:</strong> This is a real payment. You will be charged ${sum}.
        </div>

        <div
          style={{
            background: "linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01)), #121a3a",
            border: "1px solid rgba(162,179,214,.16)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,.25)",
          }}
        >
          <div
            style={{
              display: "flex", justifyContent: "space-between", gap: 10,
              background: "#0f1a3f", border: "1px dashed rgba(162,179,214,.25)",
              borderRadius: 12, padding: 14, marginBottom: 14,
            }}
          >
            <div>
              <div style={{ opacity: 0.75, fontSize: 14, color: "#fff" }}>Plan</div>
              <div style={{ fontWeight: 700, color: "#fff" }}>{plan.charAt(0).toUpperCase() + plan.slice(1)} — Monthly</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#fff" }}>
              ${sum}<span style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}> / month</span>
            </div>
          </div>

          <form
            // onSubmit={handlePay}
            onSubmit={onHandlePay}
          >
            <label style={lbl}>Full name</label>
            <input value={formData.fullName} onChange={(e) => editFormData('fullName', e.target.value)} placeholder="Jane Doe" style={inp} required />

            <label style={lbl}>Email</label>
            <input type="email" value={formData.email} onChange={(e) => editFormData('email', e.target.value)} placeholder="jane@example.com" style={inp} required />

            <div style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
              color: "#60a5fa",
              fontSize: 14,
            }}>
              ℹ️ You'll enter your card details securely on Tranzila's payment page
            </div>

            {errMsg ? <div style={{ marginTop: 10, color: "#ff8b8b" }}>{errMsg}</div> : null}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%", marginTop: 14, border: 0, color: "#fff",
                fontWeight: 800, fontSize: 16, padding: "14px 16px",
                borderRadius: 12, cursor: "pointer",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                opacity: status === "loading" ? 0.6 : 1
              }}
              onClick={onHandlePay}
            >
              {status === "loading" ? "Processing…" : `Pay $${sum}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: "block", margin: "10px 0 6px", color: "#dce6ff" };
const inp = { width: "100%", background: "#0e1736", color: "#fff", border: "1px solid rgba(162,179,214,.18)", padding: "12px 12px", borderRadius: 12, outline: "none", fontSize: 15 };
const hfBox = { width: "100%", color: '#fff', background: "#0e1736", border: "1px solid rgba(162,179,214,.18)", borderRadius: 12, height: 44, display: "flex", alignItems: "center", padding: "0 12px" };