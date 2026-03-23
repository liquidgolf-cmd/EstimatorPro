import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePriceSheet } from '../hooks/usePriceSheet'
import { Button } from '../components/ui/Button'
import { CATEGORY_COLORS, UNIT_OPTIONS } from '../lib/constants'
import type { PriceSheetItem } from '../types'

export function PriceSheetPage() {
  const navigate = useNavigate()
  const { items, loading, refetch } = usePriceSheet()
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const categories = [...new Set(items.map((i) => i.category))]

  const saveItem = useCallback(async (
    itemId: string,
    field: keyof PriceSheetItem,
    value: number | string
  ) => {
    setSaving(itemId)
    const dbField: Record<string, string> = {
      description: 'description',
      unit: 'unit',
      matPerUnit: 'mat_per_unit',
      hours: 'hours',
      ratePerHr: 'rate_per_hr',
      defaultQty: 'default_qty',
    }
    await supabase
      .from('price_sheet_items')
      .update({ [dbField[field as string]]: value })
      .eq('id', itemId)
    setSaving(null)
  }, [])

  async function deleteItem(itemId: string) {
    setDeleting(itemId)
    await supabase.from('price_sheet_items').delete().eq('id', itemId)
    await refetch()
    setDeleting(null)
  }

  async function addItem(category: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('price_sheet_items')
      .insert({
        user_id: user.id,
        category,
        description: 'New service',
        unit: 'LS',
        mat_per_unit: 0,
        hours: 0,
        rate_per_hr: 0,
        default_qty: 1,
        sort_order: items.filter((i) => i.category === category).length,
      })
    await refetch()
  }

  async function resetToDefaults() {
    if (!confirm('Reset all prices to defaults? This cannot be undone.')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('price_sheet_items').delete().eq('user_id', user.id)
    await refetch()
    // usePriceSheet re-seeds on next fetch when table is empty
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    )
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
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-text-primary">Master Price Sheet</h1>
            <p className="text-xs text-text-muted">Company-wide default pricing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-text-faint">Saving...</span>}
          <button
            onClick={resetToDefaults}
            className="text-xs text-text-muted hover:text-red-500 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Info banner */}
        <div className="bg-surface border border-border rounded-xl px-5 py-4 flex items-start gap-3">
          <svg className="text-accent shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 7v5M8 5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-text-muted">
            These are your default rates. When you add an item to an estimate, it starts with these
            values. Changes here don't affect estimates already created — only new ones.
          </p>
        </div>

        {/* Categories */}
        {categories.map((category) => {
          const categoryItems = items.filter((i) => i.category === category)
          const color = CATEGORY_COLORS[category] ?? '#8a7968'

          return (
            <div key={category} className="bg-surface border border-border rounded-xl overflow-hidden">
              {/* Category header */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b border-border"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ color, background: color + '18' }}
                  >
                    {category}
                  </span>
                  <span className="text-xs text-text-muted">{categoryItems.length} services</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg text-text-muted border-b border-border">
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                      <th className="text-center px-2 py-2 font-medium w-16">Unit</th>
                      <th className="text-center px-2 py-2 font-medium w-20">Mat $/Unit</th>
                      <th className="text-center px-2 py-2 font-medium w-16">Hours</th>
                      <th className="text-center px-2 py-2 font-medium w-16">$/Hr</th>
                      <th className="text-center px-2 py-2 font-medium w-20">Default Qty</th>
                      <th className="text-right px-4 py-2 font-medium w-24">Unit Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categoryItems.map((item) => (
                      <PriceSheetRow
                        key={item.id}
                        item={item}
                        onSave={saveItem}
                        onDelete={() => deleteItem(item.id)}
                        isDeleting={deleting === item.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add service */}
              <div className="px-4 py-3 border-t border-border">
                <button
                  onClick={() => addItem(category)}
                  className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-accent transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Add service
                </button>
              </div>
            </div>
          )
        })}

        {/* Add new category */}
        <AddCategoryCard
          existingCategories={categories}
          onAdd={(cat) => addItem(cat)}
        />

      </main>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

function PriceSheetRow({
  item, onSave, onDelete, isDeleting,
}: {
  item: PriceSheetItem
  onSave: (id: string, field: keyof PriceSheetItem, value: number | string) => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const unitTotal = item.defaultQty * item.matPerUnit + item.defaultQty * item.hours * item.ratePerHr

  return (
    <tr className="group hover:bg-bg transition-colors">
      <td className="px-4 py-2">
        <EditableText
          value={item.description}
          onSave={(v) => onSave(item.id, 'description', v)}
        />
      </td>
      <td className="px-2 py-2 text-center">
        <select
          defaultValue={item.unit}
          onChange={(e) => onSave(item.id, 'unit', e.target.value)}
          className="bg-transparent text-text-muted text-xs focus:outline-none cursor-pointer"
        >
          {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-2 py-2 text-center">
        <EditableNumber value={item.matPerUnit} onSave={(v) => onSave(item.id, 'matPerUnit', v)} prefix="$" />
      </td>
      <td className="px-2 py-2 text-center">
        <EditableNumber value={item.hours} onSave={(v) => onSave(item.id, 'hours', v)} />
      </td>
      <td className="px-2 py-2 text-center">
        <EditableNumber value={item.ratePerHr} onSave={(v) => onSave(item.id, 'ratePerHr', v)} prefix="$" />
      </td>
      <td className="px-2 py-2 text-center">
        <EditableNumber value={item.defaultQty} onSave={(v) => onSave(item.id, 'defaultQty', v)} />
      </td>
      <td className="px-4 py-2 text-right font-semibold text-text-primary">
        {unitTotal === 0 ? '—' : `$${unitTotal.toFixed(2)}`}
      </td>
      <td className="pr-2">
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-faint hover:text-red-400 p-1 disabled:opacity-30"
        >
          {isDeleting ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
              <path d="M6 1a5 5 0 015 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </td>
    </tr>
  )
}

function EditableText({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onSave(local) }}
      className="w-full bg-transparent text-text-primary focus:outline-none focus:bg-bg rounded px-1 min-w-[140px] text-xs"
    />
  )
}

function EditableNumber({
  value, onSave, prefix,
}: { value: number; onSave: (v: number) => void; prefix?: string }) {
  const [local, setLocal] = useState(String(value))
  return (
    <div className="flex items-center justify-center gap-0.5">
      {prefix && <span className="text-text-faint text-xs">{prefix}</span>}
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { const n = parseFloat(local) || 0; if (n !== value) onSave(n) }}
        className="w-14 bg-transparent text-center text-text-primary focus:outline-none focus:bg-bg rounded px-1 text-xs"
      />
    </div>
  )
}

function AddCategoryCard({
  existingCategories, onAdd,
}: { existingCategories: string[]; onAdd: (cat: string) => void }) {
  const [custom, setCustom] = useState('')
  const available = Object.keys(CATEGORY_COLORS).filter((c) => !existingCategories.includes(c))

  return (
    <div className="bg-surface border border-dashed border-border rounded-xl p-5">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Add category</p>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {available.map((cat) => (
            <button
              key={cat}
              onClick={() => onAdd(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-bg text-text-muted hover:border-accent/50 hover:text-accent transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Custom category name..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim()) { onAdd(custom.trim()); setCustom('') } }}
          className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent transition-colors"
        />
        <Button
          variant="secondary"
          onClick={() => { if (custom.trim()) { onAdd(custom.trim()); setCustom('') } }}
        >
          Add
        </Button>
      </div>
    </div>
  )
}
