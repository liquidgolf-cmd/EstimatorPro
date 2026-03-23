import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePriceSheet } from '../hooks/usePriceSheet'
import { computeTotals, computeLineItemTotal } from '../lib/calculations'
import { formatCurrency, generateInvoiceNumber } from '../lib/formatters'
import { CATEGORY_COLORS, UNIT_OPTIONS } from '../lib/constants'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { InvoicePanel } from '../components/invoice/InvoicePanel'
import type { Estimate, LineItem, EstimateStatus, PricingMode, PriceSheetItem, PaymentMethod } from '../types'

export function EstimatePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items: priceSheet } = usePriceSheet()

  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchEstimate = useCallback(async () => {
    if (!id || !user) return
    const { data, error } = await supabase
      .from('estimates')
      .select(`*, client:clients(*), line_items(*), payments(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) { navigate('/dashboard'); return }

    setEstimate({
      id: data.id,
      userId: data.user_id,
      clientId: data.client_id,
      client: data.client ? {
        id: data.client.id, userId: data.client.user_id,
        name: data.client.name, phone: data.client.phone,
        email: data.client.email, companyName: data.client.company_name,
        jobSiteAddress: data.client.job_site_address,
        qboCustomerId: data.client.qbo_customer_id, createdAt: data.client.created_at,
      } : undefined,
      title: data.title,
      projectType: data.project_type,
      status: data.status,
      estimateNumber: data.estimate_number,
      invoiceNumber: data.invoice_number,
      pricingMode: data.pricing_mode,
      profitMargin: data.profit_margin,
      overheadItems: data.overhead_items ?? [],
      lineItems: (data.line_items ?? [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((li: any) => ({
          id: li.id, estimateId: li.estimate_id, category: li.category,
          description: li.description, qty: li.qty, unit: li.unit,
          matPerUnit: li.mat_per_unit, hours: li.hours, ratePerHr: li.rate_per_hr,
          sortOrder: li.sort_order,
        })),
      payments: (data.payments ?? []).map((p: any) => ({
        id: p.id, estimateId: p.estimate_id, amount: p.amount,
        method: p.method, receivedAt: p.received_at, note: p.note,
        qboPaymentId: p.qbo_payment_id, createdAt: p.created_at,
      })),
      sentAt: data.sent_at, approvedAt: data.approved_at,
      invoicedAt: data.invoiced_at, dueDate: data.due_date,
      qboInvoiceId: data.qbo_invoice_id,
      createdAt: data.created_at, updatedAt: data.updated_at,
    })
    setLoading(false)
  }, [id, user, navigate])

  useEffect(() => { fetchEstimate() }, [fetchEstimate])

  async function saveField(fields: Record<string, unknown>) {
    if (!id) return
    setSaving(true)
    await supabase.from('estimates').update(fields).eq('id', id)
    setSaving(false)
  }

  async function addLineItem(item: PriceSheetItem, category: string) {
    if (!id || !estimate) return
    const sortOrder = estimate.lineItems.filter((li) => li.category === category).length
    const { data, error } = await supabase
      .from('line_items')
      .insert({
        estimate_id: id,
        category,
        description: item.description,
        qty: item.defaultQty,
        unit: item.unit,
        mat_per_unit: item.matPerUnit,
        hours: item.hours,
        rate_per_hr: item.ratePerHr,
        sort_order: sortOrder,
      })
      .select()
      .single()
    if (error || !data) return
    const newItem: LineItem = {
      id: data.id, estimateId: data.estimate_id, category: data.category,
      description: data.description, qty: data.qty, unit: data.unit,
      matPerUnit: data.mat_per_unit, hours: data.hours, ratePerHr: data.rate_per_hr,
      sortOrder: data.sort_order,
    }
    setEstimate((e) => e ? { ...e, lineItems: [...e.lineItems, newItem] } : e)
  }

  async function updateLineItem(itemId: string, field: keyof LineItem, value: number | string) {
    setEstimate((e) => {
      if (!e) return e
      return { ...e, lineItems: e.lineItems.map((li) => li.id === itemId ? { ...li, [field]: value } : li) }
    })
    const dbField: Record<string, string> = {
      qty: 'qty', matPerUnit: 'mat_per_unit', hours: 'hours', ratePerHr: 'rate_per_hr',
      unit: 'unit', description: 'description',
    }
    if (dbField[field as string]) {
      await supabase.from('line_items').update({ [dbField[field as string]]: value }).eq('id', itemId)
    }
  }

  async function deleteLineItem(itemId: string) {
    await supabase.from('line_items').delete().eq('id', itemId)
    setEstimate((e) => e ? { ...e, lineItems: e.lineItems.filter((li) => li.id !== itemId) } : e)
  }

  async function convertToInvoice() {
    if (!estimate) return
    // Count all invoices for this user to generate the invoice number
    const { count } = await supabase
      .from('estimates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .not('invoice_number', 'is', null)
    const invoiceNum = generateInvoiceNumber((count ?? 0) + 1)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)
    const dueDateStr = dueDate.toISOString().split('T')[0]
    const fields = {
      status: 'invoiced' as EstimateStatus,
      invoice_number: invoiceNum,
      invoiced_at: new Date().toISOString(),
      due_date: dueDateStr,
    }
    setEstimate((e) => e ? { ...e, status: 'invoiced', invoiceNumber: invoiceNum, invoicedAt: fields.invoiced_at, dueDate: dueDateStr } : e)
    await supabase.from('estimates').update(fields).eq('id', id!)
    // Fire-and-forget QBO invoice push
    if (estimate.client?.qboCustomerId) {
      fetch('/api/qbo-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, type: 'invoice', estimateId: id }),
      }).catch(console.error)
    }
  }

  async function handleAddPayment(amount: number, method: PaymentMethod, note: string) {
    if (!id || !estimate) return
    const { data, error } = await supabase
      .from('payments')
      .insert({
        estimate_id: id,
        amount,
        method,
        note: note || null,
        received_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error || !data) return
    const newPayment = {
      id: data.id, estimateId: data.estimate_id, amount: data.amount,
      method: data.method, receivedAt: data.received_at, note: data.note,
      qboPaymentId: data.qbo_payment_id, createdAt: data.created_at,
    }
    const updatedPayments = [...estimate.payments, newPayment]
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
    const grandTotal = computeTotals(estimate).grandTotal
    // Auto-flip to paid if balance cleared
    const newStatus = totalPaid >= grandTotal ? ('paid' as EstimateStatus) : estimate.status
    if (newStatus === 'paid') {
      await supabase.from('estimates').update({ status: 'paid' }).eq('id', id)
    }
    setEstimate((e) => e ? { ...e, payments: updatedPayments, status: newStatus } : e)
    // Fire-and-forget QBO payment push
    fetch('/api/qbo-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user!.id, type: 'payment', paymentId: data.id, estimateId: id }),
    }).catch(console.error)
  }

  async function handleDeletePayment(paymentId: string) {
    await supabase.from('payments').delete().eq('id', paymentId)
    setEstimate((e) => e ? { ...e, payments: e.payments.filter((p) => p.id !== paymentId) } : e)
  }

  async function updateStatus(status: EstimateStatus) {
    if (status === 'invoiced') {
      await convertToInvoice()
      return
    }
    setEstimate((e) => e ? { ...e, status } : e)
    await saveField({ status })
    // Push QBO customer when approved
    if (status === 'approved' && estimate?.client) {
      fetch('/api/qbo-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, type: 'customer', clientId: estimate.client.id }),
      }).catch(console.error)
    }
  }

  async function updatePricingMode(pricingMode: PricingMode) {
    setEstimate((e) => e ? { ...e, pricingMode } : e)
    await saveField({ pricing_mode: pricingMode })
  }

  function updateProfitMargin(profitMargin: number) {
    setEstimate((e) => e ? { ...e, profitMargin } : e)
  }

  async function saveProfitMargin(profitMargin: number) {
    await saveField({ profit_margin: profitMargin })
  }

  async function toggleOverhead(key: string, enabled: boolean) {
    if (!estimate) return
    const updated = estimate.overheadItems.map((o) => o.key === key ? { ...o, enabled } : o)
    setEstimate((e) => e ? { ...e, overheadItems: updated } : e)
    await saveField({ overhead_items: updated })
  }

  if (loading || !estimate) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    )
  }

  const totals = computeTotals(estimate)
  const categories = [...new Set(estimate.lineItems.map((li) => li.category))]

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Top bar */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text-primary transition-colors">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="font-semibold text-text-primary text-sm truncate max-w-[200px] sm:max-w-none">
            {estimate.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-faint hidden sm:block">
            {estimate.lineItems.length} items · {Math.round(totals.totalHours)}h
          </span>
          {saving && <span className="text-xs text-text-faint">Saving...</span>}
          <StatusDropdown status={estimate.status} onChange={updateStatus} />
        </div>
      </header>

      {/* Client header */}
      {estimate.client && (
        <div className="bg-surface border-b border-border px-5 py-3">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-xs font-bold text-text-muted">
                {estimate.client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-text-primary">{estimate.client.name}</p>
                <p className="text-xs text-text-muted">{estimate.client.jobSiteAddress}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-text-faint">{estimate.client.phone}</p>
              <p className="text-xs text-text-faint">{estimate.client.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Materials', value: totals.materialsCost, color: 'text-blue-600' },
            { label: 'Labor',     value: totals.laborCost,     color: 'text-amber-600' },
            { label: 'Overhead',  value: totals.overheadAmount, color: 'text-pink-600' },
            { label: 'Total',     value: totals.grandTotal,    color: 'text-accent' },
          ].map((card) => (
            <div key={card.label} className="bg-surface border border-border rounded-xl px-4 py-3">
              <p className="text-xs text-text-muted mb-1">{card.label}</p>
              <p className={`text-lg font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
            </div>
          ))}
        </div>

        {/* Line items by category */}
        <div className="flex flex-col gap-4 mb-6">
          {categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              lineItems={estimate.lineItems.filter((li) => li.category === category)}
              priceSheet={priceSheet}
              onAddItem={(item) => addLineItem(item, category)}
              onUpdateItem={updateLineItem}
              onDeleteItem={deleteLineItem}
            />
          ))}

          {/* Add category */}
          <AddCategoryButton
            existingCategories={categories}
            onAdd={async (cat) => {
              const psItem = priceSheet.find((i) => i.category === cat)
              if (psItem) {
                await addLineItem(psItem, cat)
              } else {
                // Create a blank line item for the new category
                const { data } = await supabase.from('line_items').insert({
                  estimate_id: id,
                  category: cat,
                  description: 'New item',
                  qty: 1, unit: 'LS', mat_per_unit: 0, hours: 0, rate_per_hr: 0, sort_order: 0,
                }).select().single()
                if (data) {
                  const newItem: LineItem = {
                    id: data.id, estimateId: data.estimate_id, category: data.category,
                    description: data.description, qty: data.qty, unit: data.unit,
                    matPerUnit: data.mat_per_unit, hours: data.hours, ratePerHr: data.rate_per_hr,
                    sortOrder: data.sort_order,
                  }
                  setEstimate((e) => e ? { ...e, lineItems: [...e.lineItems, newItem] } : e)
                }
              }
            }}
          />
        </div>

        {/* Invoice panel */}
        {(estimate.status === 'invoiced' || estimate.status === 'paid') && (
          <div className="mb-6">
            <InvoicePanel
              estimate={estimate}
              grandTotal={totals.grandTotal}
              totalPaid={totals.totalPaid}
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
            />
          </div>
        )}

        {/* Pricing strategy + overhead */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Pricing strategy */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-xs font-medium text-text-mid uppercase tracking-wider mb-3">Pricing strategy</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {([
                { value: 'simple_markup', label: 'Simple markup' },
                { value: 'hourly_mat',    label: 'Hourly + mat' },
                { value: 'oh_profit',     label: 'OH + Profit' },
              ] as { value: PricingMode; label: string }[]).map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => updatePricingMode(mode.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    estimate.pricingMode === mode.value
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg text-text-mid border-border hover:border-accent/50'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-text-muted">Profit</label>
              <input
                type="number"
                min={0}
                max={100}
                value={estimate.profitMargin}
                onChange={(e) => updateProfitMargin(Number(e.target.value))}
                onBlur={(e) => saveProfitMargin(Number(e.target.value))}
                className="w-16 px-2 py-1.5 bg-bg border border-border-mid rounded-lg text-sm text-text-primary text-center focus:outline-none focus:border-accent"
              />
              <span className="text-sm text-text-muted">%</span>
            </div>
          </div>

          {/* Overhead toggles */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-xs font-medium text-text-mid uppercase tracking-wider mb-3">Overhead & hidden costs</p>
            <div className="flex flex-col gap-3">
              {estimate.overheadItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Toggle
                      enabled={item.enabled}
                      onChange={(v) => toggleOverhead(item.key, v)}
                    />
                    <span className={`text-sm ${item.enabled ? 'text-text-primary' : 'text-text-faint'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm text-text-muted">{item.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-5 py-4 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-text-muted">Subtotal</p>
              <p className="text-sm font-semibold text-text-primary">{formatCurrency(totals.subtotal)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Overhead</p>
              <p className="text-sm font-semibold text-pink-600">{formatCurrency(totals.overheadAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Margin</p>
              <p className="text-sm font-semibold text-green-600">{totals.marginPercent.toFixed(1)}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Grand total</p>
            <p className="text-xl font-bold text-accent">{formatCurrency(totals.grandTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

function StatusDropdown({ status, onChange }: { status: EstimateStatus; onChange: (s: EstimateStatus) => void }) {
  const [open, setOpen] = useState(false)
  const statuses: EstimateStatus[] = ['draft', 'sent', 'approved', 'declined', 'invoiced', 'paid']
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5">
        <StatusBadge status={status} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 py-1.5 min-w-[140px]">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-bg transition-colors"
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category, lineItems, priceSheet, onAddItem, onUpdateItem, onDeleteItem,
}: {
  category: string
  lineItems: LineItem[]
  priceSheet: PriceSheetItem[]
  onAddItem: (item: PriceSheetItem) => void
  onUpdateItem: (id: string, field: keyof LineItem, value: number | string) => void
  onDeleteItem: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const color = CATEGORY_COLORS[category] ?? '#8a7968'
  const categoryTotal = lineItems.reduce((sum, li) => sum + computeLineItemTotal(li), 0)
  const categoryItems = priceSheet.filter((i) => i.category === category)
  const filtered = categoryItems.filter((i) => i.description.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Category header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-bg transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-3">
          <svg className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ color, background: color + '18' }}>
            {category}
          </span>
          <span className="text-xs text-text-muted">{lineItems.length} items</span>
        </div>
        <span className="font-bold text-sm" style={{ color }}>{formatCurrency(categoryTotal)}</span>
      </div>

      {/* Line items table */}
      {!collapsed && (
        <div>
          {lineItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t border-border bg-bg text-text-muted">
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-center px-2 py-2 font-medium w-14">Qty</th>
                    <th className="text-center px-2 py-2 font-medium w-14">Unit</th>
                    <th className="text-center px-2 py-2 font-medium w-20">Mat $/U</th>
                    <th className="text-center px-2 py-2 font-medium w-14">Hrs</th>
                    <th className="text-center px-2 py-2 font-medium w-16">$/Hr</th>
                    <th className="text-right px-4 py-2 font-medium w-24">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((li) => (
                    <LineItemRow
                      key={li.id}
                      item={li}
                      onUpdate={onUpdateItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add item */}
          <div className="px-4 py-3 border-t border-border">
            {showSearch ? (
              <div>
                <input
                  autoFocus
                  type="text"
                  placeholder={`Search ${category} services...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border-mid rounded-lg text-xs text-text-primary placeholder-text-faint focus:outline-none focus:border-accent mb-2 transition-colors"
                />
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-text-faint py-2 text-center">No items found</p>
                  ) : (
                    filtered.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { onAddItem(item); setShowSearch(false); setQuery('') }}
                        className="text-left px-3 py-2 rounded-lg hover:bg-bg text-xs text-text-primary flex items-center justify-between group transition-colors"
                      >
                        <span>{item.description}</span>
                        <span className="text-text-faint group-hover:text-accent">{item.unit}</span>
                      </button>
                    ))
                  )}
                </div>
                <button onClick={() => { setShowSearch(false); setQuery('') }} className="text-xs text-text-faint hover:text-text-muted mt-2 transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-accent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Add {category} item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LineItemRow({
  item, onUpdate, onDelete,
}: {
  item: LineItem
  onUpdate: (id: string, field: keyof LineItem, value: number | string) => void
  onDelete: (id: string) => void
}) {
  const total = computeLineItemTotal(item)
  return (
    <tr className="group hover:bg-bg transition-colors">
      <td className="px-4 py-2">
        <input
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          onBlur={(e) => onUpdate(item.id, 'description', e.target.value)}
          className="w-full bg-transparent text-text-primary focus:outline-none focus:bg-bg rounded px-1 min-w-[120px]"
        />
      </td>
      <td className="px-2 py-2 text-center">
        <NumericCell value={item.qty} onChange={(v) => onUpdate(item.id, 'qty', v)} />
      </td>
      <td className="px-2 py-2 text-center">
        <select
          value={item.unit}
          onChange={(e) => onUpdate(item.id, 'unit', e.target.value)}
          className="bg-transparent text-text-muted text-xs focus:outline-none cursor-pointer"
        >
          {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-2 py-2 text-center">
        <NumericCell value={item.matPerUnit} onChange={(v) => onUpdate(item.id, 'matPerUnit', v)} prefix="$" />
      </td>
      <td className="px-2 py-2 text-center">
        <NumericCell value={item.hours} onChange={(v) => onUpdate(item.id, 'hours', v)} />
      </td>
      <td className="px-2 py-2 text-center">
        <NumericCell value={item.ratePerHr} onChange={(v) => onUpdate(item.id, 'ratePerHr', v)} prefix="$" />
      </td>
      <td className="px-4 py-2 text-right font-semibold text-text-primary">
        {formatCurrency(total)}
      </td>
      <td className="pr-2">
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-faint hover:text-red-400 p-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </td>
    </tr>
  )
}

function NumericCell({ value, onChange, prefix }: { value: number; onChange: (v: number) => void; prefix?: string }) {
  const [local, setLocal] = useState(String(value))
  useEffect(() => { setLocal(String(value)) }, [value])
  return (
    <div className="flex items-center justify-center gap-0.5">
      {prefix && <span className="text-text-faint text-xs">{prefix}</span>}
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(parseFloat(local) || 0)}
        className="w-14 bg-transparent text-center text-text-primary focus:outline-none focus:bg-bg rounded px-1 text-xs"
      />
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-8 h-5 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-border'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'left-3.5' : 'left-0.5'}`} />
    </button>
  )
}

function AddCategoryButton({ existingCategories, onAdd }: { existingCategories: string[]; onAdd: (cat: string) => void }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const allCategories = Object.keys(CATEGORY_COLORS)
  const available = allCategories.filter((c) => !existingCategories.includes(c))

  return (
    <div>
      {open ? (
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs font-medium text-text-mid mb-3 uppercase tracking-wider">Add category</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {available.map((cat) => (
              <button
                key={cat}
                onClick={() => { onAdd(cat); setOpen(false) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-bg text-text-mid hover:border-accent/50 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Custom category..."
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg border border-border-mid rounded-lg text-xs text-text-primary placeholder-text-faint focus:outline-none focus:border-accent"
            />
            <Button
              variant="secondary"
              onClick={() => { if (custom.trim()) { onAdd(custom.trim()); setOpen(false); setCustom('') } }}
            >
              Add
            </Button>
          </div>
          <button onClick={() => setOpen(false)} className="text-xs text-text-faint hover:text-text-muted mt-3 transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors px-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Add category
        </button>
      )}
    </div>
  )
}
