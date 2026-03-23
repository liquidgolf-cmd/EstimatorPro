import type { EstimateStatus } from '../../types'

const STATUS_CONFIG: Record<EstimateStatus, {
  label: string
  color: string
  bg: string
  border: string
}> = {
  draft:    { label: 'Draft',    color: '#8a7968', bg: '#f0ebe4', border: '#d9d0c5' },
  sent:     { label: 'Sent',     color: '#1d6fba', bg: '#e8f2fb', border: '#b5d4f0' },
  approved: { label: 'Approved', color: '#166534', bg: '#dcfce7', border: '#86efac' },
  declined: { label: 'Declined', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
  invoiced: { label: 'Invoiced', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  paid:     { label: 'Paid',     color: '#14532d', bg: '#bbf7d0', border: '#4ade80' },
}

export function StatusBadge({ status }: { status: EstimateStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  )
}
