import authProxy from '../lib/authProxy.jsx';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export async function handleRecurringPayment(cardNumber, expiryMonth, expiryYear, cvv, fullName) {
    console.log('🚀 Processing payment for:', fullName);
    console.log('🚀 Card ending in: ****' + cardNumber.slice(-4));
    
    // Get auth token
    const session = authProxy.getSession();
    if (!session?.access_token) {
        throw new Error('Authentication required for payment processing');
    }
    
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
    console.log("🚀 ~ handleRecurringPayment ~ response status:", response.status, "success:", response.ok && !data.error);

    if (!response.ok || data.error) {
        throw new Error(data.error || data.message || 'Payment processing failed');
    }
    
    return data;
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