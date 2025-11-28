// components/supabase-provider.js
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const Context = createContext(undefined)

export default function SupabaseProvider({ children }) {
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Hanya redirect ke dashboard jika user baru saja login dan sedang di halaman login
      if (event === 'SIGNED_IN' && session && window.location.pathname === '/login') {
        window.location.href = '/dashboard'
      }
      // Refresh session saat berubah untuk sinkronisasi dengan server
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <Context.Provider value={{ supabase }}>
      <>{children}</>
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}