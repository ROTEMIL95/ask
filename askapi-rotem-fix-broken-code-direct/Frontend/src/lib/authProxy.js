import { supabase, auth } from './supabase'

const authProxy = {
  getSession: () => {
    // Get session from localStorage (Supabase stores it there)
    const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    const sessionStr = localStorage.getItem(sessionKey)
    console.log("🚀 ~ sessionStr:", sessionStr)
    return sessionStr ? JSON.parse(sessionStr) : null
  },

  getUser: () => {
    const session = authProxy.getSession()
    return session?.user || null
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