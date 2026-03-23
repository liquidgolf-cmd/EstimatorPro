import { useState } from 'react'
import { Button } from '../ui/Button'
import { formatCurrency, formatDate } from '../../lib/formatters'
import type { Estimate, Payment, PaymentMethod } from '../../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'check',  label: 'Check' },
  { value: 'zelle',  label: 'Zelle' },
  { value: 'card',   label: 'Card' },
  { value: 'cash',   label: 'Cash' },
  { value: 'other',  label: 'Other' },
]

interface InvoicePanelProps {
  estimate: Estimate
  grandTotal: number
  totalPaid: number
  onAddPayment: (amount: number, method: PaymentMethod, note: string) => Promise<void>
  onDeletePayment: (paymentId: string) => Promise<void>
}

export function InvoicePanel({
  estimate,
  grandTotal,
  totalPaid,
  onAddPayment,
  onDeletePayment,
}: InvoicePanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('check')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const balanceDue = grandTotal - totalPaid
  const isPaid = estimate.status === 'paid'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    setSaving(true)
    try {
      await onAddPayment(parsed, method, note)
      setAmount('')
      setNote('')
      setMethod('check')
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(paymentId: string) {
    setDeletingId(paymentId)
    try {
      await onDeletePayment(paymentId)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-text-primary">Invoice</h2>
          {estimate.invoiceNumber && (
            <p className="text-xs text-text-muted font-mono mt-0.5">{estimate.invoiceNumber}</p>
          )}
        </div>
        <div className="text-right">
          {estimate.dueDate && (
            <p className="text-xs text-text-muted">
              Due {formatDate(estimate.dueDate)}
            </p>
          )}
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-5 py-4">
          <p className="text-xs text-text-muted mb-1">Invoice total</p>
          <p className="font-bold text-text-primary">{formatCurrency(grandTotal)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-text-muted mb-1">Paid</p>
          <p className="font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-text-muted mb-1">Balance due</p>
          <p className={`font-bold ${balanceDue > 0 ? 'text-accent' : 'text-green-600'}`}>
            {balanceDue > 0 ? formatCurrency(balanceDue) : 'Paid in full'}
          </p>
        </div>
      </div>

      {/* Payment list */}
      <div className="px-6 py-4">
        {estimate.payments.length === 0 ? (
          <p className="text-sm text-text-muted py-2">No payments recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {estimate.payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                deleting={deletingId === payment.id}
                onDelete={() => handleDelete(payment.id)}
              />
            ))}
          </div>
        )}

        {/* Add payment */}
        {!isPaid && (
          <>
            {showForm ? (
              <form onSubmit={handleSubmit} className="border border-border rounded-xl p-4 bg-bg mt-2">
                <p className="text-sm font-medium text-text-primary mb-3">Record payment</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full pl-7 pr-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-text-muted mb-1 block">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Check #1042"
                    className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-text-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={saving} className="text-sm">
                    Save payment
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                + Record payment
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PaymentRow({
  payment,
  deleting,
  onDelete,
}: {
  payment: Payment
  deleting: boolean
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{formatCurrency(payment.amount)}</p>
        <p className="text-xs text-text-muted capitalize">
          {payment.method}{payment.note ? ` · ${payment.note}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-xs text-text-faint">{formatDate(payment.receivedAt)}</p>
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              {deleting ? 'Removing…' : 'Confirm'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-text-faint hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
