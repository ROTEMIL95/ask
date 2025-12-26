import { supabase, auth } from './supabase.jsx'

const authProxy = {
  // Synchronous method - for backward compatibility
  // WARNING: May return null if session not loaded yet after page refresh
  getSession: () => {
    // Get session from localStorage (Supabase stores it there)
    const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    const sessionStr = localStorage.getItem(sessionKey)

    return sessionStr ? JSON.parse(sessionStr) : null
  },

  // Asynchronous method - RECOMMENDED for reliable session retrieval
  // Use this method to avoid issues with page refresh, tab switching, etc.
  getSessionAsync: async () => {
    try {

      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {

        return null
      }

      if (!session) {

        return null
      }


      return session
    } catch (err) {

      return null
    }
  },

  // Synchronous method - for backward compatibility
  // WARNING: May return null if session not loaded yet after page refresh
  getUser: () => {
    const session = authProxy.getSession()
    return session?.user || null
  },

  // Asynchronous method - RECOMMENDED for reliable user retrieval
  // Use this method to avoid issues with page refresh, tab switching, etc.
  getUserAsync: async () => {
    try {

      const session = await authProxy.getSessionAsync()

      if (!session) {

        return null
      }


      return session.user
    } catch (err) {

      return null
    }
  },

  // Refresh the current session to get updated user data
  // Useful after profile updates, payments, etc.
  refreshSession: async () => {
    try {

      // First try to get the current session
      const { data: { session: currentSession }, error: getError } = await supabase.auth.getSession()

      if (getError || !currentSession) {

        return { session: null, error: getError || new Error("No active session") }
      }

      // Refresh using the refresh token
      const { data: { session }, error } = await supabase.auth.refreshSession({
        refresh_token: currentSession.refresh_token
      })

      if (error) {

        // If refresh fails, return the current session instead of null

        return { session: currentSession, error }
      }


      return { session, error: null }
    } catch (err) {

      // Try to return current session as fallback
      try {
        const { data: { session: fallbackSession } } = await supabase.auth.getSession()
        if (fallbackSession) {

          return { session: fallbackSession, error: err }
        }
      } catch (fallbackErr) {

      }

      return { session: null, error: err }
    }
  },

  signUp: async (email, password, name) => {
    return await auth.signUp(email, password, name)
  },

  signIn: async (email, password) => {
    const result = await auth.signIn(email, password)
    // Force a session refresh after successful sign in

    if (result.data?.session) {
      const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
      localStorage.setItem(sessionKey, JSON.stringify(result.data.session))
    }
    return result
  },

  signOut: async () => {
    return await auth.signOut()
  }
}

export default authProxy