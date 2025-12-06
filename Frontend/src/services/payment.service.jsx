import authProxy from '../lib/authProxy.jsx';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export async function handleRecurringPayment(cardNumber, expiryMonth, expiryYear, cvv, fullName) {
    console.log('🚀 Processing payment for:', fullName);
    console.log('🚀 Card ending in: ****' + cardNumber.slice(-4));

    // Get auth token using async method for reliability
    console.log('🔍 [payment.service] Getting session asynchronously...');
    const session = await authProxy.getSessionAsync();
    if (!session?.access_token) {
        console.error('❌ Authentication required');
        return { data: null, status: 'error', message: 'Authentication required for payment processing' };
    }

    try {
        const response = await fetch(`${backendUrl}/payment/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                card_number: cardNumber,
                expire_month: expiryMonth,
                expire_year: expiryYear,
                cvv,
                full_name: fullName,
            })
        });

        const data = await response.json();
        console.log("🚀 ~ handleRecurringPayment ~ response status:", response.status);
        console.log("🚀 ~ handleRecurringPayment ~ response data:", data);

        if (!response.ok || data.error || data.status === 'error') {
            console.error('❌ Payment failed:', data.message || data.error);
            return {
                data: null,
                status: 'error',
                message: data.message || data.error || 'Payment processing failed'
            };
        }

        console.log('✅ Payment successful');

        // Refresh session after successful payment to ensure user data is up-to-date
        console.log('🔄 [payment.service] Refreshing session after successful payment...');
        try {
            await authProxy.refreshSession();
            console.log('✅ [payment.service] Session refreshed successfully');
        } catch (refreshError) {
            console.error('⚠️ [payment.service] Failed to refresh session (non-critical):', refreshError);
            // Don't fail the payment if session refresh fails
        }

        return { data, status: 'success' };
    } catch (error) {
        console.error('❌ Payment error:', error);
        return {
            data: null,
            status: 'error',
            message: error.message || 'Payment processing failed'
        };
    }
}

export async function cancelSubscription() {
    console.log('🚫 Cancelling subscription...');

    // Get auth token using async method for reliability
    console.log('🔍 [payment.service] Getting session asynchronously...');
    const session = await authProxy.getSessionAsync();
    if (!session?.access_token) {
        console.error('❌ Authentication required');
        return {
            status: 'error',
            message: 'Authentication required for cancellation'
        };
    }

    try {
        const response = await fetch(`${backendUrl}/payment/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        console.log("🚀 ~ cancelSubscription ~ response status:", response.status);
        console.log("🚀 ~ cancelSubscription ~ response ok:", response.ok);

        // Check if response has content before parsing JSON
        const text = await response.text();
        console.log("🚀 ~ cancelSubscription ~ response text:", text);

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            console.error('❌ Failed to parse response as JSON:', parseError);
            console.error('   Response text:', text);
            return {
                status: 'error',
                message: 'Invalid server response'
            };
        }

        if (!response.ok || data.error) {
            return {
                status: 'error',
                message: data.error || data.message || 'Failed to cancel subscription'
            };
        }

        // Check if we got an empty response (likely OPTIONS preflight)
        if (!text || Object.keys(data).length === 0) {
            console.error('❌ Received empty response - likely CORS preflight issue');
            return {
                status: 'error',
                message: 'Server returned empty response. Please try again.'
            };
        }

        // Refresh session after successful cancellation to ensure user data is up-to-date
        console.log('🔄 [payment.service] Refreshing session after successful cancellation...');
        try {
            await authProxy.refreshSession();
            console.log('✅ [payment.service] Session refreshed successfully');
        } catch (refreshError) {
            console.error('⚠️ [payment.service] Failed to refresh session (non-critical):', refreshError);
            // Don't fail the cancellation if session refresh fails
        }

        // Return consistent format with status field (like handleRecurringPayment)
        console.log('✅ Subscription cancelled successfully');
        return {
            status: data.status || 'success',
            message: data.message || 'Subscription cancelled successfully',
            data  // Include original data for additional info
        };
    } catch (error) {
        console.error('❌ Error cancelling subscription:', error);
        return {
            status: 'error',
            message: error.message || 'Failed to cancel subscription'
        };
    }
}