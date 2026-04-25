import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = carregando
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      return
    }

    // Perfil não existe (trigger não disparou) — cria como fallback
    if (error?.code === 'PGRST116') {
      const { data: { user } } = await supabase.auth.getUser()
      const nome =
        user?.user_metadata?.nome ??
        user?.email?.split('@')[0] ??
        'Usuário'
      const { data: novo } = await supabase
        .from('profiles')
        .insert({ id: userId, nome, papel: 'membro' })
        .select()
        .single()
      setProfile(novo)
    }
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function register(email, password, nome) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading: session === undefined,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
