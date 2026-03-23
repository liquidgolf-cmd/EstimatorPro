import type { Estimate, LineItem, EstimateTotals } from '../types'

export function computeLineItemTotal(item: LineItem): number {
  const mat = item.qty * item.matPerUnit
  const labor = item.qty * item.hours * item.ratePerHr
  return mat + labor
}

export function computeTotals(estimate: Estimate): EstimateTotals {
  const materialsCost = estimate.lineItems.reduce(
    (sum, li) => sum + li.qty * li.matPerUnit, 0
  )
  const laborCost = estimate.lineItems.reduce(
    (sum, li) => sum + li.qty * li.hours * li.ratePerHr, 0
  )
  const subtotal = materialsCost + laborCost
  const totalHours = estimate.lineItems.reduce(
    (sum, li) => sum + li.qty * li.hours, 0
  )

  const overheadRate = estimate.overheadItems
    .filter((o) => o.enabled)
    .reduce((sum, o) => sum + o.rate / 100, 0)

  const overheadAmount = subtotal * overheadRate
  const withOverhead = subtotal + overheadAmount

  // Pricing mode affects how profit is applied
  let grandTotal: number
  let marginPercent: number

  if (estimate.pricingMode === 'simple_markup') {
    grandTotal = subtotal * (1 + estimate.profitMargin / 100)
    marginPercent = estimate.profitMargin
  } else if (estimate.pricingMode === 'hourly_mat') {
    grandTotal = withOverhead * (1 + estimate.profitMargin / 100)
    marginPercent = estimate.profitMargin
  } else {
    // oh_profit — overhead + profit stacked
    grandTotal = withOverhead * (1 + estimate.profitMargin / 100)
    marginPercent = grandTotal > 0 ? ((grandTotal - subtotal) / grandTotal) * 100 : 0
  }

  const totalPaid = estimate.payments.reduce((sum, p) => sum + p.amount, 0)
  const balanceDue = grandTotal - totalPaid

  return {
    materialsCost,
    laborCost,
    subtotal,
    overheadAmount,
    grandTotal,
    marginPercent,
    totalHours,
    totalPaid,
    balanceDue,
  }
}
