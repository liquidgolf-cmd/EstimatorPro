import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Client } from '../types'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (!error && data) {
      setClients(data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        companyName: row.company_name,
        jobSiteAddress: row.job_site_address,
        qboCustomerId: row.qbo_customer_id,
        createdAt: row.created_at,
      })))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchClients() }, [fetchClients])

  const createClient = async (data: Omit<Client, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated')
    const { data: row, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company_name: data.companyName,
        job_site_address: data.jobSiteAddress,
      })
      .select()
      .single()
    if (error) throw error
    const client: Client = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      companyName: row.company_name,
      jobSiteAddress: row.job_site_address,
      createdAt: row.created_at,
    }
    setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))
    return client
  }

  return { clients, loading, createClient, refetch: fetchClients }
}
