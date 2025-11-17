import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  createHostedFields,
  chargePayment,
  setupEventListeners,
  getErrorMessage
} from "@/lib/tranzilaHostedFields";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { fullName, profile, loading: profileLoading } = useUserProfile();

  const [status, setStatus] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [fieldsReady, setFieldsReady] = useState(false);
  const [fieldValidity, setFieldValidity] = useState({
    credit_card_number: false,
    cvv: false,
    expiry: false,
    card_holder_id_number: false
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: ""
  });

  const hostedFieldsRef = useRef(null);
  const plan = searchParams.get('plan') || 'pro';
  const userId = searchParams.get('user_id');

  // Price configuration
  // Note: Tranzila expects sum as string, keep consistent format
  const sum = plan === 'pro' ? "0.1" : "19.99"; // Test amount for pro (0.1 ILS)

  // Populate user data
  useEffect(() => {
    if (authLoading || profileLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate(`/login?returnTo=/checkout&plan=${plan}&user_id=${userId}`);
      return;
    }

    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }

    const userName = fullName || user?.user_metadata?.full_name || '';
    if (userName) {
      setFormData(prev => ({ ...prev, fullName: userName }));
    }
  }, [isAuthenticated, authLoading, profileLoading, user, fullName, navigate, plan, userId]);

  // Initialize Hosted Fields (separate effect, runs only once)
  useEffect(() => {
    // Don't initialize if already initialized
    if (hostedFieldsRef.current) {
      console.log('⚠️ Hosted fields already initialized, skipping');
      return;
    }

    console.log('🔧 Initializing Tranzila Hosted Fields...');

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const hf = createHostedFields({
          fields: {
            credit_card_number: {
              selector: '#card-number',
              placeholder: '1234 5678 9012 3456',
              tabindex: 3
            },
            cvv: {
              selector: '#cvv',
              placeholder: '123',
              tabindex: 5
            },
            expiry: {
              selector: '#expiry',
              placeholder: 'MM/YY',
              tabindex: 4
            },
            card_holder_id_number: {
              selector: '#israeli-id',
              placeholder: '123456789 (Israeli ID)',
              tabindex: 6
            }
          }
        });

        hostedFieldsRef.current = hf;
        console.log('✅ Hosted fields instance stored in ref');

        // Setup event listeners
        setupEventListeners(hf, {
          onReady: () => {
            console.log('✅ Hosted fields ready');
            setFieldsReady(true);
          },
          onValidityChange: (event) => {
            console.log(`🔍 Field ${event.field} validity: ${event.isValid}`);
            setFieldValidity(prev => ({
              ...prev,
              [event.field]: event.isValid
            }));
          },
          onCardTypeChange: (event) => {
            console.log(`💳 Card type detected: ${event.cardType}`);
          }
        });

      } catch (error) {
        console.error('❌ Failed to initialize hosted fields:', error);
        setErrMsg('Failed to load payment form. Please refresh the page.');
      }
    }, 100); // Small delay for DOM to be ready

    // Cleanup
    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty deps - run only once

  function editFormData(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function onHandlePay(e) {
    console.log('🎯 onHandlePay called!');
    e.preventDefault();
    console.log('🎯 preventDefault done');

    // Validate required fields
    if (!formData.fullName || !formData.email) {
      console.warn('⚠️ Validation failed: missing name or email');
      setErrMsg('Please enter your name and email');
      setStatus("error");
      return;
    }

    // Debug: Check ref state
    console.log('🔍 hostedFieldsRef.current:', hostedFieldsRef.current);
    console.log('🔍 fieldsReady:', fieldsReady);

    if (!hostedFieldsRef.current) {
      console.error('❌ Hosted fields not initialized');
      console.error('   This usually means the fields did not load properly.');
      console.error('   Try refreshing the page.');
      setErrMsg('Payment form not initialized. Please refresh the page.');
      setStatus("error");
      return;
    }

    console.log('✅ Hosted fields ref exists!');

    console.log('✅ Validation passed, setting loading state');
    setStatus("loading");
    setErrMsg("");

    // Step 1: Create handshake token (fraud prevention)
    console.log('🤝 Step 1: Creating handshake token...');
    let handshakeToken;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Get token from Supabase session
      const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`;
      const sessionStr = localStorage.getItem(sessionKey);
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const token = session?.access_token;

      console.log('🔑 Session found:', !!session);
      console.log('🔑 Token found:', !!token);

      if (!token) {
        console.error('❌ No authentication token found');
        setErrMsg('Please log in to continue with payment');
        setStatus("error");
        return;
      }

      console.log('🤝 Creating handshake with sum:', sum, 'type:', typeof sum);

      const handshakeResponse = await fetch(`${API_URL}/payment/create-handshake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sum: sum
        })
      });

      console.log('🤝 Handshake request body:', JSON.stringify({ sum: sum }));

      const handshakeData = await handshakeResponse.json();

      if (!handshakeResponse.ok || !handshakeData.thtk) {
        console.error('❌ Handshake failed:', handshakeData);
        setErrMsg(handshakeData.message || 'Failed to initialize payment');
        setStatus("error");
        return;
      }

      handshakeToken = handshakeData.thtk;
      console.log('✅ Handshake token received!');
      console.log('   thtk:', handshakeToken);
      console.log('   thtk length:', handshakeToken?.length);
      console.log('   thtk type:', typeof handshakeToken);
      console.log('   Valid for:', handshakeData.valid_for);
      console.log('   Full handshake response:', handshakeData);

    } catch (error) {
      console.error('❌ Handshake error:', error);
      setErrMsg('Failed to initialize payment. Please try again.');
      setStatus("error");
      return;
    }

    // Step 2: Prepare payment parameters WITH handshake token
    const paymentParams = {
      terminal_name: 'fxpsharon333', // Production terminal
      amount: sum,                    // Changed from 'sum' to 'amount' (Tranzila API requirement)
      currency_code: '1',             // Changed from 'currency' to 'currency_code', 1=ILS
      tran_mode: 'A',                 // Changed from 'tranmode' to 'tran_mode', A=debit
      contact: formData.fullName,
      email: formData.email,
      pdesc: 'TalkAPI Pro Subscription',
      thtk: handshakeToken,  // ✨ Handshake token (required)
      new_process: '1'        // ✨ Required for handshake validation
    };

    console.log('💳 Step 2: Initiating payment with params:');
    console.log('   terminal_name:', paymentParams.terminal_name);
    console.log('   amount:', paymentParams.amount);
    console.log('   currency_code:', paymentParams.currency_code);
    console.log('   tran_mode:', paymentParams.tran_mode);
    console.log('   thtk:', paymentParams.thtk);
    console.log('   new_process:', paymentParams.new_process);
    console.log('   Full params:', paymentParams);
    console.log('🎯 About to call chargePayment...');

    // Step 3: Charge using hosted fields
    chargePayment(hostedFieldsRef.current, paymentParams, (err, response) => {
      console.log('🎯 CALLBACK RECEIVED!');
      console.log('  📦 Error:', err);
      console.log('  📦 Response:', response);
      console.log('  📦 Response type:', typeof response);
      console.log('  📦 Response keys:', response ? Object.keys(response) : 'null');

      // Log errors array if exists
      if (response?.errors) {
        console.log('  📦 Response.errors:', response.errors);
      }

      setStatus(false);

      // Check for error parameter
      if (err || !response) {
        console.error('❌ Payment failed - error or no response');
        setErrMsg(getErrorMessage(err) || 'No response from payment gateway');
        setStatus("error");
        return;
      }

      // Check for errors array (Tranzila Hosted Fields format)
      if (response.errors && response.errors.length > 0) {
        console.error('❌ Payment failed - errors in response:', response.errors);
        const errorMessage = response.errors.map(e => e.error_message || e.message || JSON.stringify(e)).join(', ');
        setErrMsg(errorMessage || 'Payment failed. Please check your card details.');
        setStatus("error");
        return;
      }

      // Check if transaction_response is null (means no transaction occurred)
      if (!response.transaction_response) {
        console.error('❌ Payment failed - no transaction response');
        setErrMsg('Payment failed. No transaction was created. Please check your card details.');
        setStatus("error");
        return;
      }

      // Check for error in response object (legacy format)
      if (response.err || response.error) {
        console.error('❌ Payment error in response:', response.err || response.error);
        setErrMsg(response.err || response.error || 'Payment failed');
        setStatus("error");
        return;
      }

      // Check Tranzila response code (000 = success)
      if (response.transaction_response?.Response && response.transaction_response.Response !== '000') {
        console.error('❌ Payment failed with Tranzila code:', response.transaction_response.Response);
        setErrMsg(`Payment failed. Error code: ${response.transaction_response.Response}`);
        setStatus("error");
        return;
      }

      console.log('✅ Payment successful!', response);

      // Extract transaction details from transaction_response
      const txn = response.transaction_response || {};
      const transactionId = txn.ConfirmationCode || txn.index || '';
      const orderId = txn.order_id || '';

      // Redirect to success page
      const successUrl = `/payment/success?transaction_id=${transactionId}&order_id=${orderId}`;
      console.log('🎉 Redirecting to:', successUrl);
      navigate(successUrl);
    });
  }

  // Check if all required fields are valid
  const allFieldsValid = fieldValidity.credit_card_number &&
                         fieldValidity.card_holder_id_number;

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
          ⚠️ <strong>Test Payment:</strong> This is a test. Amount: ${sum}
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

          <form onSubmit={(e) => {
            console.log('📝 Form submitted');
            onHandlePay(e);
            return false;
          }}>
            <label style={lbl}>Full name</label>
            <input
              value={formData.fullName}
              onChange={(e) => editFormData('fullName', e.target.value)}
              placeholder="Jane Doe"
              style={inp}
              tabIndex={1}
              required
            />

            <label style={lbl}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => editFormData('email', e.target.value)}
              placeholder="jane@example.com"
              style={inp}
              tabIndex={2}
              required
            />

            {/* Hosted Fields - Tranzila iframes will be injected here */}
            <label style={lbl}>Card Number</label>
            <div id="card-number" style={hfBox} className="hosted-field"></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Expiry Date</label>
                <div id="expiry" style={hfBox} className="hosted-field"></div>
              </div>
              <div>
                <label style={lbl}>CVV</label>
                <div id="cvv" style={hfBox} className="hosted-field"></div>
              </div>
            </div>

            <label style={lbl}>Israeli ID Number (תעודת זהות)</label>
            <div id="israeli-id" style={hfBox} className="hosted-field"></div>

            <div style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
              color: "#60a5fa",
              fontSize: 14,
            }}>
              ℹ️ Your card details are entered directly into Tranzila's secure fields
            </div>

            {status === "loading" && (
              <div style={{
                marginTop: 10,
                color: "#60a5fa",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: 8,
                padding: 12,
                textAlign: "center"
              }}>
                ⏳ Processing payment with Tranzila...
              </div>
            )}

            {errMsg && (
              <div style={{
                marginTop: 10,
                color: "#ff8b8b",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 8,
                padding: 12
              }}>
                {errMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !fieldsReady}
              style={{
                width: "100%", marginTop: 14, border: 0, color: "#fff",
                fontWeight: 800, fontSize: 16, padding: "14px 16px",
                borderRadius: 12, cursor: "pointer",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                opacity: (status === "loading" || !fieldsReady) ? 0.6 : 1
              }}
            >
              {status === "loading" ? "Processing…" : !fieldsReady ? "Loading…" : `Pay $${sum}`}
            </button>
          </form>
        </div>
      </div>

      {/* CSS for hosted fields */}
      <style>{`
        .hosted-field {
          transition: border-color 0.2s ease;
        }
        .hosted-field.hosted-fields-valid {
          border-color: rgba(16, 185, 129, 0.5) !important;
        }
        .hosted-field.hosted-fields-invalid {
          border-color: rgba(239, 68, 68, 0.5) !important;
        }
        .hosted-field iframe {
          border: none !important;
          width: 100% !important;
          height: 44px !important;
          max-height: 44px !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .container-for-hostedfield {
          height: 44px !important;
          max-height: 44px !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}

const lbl = { display: "block", margin: "10px 0 6px", color: "#dce6ff", fontSize: 14 };
const inp = {
  width: "100%",
  background: "#0e1736",
  color: "#fff",
  border: "1px solid rgba(162,179,214,.18)",
  padding: "12px 12px",
  borderRadius: 12,
  outline: "none",
  fontSize: 15
};
const hfBox = {
  width: "100%",
  color: '#fff',
  background: "#0e1736",
  border: "1px solid rgba(162,179,214,.18)",
  borderRadius: 12,
  height: 44,
  minHeight: 44,
  maxHeight: 44,
  display: "flex",
  alignItems: "center",
  padding: "0",
  overflow: "hidden",
  position: "relative"
};
