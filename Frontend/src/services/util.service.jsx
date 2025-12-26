export function formatPaymentData({ expiry }) {

    const expiryMonth = expiry.split("/")[0].replace(/^0+/, '') || '0'
    const expiryYear = 20 + expiry.split("/")[1]
    return { expiryMonth, expiryYear }
}