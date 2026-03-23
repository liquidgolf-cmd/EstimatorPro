export type ProjectType =
  | 'residential_remodel'
  | 'basement_finish'
  | 'site_work'
  | 'commercial'
  | 'handyman'

export type PricingMode = 'simple_markup' | 'hourly_mat' | 'oh_profit'

export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'declined'
  | 'invoiced'
  | 'paid'

export type PaymentMethod = 'check' | 'zelle' | 'card' | 'cash' | 'other'

export interface Client {
  id: string
  userId: string
  name: string
  phone: string
  email: string
  companyName?: string
  jobSiteAddress: string
  qboCustomerId?: string
  createdAt: string
}

export interface OverheadItem {
  key: string
  label: string
  enabled: boolean
  rate: number
}

export interface LineItem {
  id: string
  estimateId: string
  category: string
  description: string
  qty: number
  unit: string
  matPerUnit: number
  hours: number
  ratePerHr: number
  sortOrder: number
}

export interface Payment {
  id: string
  estimateId: string
  amount: number
  method: PaymentMethod
  receivedAt: string
  note?: string
  qboPaymentId?: string
  createdAt: string
}

export interface Estimate {
  id: string
  userId: string
  clientId?: string
  client?: Client
  title: string
  projectType: ProjectType
  status: EstimateStatus
  estimateNumber: string
  invoiceNumber?: string
  pricingMode: PricingMode
  profitMargin: number
  overheadItems: OverheadItem[]
  lineItems: LineItem[]
  payments: Payment[]
  sentAt?: string
  approvedAt?: string
  invoicedAt?: string
  dueDate?: string
  qboInvoiceId?: string
  createdAt: string
  updatedAt: string
}

export interface PriceSheetItem {
  id: string
  userId: string
  category: string
  description: string
  unit: string
  matPerUnit: number
  hours: number
  ratePerHr: number
  defaultQty: number
  sortOrder: number
}

export interface Profile {
  id: string
  businessName: string
  phone: string
  email: string
  updatedAt: string
}

// Computed client-side — never stored
export interface EstimateTotals {
  materialsCost: number
  laborCost: number
  subtotal: number
  overheadAmount: number
  grandTotal: number
  marginPercent: number
  totalHours: number
  totalPaid: number
  balanceDue: number
}
