import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Client } from '../../types'

interface ClientStepProps {
  projectType: string
  existingClients: Client[]
  onComplete: (client: Client) => void
  onBack: () => void
  saving: boolean
  onCreateClient: (data: Omit<Client, 'id' | 'userId' | 'createdAt'>) => Promise<Client>
}

type Mode = 'search' | 'new'

export function ClientStep({
  projectType,
  existingClients,
  onComplete,
  onBack,
  saving,
  onCreateClient,
}: ClientStepProps) {
  const [mode, setMode] = useState<Mode>(existingClients.length > 0 ? 'search' : 'new')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', companyName: '', jobSiteAddress: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = existingClients.filter((c) => {
    const q = query.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.companyName?.toLowerCase().includes(q) ?? false)
    )
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.jobSiteAddress.trim()) e.jobSiteAddress = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleCreate() {
    if (!validate()) return
    setCreating(true)
    try {
      const client = await onCreateClient({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim() || undefined,
        jobSiteAddress: form.jobSiteAddress.trim(),
      })
      onComplete(client)
    } catch (err) {
      console.error('Failed to create client:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-text-muted hover:text-text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-sm text-text-muted">{projectType}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-faint">
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-sm font-medium text-text-primary">Client</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-text-primary mb-1">Who is this estimate for?</h1>
        <p className="text-sm text-text-muted mb-6">Attach a client to send, track, and invoice this estimate.</p>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-border/30 p-1 rounded-xl mb-6">
          {(['search', 'new'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === m ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {m === 'search' ? 'Existing client' : 'New client'}
            </button>
          ))}
        </div>

        {/* Search mode */}
        {mode === 'search' && (
          <div>
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-surface border border-border-mid rounded-xl text-sm text-text-primary placeholder-text-faint focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {existingClients.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-text-muted text-sm mb-3">No clients yet.</p>
                <button onClick={() => setMode('new')} className="text-accent text-sm font-medium hover:underline">
                  Create your first client →
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-8">No clients match "{query}"</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => onComplete(client)}
                    disabled={saving}
                    className="w-full text-left bg-surface border border-border rounded-xl px-4 py-4 hover:border-accent/50 hover:shadow-sm transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors">
                          {client.name}
                        </p>
                        {client.companyName && (
                          <p className="text-xs text-text-muted mt-0.5">{client.companyName}</p>
                        )}
                        <p className="text-xs text-text-muted mt-1">{client.jobSiteAddress}</p>
                      </div>
                      <div className="text-right text-xs text-text-faint ml-4">
                        <p>{client.phone}</p>
                        <p className="mt-0.5">{client.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New client form */}
        {mode === 'new' && (
          <div className="flex flex-col gap-4">
            <Input label="Full name" required error={errors.name} value={form.name}
              placeholder="Sarah Johnson" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" required error={errors.phone} value={form.phone} type="tel"
                placeholder="(801) 555-0192" onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input label="Email" required error={errors.email} value={form.email} type="email"
                placeholder="sarah@email.com" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <Input label="Company name" value={form.companyName}
              placeholder="Optional — for commercial jobs"
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
            <Input label="Job site address" required error={errors.jobSiteAddress} value={form.jobSiteAddress}
              placeholder="467 Pine Canyon Rd, Midway UT 84049"
              onChange={(e) => setForm((f) => ({ ...f, jobSiteAddress: e.target.value }))} />
            <Button onClick={handleCreate} loading={creating || saving} className="w-full mt-2">
              Create client and continue →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
