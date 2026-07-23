import { createBrowserClient } from '@supabase/ssr'

export type Perfil = {
  id: string
  nombre: string
  rol: 'admin' | 'director' | 'operativo'
  udn: string | null
  password_changed?: boolean
}

let _client: ReturnType<typeof createBrowserClient> | null = null

export const getSupabase = () => {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// Compatibilidad legacy
export const supabase = typeof window !== 'undefined' ? getSupabase() : null as any
