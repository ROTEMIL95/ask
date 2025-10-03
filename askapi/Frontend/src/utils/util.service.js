export function formatPaymentData({ expiry }) {
    console.log("🚀 ~ formatPaymentData ~ expiryYear, expiryMonth, cvv, fullName:", expiry)
    const expiryMonth = expiry.split("/")[0].replace(/^0+/, '') || '0'
    const expiryYear = expiry.split("/")[1]
    return { expiryMonth, expiryYear }
}