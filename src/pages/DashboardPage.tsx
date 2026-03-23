import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEstimates } from '../hooks/useEstimates'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatCurrency, formatDate } from '../lib/formatters'
import type { EstimateStatus, Estimate } from '../types'

const STATUS_TABS: { label: string; value: EstimateStatus | 'all' }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Draft',    value: 'draft' },
  { label: 'Sent',     value: 'sent' },
  { label: 'Approved', value: 'approved' },
  { label: 'Invoiced', value: 'invoiced' },
  { label: 'Paid',     value: 'paid' },
]

function computeGrandTotal(estimate: Estimate): number {
  const subtotal = estimate.lineItems.reduce((sum, li) => {
    const mat = li.qty * li.matPerUnit
    const labor = li.qty * li.hours * li.ratePerHr
    return sum + mat + labor
  }, 0)
  const overhead = estimate.overheadItems
    .filter((o) => o.enabled)
    .reduce((sum, o) => sum + subtotal * (o.rate / 100), 0)
  const withOverhead = subtotal + overhead
  return withOverhead * (1 + estimate.profitMargin / 100)
}

function computeTotalPaid(estimate: Estimate): number {
  return estimate.payments.reduce((sum, p) => sum + p.amount, 0)
}

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const { estimates, loading } = useEstimates()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<EstimateStatus | 'all'>('all')

  const filtered = activeTab === 'all'
    ? estimates
    : estimates.filter((e) => e.status === activeTab)

  // Summary stats
  const totalQuoted = estimates
    .filter((e) => !['declined'].includes(e.status))
    .reduce((sum, e) => sum + computeGrandTotal(e), 0)

  const totalInvoiced = estimates
    .filter((e) => ['invoiced', 'paid'].includes(e.status))
    .reduce((sum, e) => sum + computeGrandTotal(e), 0)

  const totalOutstanding = estimates
    .filter((e) => e.status === 'invoiced')
    .reduce((sum, e) => sum + (computeGrandTotal(e) - computeTotalPaid(e)), 0)

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="font-bold text-text-primary">The Estimator</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <span className="text-sm text-text-muted hidden sm:block">{user?.email}</span>
          <Button variant="ghost" onClick={signOut} className="text-sm">
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Estimates</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {estimates.length} total
            </p>
          </div>
          <Button onClick={() => navigate('/estimates/new')}>
            + New Estimate
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <SummaryCard
            label="Total quoted"
            value={formatCurrency(totalQuoted)}
            sub={`${estimates.filter(e => e.status !== 'declined').length} active estimates`}
          />
          <SummaryCard
            label="Total invoiced"
            value={formatCurrency(totalInvoiced)}
            sub={`${estimates.filter(e => ['invoiced','paid'].includes(e.status)).length} invoices`}
          />
          <SummaryCard
            label="Outstanding"
            value={formatCurrency(totalOutstanding)}
            highlight={totalOutstanding > 0}
            sub={`${estimates.filter(e => e.status === 'invoiced').length} unpaid invoices`}
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mb-4 bg-surface border border-border rounded-xl p-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === 'all'
              ? estimates.length
              : estimates.filter((e) => e.status === tab.value).length
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.value
                    ? 'bg-bg text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value
                      ? 'bg-accent/15 text-accent'
                      : 'bg-black/5 text-text-faint'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Estimate list */}
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasEstimates={estimates.length > 0}
            onNew={() => navigate('/estimates/new')}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((estimate) => (
              <EstimateRow
                key={estimate.id}
                estimate={estimate}
                grandTotal={computeGrandTotal(estimate)}
                totalPaid={computeTotalPaid(estimate)}
                onClick={() => navigate(`/estimates/${estimate.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl font-bold ${highlight ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </p>
      <p className="text-xs text-text-faint mt-1">{sub}</p>
    </div>
  )
}

function EstimateRow({
  estimate,
  grandTotal,
  totalPaid,
  onClick,
}: {
  estimate: Estimate
  grandTotal: number
  totalPaid: number
  onClick: () => void
}) {
  const balanceDue = grandTotal - totalPaid
  const showBalance = ['invoiced'].includes(estimate.status) && balanceDue > 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-xl px-5 py-4 hover:border-accent/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-text-primary text-sm group-hover:text-accent transition-colors truncate">
              {estimate.title}
            </span>
            <StatusBadge status={estimate.status} />
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="font-mono">{estimate.estimateNumber}</span>
            {estimate.client && (
              <>
                <span className="text-text-faint">·</span>
                <span>{estimate.client.name}</span>
              </>
            )}
            {estimate.client?.jobSiteAddress && (
              <>
                <span className="text-text-faint hidden sm:inline">·</span>
                <span className="truncate hidden sm:inline max-w-[200px]">
                  {estimate.client.jobSiteAddress}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="text-right shrink-0">
          <p className="font-bold text-text-primary text-sm">
            {formatCurrency(grandTotal)}
          </p>
          {showBalance && (
            <p className="text-xs text-accent mt-0.5">
              {formatCurrency(balanceDue)} due
            </p>
          )}
          {estimate.status === 'paid' && (
            <p className="text-xs text-green-600 mt-0.5">Paid in full</p>
          )}
          <p className="text-xs text-text-faint mt-1">
            {formatDate(estimate.updatedAt)}
          </p>
        </div>
      </div>
    </button>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl px-5 py-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-48 bg-border rounded mb-2" />
              <div className="h-3 w-32 bg-border rounded" />
            </div>
            <div className="h-5 w-20 bg-border rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  hasEstimates,
  onNew,
}: {
  hasEstimates: boolean
  onNew: () => void
}) {
  return (
    <div className="text-center py-16 bg-surface border border-border rounded-xl">
      <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#8a7968" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="#8a7968" strokeWidth="1.5"/>
          <path d="M9 12h6M9 16h4" stroke="#8a7968" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="font-semibold text-text-primary mb-1">
        {hasEstimates ? 'No estimates match this filter' : 'No estimates yet'}
      </p>
      <p className="text-sm text-text-muted mb-6">
        {hasEstimates
          ? 'Try a different status tab'
          : 'Create your first estimate to get started'}
      </p>
      {!hasEstimates && (
        <Button onClick={onNew}>+ New Estimate</Button>
      )}
    </div>
  )
}
