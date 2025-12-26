export function formatPaymentData({ expiry }) {

    const expiryMonth = expiry.split("/")[0].replace(/^0+/, '') || '0'
    const expiryYear = expiry.split("/")[1]
    return { expiryMonth, expiryYear }
}