import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [qboConnected, setQboConnected] = useState(false)
  const [qboLoading, setQboLoading] = useState(true)
  const [banner, setBanner] = useState<'connected' | 'error' | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    const qboParam = searchParams.get('qbo')
    if (qboParam === 'connected') setBanner('connected')
    if (qboParam === 'error') setBanner('error')
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    async function checkQbo() {
      const { data } = await supabase
        .from('qbo_tokens')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle()
      setQboConnected(!!data)
      setQboLoading(false)
    }
    checkQbo()
  }, [user])

  async function handleQboConnect() {
    window.location.href = `/api/qbo-auth?userId=${user?.id}`
  }

  async function handleQboDisconnect() {
    if (!user) return
    setDisconnecting(true)
    await supabase.from('qbo_tokens').delete().eq('user_id', user.id)
    setQboConnected(false)
    setDisconnecting(false)
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="font-bold text-text-primary">Settings</h1>
        </div>
        <span className="text-sm text-text-muted hidden sm:block">{user?.email}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* QBO banner */}
        {banner === 'connected' && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>QuickBooks Online connected successfully.</span>
            <button onClick={() => setBanner(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
          </div>
        )}
        {banner === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>QuickBooks connection failed. Please try again.</span>
            <button onClick={() => setBanner(null)} className="text-red-600 hover:text-red-800 ml-4">✕</button>
          </div>
        )}

        {/* Account section */}
        <section className="bg-surface border border-border rounded-xl divide-y divide-border">
          <div className="px-6 py-4">
            <h2 className="font-semibold text-text-primary mb-0.5">Account</h2>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
          <div className="px-6 py-4">
            <Button variant="ghost" onClick={signOut} className="text-sm text-red-600 hover:text-red-700">
              Sign out
            </Button>
          </div>
        </section>

        {/* QuickBooks section */}
        <section className="bg-surface border border-border rounded-xl">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">QuickBooks Online</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Sync customers, invoices, and payments to QuickBooks automatically.
            </p>
          </div>
          <div className="px-6 py-5">
            {qboLoading ? (
              <div className="h-8 w-40 bg-border rounded-lg animate-pulse" />
            ) : qboConnected ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span className="text-sm font-medium text-text-primary">Connected</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleQboDisconnect}
                  loading={disconnecting}
                  className="text-sm text-text-muted hover:text-red-600"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={handleQboConnect} variant="secondary" className="text-sm">
                Connect QuickBooks
              </Button>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}
