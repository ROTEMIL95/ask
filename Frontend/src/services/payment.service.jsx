import authProxy from '../lib/authProxy.jsx';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export async function handleRecurringPayment(cardNumber, expiryMonth, expiryYear, cvv, fullName) {
    console.log('🚀 Processing payment for:', fullName);
    console.log('🚀 Card ending in: ****' + cardNumber.slice(-4));

    // Get auth token
    const session = authProxy.getSession();
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
    
    // Get auth token
    const session = authProxy.getSession();
    if (!session?.access_token) {
        throw new Error('Authentication required for cancellation');
    }
    
    try {
        const response = await fetch(`${backendUrl}/payment/cancel`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        const data = await response.json();
        console.log("🚀 ~ cancelSubscription ~ response status:", response.status);

        if (!response.ok || data.error) {
            throw new Error(data.error || data.message || 'Failed to cancel subscription');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error cancelling subscription:', error);
        throw error;
    }
}