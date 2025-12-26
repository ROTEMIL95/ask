import authProxy from '../lib/authProxy.jsx';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export async function handleRecurringPayment(cardNumber, expiryMonth, expiryYear, cvv, fullName) {

    // Get auth token using async method for reliability

    const session = await authProxy.getSessionAsync();
    if (!session?.access_token) {

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

        if (!response.ok || data.error || data.status === 'error') {

            return {
                data: null,
                status: 'error',
                message: data.message || data.error || 'Payment processing failed'
            };
        }


        return { data, status: 'success' };
    } catch (error) {

        return {
            data: null,
            status: 'error',
            message: error.message || 'Payment processing failed'
        };
    }
}

export async function cancelSubscription() {

    // Get auth token using async method for reliability

    const session = await authProxy.getSessionAsync();
    if (!session?.access_token) {

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


        // Check if response has content before parsing JSON
        const text = await response.text();

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {

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

            return {
                status: 'error',
                message: 'Server returned empty response. Please try again.'
            };
        }

        // Return consistent format with status field (like handleRecurringPayment)

        return {
            status: data.status || 'success',
            message: data.message || 'Subscription cancelled successfully',
            data  // Include original data for additional info
        };
    } catch (error) {

        return {
            status: 'error',
            message: error.message || 'Failed to cancel subscription'
        };
    }
}