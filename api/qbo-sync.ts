import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getValidToken } from './qbo-refresh'

const QBO_BASE = (realmId: string) =>
  process.env.QBO_ENVIRONMENT === 'sandbox'
    ? `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}`
    : `https://quickbooks.api.intuit.com/v3/company/${realmId}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, payload, userId } = req.body

  if (!type || !payload || !userId) {
    return res.status(400).json({ error: 'type, payload, userId required' })
  }

  const tokenData = await getValidToken(userId)
  if (!tokenData) {
    return res.status(401).json({ error: 'QuickBooks not connected or token expired' })
  }

  const { accessToken, realmId } = tokenData
  const base = QBO_BASE(realmId)

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  try {
    if (type === 'customer') {
      const body = {
        DisplayName: payload.companyName
          ? `${payload.name} — ${payload.companyName}`
          : payload.name,
        PrimaryEmailAddr: { Address: payload.email },
        PrimaryPhone: { FreeFormNumber: payload.phone },
        BillAddr: { Line1: payload.jobSiteAddress },
      }
      const r = await fetch(`${base}/customer`, { method: 'POST', headers, body: JSON.stringify(body) })
      const data = await r.json()
      if (data.Fault) throw new Error(JSON.stringify(data.Fault))
      return res.json({ qboCustomerId: data.Customer.Id })
    }

    if (type === 'invoice') {
      const body = {
        CustomerRef: { value: payload.qboCustomerId },
        DueDate: payload.dueDate,
        Line: [
          ...payload.lineItems.map((item: any, i: number) => ({
            Id: String(i + 1),
            LineNum: i + 1,
            Description: `[${item.category}] ${item.description}`,
            Amount: item.total,
            DetailType: 'SalesItemLineDetail',
            SalesItemLineDetail: {
              Qty: item.qty,
              UnitPrice: item.unitPrice,
              ItemRef: { value: '1', name: 'Services' }, // generic services item
            },
          })),
          {
            DetailType: 'SubTotalLineDetail',
            SubTotalLineDetail: {},
          },
        ],
        TxnDate: new Date().toISOString().split('T')[0],
        PrivateNote: `Estimate ${payload.estimateNumber}`,
      }
      const r = await fetch(`${base}/invoice`, { method: 'POST', headers, body: JSON.stringify(body) })
      const data = await r.json()
      if (data.Fault) throw new Error(JSON.stringify(data.Fault))
      return res.json({ qboInvoiceId: data.Invoice.Id })
    }

    if (type === 'payment') {
      const body = {
        CustomerRef: { value: payload.qboCustomerId },
        TotalAmt: payload.amount,
        PaymentMethodRef: { value: getQBOPaymentMethod(payload.method) },
        Line: [
          {
            Amount: payload.amount,
            LinkedTxn: [{ TxnId: payload.qboInvoiceId, TxnType: 'Invoice' }],
          },
        ],
        TxnDate: payload.receivedAt,
      }
      const r = await fetch(`${base}/payment`, { method: 'POST', headers, body: JSON.stringify(body) })
      const data = await r.json()
      if (data.Fault) throw new Error(JSON.stringify(data.Fault))
      return res.json({ qboPaymentId: data.Payment.Id })
    }

    return res.status(400).json({ error: `Unknown sync type: ${type}` })
  } catch (err) {
    console.error('QBO sync error:', err)
    res.status(500).json({ error: 'QBO sync failed', detail: String(err) })
  }
}

function getQBOPaymentMethod(method: string): string {
  // QBO payment method refs — these are default IDs in sandbox
  const map: Record<string, string> = {
    check: '1',
    card:  '2',
    cash:  '3',
    zelle: '1', // maps to check in QBO
    other: '1',
  }
  return map[method] ?? '1'
}
