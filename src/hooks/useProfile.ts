import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../types'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({
        id: data.id,
        businessName: data.business_name,
        phone: data.phone,
        email: data.email,
        updatedAt: data.updated_at,
      })
    } else {
      // Profile doesn't exist yet — create it
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email ?? '' })
        .select()
        .single()
      if (newProfile) {
        setProfile({
          id: newProfile.id,
          businessName: newProfile.business_name,
          phone: newProfile.phone,
          email: newProfile.email,
          updatedAt: newProfile.updated_at,
        })
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const updateProfile = async (updates: Partial<Pick<Profile, 'businessName' | 'phone' | 'email'>>) => {
    if (!user) return
    const dbUpdates: Record<string, string> = {}
    if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.email !== undefined) dbUpdates.email = updates.email

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile((p) => p ? {
        ...p,
        ...updates,
        updatedAt: data.updated_at,
      } : p)
    }
  }

  return { profile, loading, updateProfile }
}
