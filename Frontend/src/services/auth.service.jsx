
// Function to sanitize error messages for user display
export const sanitizeErrorMessage = (errorMessage) => {
  if (!errorMessage) return 'An unexpected error occurred'
  
  // Convert to lowercase for easier matching
  const message = errorMessage.toLowerCase()
  
  // Technical backend errors to replace
  if (message.includes('user from sub claim in jwt does not exist')) {
    return 'Authentication session expired. Please sign in again.'
  }
  
  if (message.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.'
  }
  
  if (message.includes('email not confirmed')) {
    return 'Please check your email and confirm your account before signing in.'
  }
  
  if (message.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }
  
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  
  if (message.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.'
  }
  
  if (message.includes('network error') || message.includes('fetch')) {
    return 'Connection error. Please check your internet connection and try again.'
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Session expired. Please sign in again.'
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return 'Service temporarily unavailable. Please try again later.'
  }
  
  if (message.includes('internal server error') || message.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  // Default user-friendly message for unknown errors
  return 'Something went wrong. Please try again.'
}