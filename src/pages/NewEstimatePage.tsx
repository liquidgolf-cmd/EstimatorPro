import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useClients } from '../hooks/useClients'
import { PROJECT_TYPES, DEFAULT_OVERHEAD_ITEMS } from '../lib/constants'
import { generateEstimateNumber } from '../lib/formatters'
import { ClientStep } from '../components/clients/ClientStep'
import type { Client, ProjectType } from '../types'

type Step = 'type' | 'client'

export function NewEstimatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { clients, createClient } = useClients()
  const [step, setStep] = useState<Step>('type')
  const [projectType, setProjectType] = useState<ProjectType | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleClientComplete(client: Client) {
    if (!user || !projectType) return
    setSaving(true)
    try {
      const pt = PROJECT_TYPES.find((p) => p.value === projectType)
      // Count estimates with a lightweight query — no joins
      const { count } = await supabase
        .from('estimates')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      const estimateNumber = generateEstimateNumber((count ?? 0) + 1)
      const title = `${pt?.label ?? 'Estimate'} — ${client.name}`

      const { data, error } = await supabase
        .from('estimates')
        .insert({
          user_id: user.id,
          client_id: client.id,
          title,
          project_type: projectType,
          status: 'draft',
          estimate_number: estimateNumber,
          pricing_mode: 'oh_profit',
          profit_margin: 15,
          overhead_items: DEFAULT_OVERHEAD_ITEMS,
        })
        .select()
        .single()

      if (error) throw error
      navigate(`/estimates/${data.id}`)
    } catch (err: any) {
      console.error('Failed to create estimate:', err)
      setSaveError(err?.message ?? 'Failed to create estimate. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'client' && projectType) {
    return (
      <ClientStep
        projectType={PROJECT_TYPES.find((p) => p.value === projectType)?.label ?? ''}
        existingClients={clients}
        onComplete={handleClientComplete}
        onBack={() => setStep('type')}
        saving={saving}
        saveError={saveError}
        onCreateClient={createClient}
      />
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-8 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="1.5"/>
              <path d="M12 11v6M9 14h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">New Estimate</h1>
          <p className="text-sm text-text-muted mt-1">Choose a project type to get started</p>
        </div>

        {/* Project type list */}
        <div className="flex flex-col gap-3">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => { setProjectType(pt.value as ProjectType); setStep('client') }}
              className="w-full text-left bg-surface border border-border rounded-xl px-5 py-4 hover:border-accent/50 hover:shadow-sm transition-all group flex items-center gap-4"
            >
              <span className="text-2xl">{pt.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {pt.label}
                </p>
                <p className="text-sm text-text-muted">{pt.description}</p>
              </div>
              <svg className="text-text-faint group-hover:text-accent transition-colors" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
