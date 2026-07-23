'use client'
import { useEffect, useState } from 'react'
import { supabase, type Perfil } from '@/app/lib/supabase'

export function useAuth() {
  const [perfil,  setPerfil]  = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // Si no existe el perfil o está inactivo → acceso revocado
      if (!data || error || data.activo === false) {
        await supabase.auth.signOut()
        window.location.href = '/login?revocado=1'
        return
      }

      setPerfil(data)
      // Registrar última actividad
      await supabase.from('perfiles').update({ ultima_actividad: new Date().toISOString(), total_visitas: (data?.total_visitas ?? 0) + 1 }).eq('id', session.user.id)
      setLoading(false)
    }

    cargar()

    // Verificar también cuando la app vuelve al foco (PWA en segundo plano)
    const onFocus = () => cargar()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { perfil, loading, logout }
}
