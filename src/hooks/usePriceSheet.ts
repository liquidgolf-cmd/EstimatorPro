import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { PriceSheetItem } from '../types'
import { DEFAULT_PRICE_SHEET } from '../lib/constants'

export function usePriceSheet() {
  const { user } = useAuth()
  const [items, setItems] = useState<PriceSheetItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('price_sheet_items')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (!error) {
      if (data && data.length > 0) {
        setItems(data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          category: row.category,
          description: row.description,
          unit: row.unit,
          matPerUnit: row.mat_per_unit,
          hours: row.hours,
          ratePerHr: row.rate_per_hr,
          defaultQty: row.default_qty,
          sortOrder: row.sort_order,
        })))
        setLoading(false)
      } else {
        // Seed with defaults on first load
        await seedPriceSheet(user.id)
        // Re-fetch after seeding
        const { data: seeded } = await supabase
          .from('price_sheet_items')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
        if (seeded) {
          setItems(seeded.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            category: row.category,
            description: row.description,
            unit: row.unit,
            matPerUnit: row.mat_per_unit,
            hours: row.hours,
            ratePerHr: row.rate_per_hr,
            defaultQty: row.default_qty,
            sortOrder: row.sort_order,
          })))
        }
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchItems() }, [fetchItems])

  return { items, loading, refetch: fetchItems }
}

async function seedPriceSheet(userId: string) {
  const rows = DEFAULT_PRICE_SHEET.map((item, i) => ({
    user_id: userId,
    category: item.category,
    description: item.description,
    unit: item.unit,
    mat_per_unit: item.matPerUnit,
    hours: item.hours,
    rate_per_hr: item.ratePerHr,
    default_qty: item.defaultQty,
    sort_order: i,
  }))
  await supabase.from('price_sheet_items').insert(rows)
}
