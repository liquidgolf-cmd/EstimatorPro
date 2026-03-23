import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { CATEGORY_COLORS } from '../../lib/constants'
import type { PriceSheetItem } from '../../types'

interface MobileItemPickerProps {
  open: boolean
  category: string
  priceSheet: PriceSheetItem[]
  onSelect: (item: PriceSheetItem) => void
  onClose: () => void
}

export function MobileItemPicker({
  open, category, priceSheet, onSelect, onClose,
}: MobileItemPickerProps) {
  const [query, setQuery] = useState('')
  const color = CATEGORY_COLORS[category] ?? '#8a7968'

  const items = priceSheet
    .filter((i) => i.category === category)
    .filter((i) => i.description.toLowerCase().includes(query.toLowerCase()))

  function handleSelect(item: PriceSheetItem) {
    onSelect(item)
    setQuery('')
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => { setQuery(''); onClose() }}
      title={`Add ${category} item`}
    >
      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
          width="15" height="15" viewBox="0 0 16 16" fill="none"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          autoFocus
          type="text"
          placeholder={`Search ${category} services...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-bg border border-border rounded-xl text-sm text-text-primary placeholder-text-faint focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Item list */}
      <div className="flex flex-col gap-2 pb-4">
        {items.length === 0 && (
          <p className="text-center text-text-muted text-sm py-4">No price sheet items for this category</p>
        )}
        {items.map((item) => {
            const unitTotal = item.defaultQty * item.matPerUnit +
              item.defaultQty * item.hours * item.ratePerHr
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full text-left bg-bg border border-border rounded-xl px-4 py-4 hover:border-accent/50 active:bg-border/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-text-primary">{item.description}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.defaultQty} {item.unit}
                      {item.hours > 0 && ` · ${item.hours}h @ $${item.ratePerHr}/hr`}
                      {item.matPerUnit > 0 && ` · $${item.matPerUnit} mat`}
                    </p>
                  </div>
                  {unitTotal > 0 && (
                    <span
                      className="text-sm font-bold shrink-0"
                      style={{ color }}
                    >
                      ${unitTotal.toFixed(0)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}

        {/* Custom item row — always visible */}
        <button
          onClick={() => handleSelect({
            id: '', userId: '', category, sortOrder: 0,
            description: query.trim() || 'New item',
            unit: 'LS', matPerUnit: 0, hours: 0, ratePerHr: 0, defaultQty: 1,
          })}
          className="w-full text-left border border-dashed border-border rounded-xl px-4 py-4 hover:border-accent/50 active:bg-border/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <svg className="text-text-faint shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-text-muted">
                {query.trim() ? `Add "${query.trim()}" as custom item` : 'Add blank custom item'}
              </p>
              <p className="text-xs text-text-faint mt-0.5">Qty 1 · LS · $0 — edit inline after adding</p>
            </div>
          </div>
        </button>
      </div>
    </BottomSheet>
  )
}
