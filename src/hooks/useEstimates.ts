import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Estimate } from '../types'

export function useEstimates() {
  const { user } = useAuth()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEstimates = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          client:clients(*),
          line_items(*),
          payments(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map snake_case DB fields to camelCase
      const mapped: Estimate[] = (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        clientId: row.client_id,
        client: row.client ? {
          id: row.client.id,
          userId: row.client.user_id,
          name: row.client.name,
          phone: row.client.phone,
          email: row.client.email,
          companyName: row.client.company_name,
          jobSiteAddress: row.client.job_site_address,
          qboCustomerId: row.client.qbo_customer_id,
          createdAt: row.client.created_at,
        } : undefined,
        title: row.title,
        projectType: row.project_type,
        status: row.status,
        estimateNumber: row.estimate_number,
        invoiceNumber: row.invoice_number,
        pricingMode: row.pricing_mode,
        profitMargin: row.profit_margin,
        overheadItems: row.overhead_items ?? [],
        lineItems: (row.line_items ?? []).map((li: any) => ({
          id: li.id,
          estimateId: li.estimate_id,
          category: li.category,
          description: li.description,
          qty: li.qty,
          unit: li.unit,
          matPerUnit: li.mat_per_unit,
          hours: li.hours,
          ratePerHr: li.rate_per_hr,
          sortOrder: li.sort_order,
        })),
        payments: (row.payments ?? []).map((p: any) => ({
          id: p.id,
          estimateId: p.estimate_id,
          amount: p.amount,
          method: p.method,
          receivedAt: p.received_at,
          note: p.note,
          qboPaymentId: p.qbo_payment_id,
          createdAt: p.created_at,
        })),
        sentAt: row.sent_at,
        approvedAt: row.approved_at,
        invoicedAt: row.invoiced_at,
        dueDate: row.due_date,
        qboInvoiceId: row.qbo_invoice_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setEstimates(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load estimates')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchEstimates()
  }, [fetchEstimates])

  return { estimates, loading, error, refetch: fetchEstimates }
}
