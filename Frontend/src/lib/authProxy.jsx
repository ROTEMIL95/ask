import { supabase, auth } from './supabase.jsx'

const authProxy = {
  // Synchronous method - for backward compatibility
  // WARNING: May return null if session not loaded yet after page refresh
  getSession: () => {
    // Get session from localStorage (Supabase stores it there)
    const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    const sessionStr = localStorage.getItem(sessionKey)
    console.log("🚀 ~ sessionStr:", sessionStr)
    return sessionStr ? JSON.parse(sessionStr) : null
  },

  // Asynchronous method - RECOMMENDED for reliable session retrieval
  // Use this method to avoid issues with page refresh, tab switching, etc.
  getSessionAsync: async () => {
    try {
      console.log("🔍 [authProxy] Getting session asynchronously from Supabase...")
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ [authProxy] Error getting session:", error)
        return null
      }

      if (!session) {
        console.log("⚠️ [authProxy] No active session found")
        return null
      }

      console.log("✅ [authProxy] Session retrieved successfully")
      return session
    } catch (err) {
      console.error("❌ [authProxy] Exception in getSessionAsync:", err)
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
      console.log("🔍 [authProxy] Getting user asynchronously from Supabase...")
      const session = await authProxy.getSessionAsync()

      if (!session) {
        console.log("⚠️ [authProxy] No session, cannot get user")
        return null
      }

      console.log("✅ [authProxy] User retrieved successfully:", session.user?.email)
      return session.user
    } catch (err) {
      console.error("❌ [authProxy] Exception in getUserAsync:", err)
      return null
    }
  },

  // Refresh the current session to get updated user data
  // Useful after profile updates, payments, etc.
  refreshSession: async () => {
    try {
      console.log("🔄 [authProxy] Refreshing session...")
      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("❌ [authProxy] Error refreshing session:", error)
        return { session: null, error }
      }

      console.log("✅ [authProxy] Session refreshed successfully")
      return { session, error: null }
    } catch (err) {
      console.error("❌ [authProxy] Exception in refreshSession:", err)
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