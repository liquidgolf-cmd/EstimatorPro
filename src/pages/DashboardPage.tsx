import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="font-bold text-text-primary">The Estimator</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-muted">Session 1 complete. Auth is working.</p>
      </main>
    </div>
  )
}
