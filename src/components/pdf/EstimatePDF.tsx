import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Estimate } from '../../types'
import { computeTotals, computeLineItemTotal } from '../../lib/calculations'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e1a16',
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e0d8',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e1a16',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 8,
    color: '#8a7968',
    marginBottom: 2,
  },
  docType: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#e07b39',
    textAlign: 'right',
  },
  docNumber: {
    fontSize: 9,
    color: '#8a7968',
    textAlign: 'right',
    marginTop: 2,
  },
  docDate: {
    fontSize: 9,
    color: '#8a7968',
    textAlign: 'right',
    marginTop: 2,
  },

  // Client block
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  clientBlock: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#8a7968',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1e1a16',
    marginBottom: 3,
  },
  clientDetail: {
    fontSize: 8,
    color: '#3d3228',
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Summary totals row (top)
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f5f0eb',
    borderRadius: 4,
    padding: 10,
  },
  summaryCardLabel: {
    fontSize: 7,
    color: '#8a7968',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCardValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e1a16',
  },
  summaryCardAccent: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#e07b39',
  },

  // Line items table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f0eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 1,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#8a7968',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e0d8',
  },
  categoryLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  categoryTotal: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0ebe4',
  },
  tableRowAlt: {
    backgroundColor: '#fdfaf7',
  },

  // Column widths
  colDesc:  { flex: 4 },
  colQty:   { width: 32, textAlign: 'center' },
  colUnit:  { width: 28, textAlign: 'center' },
  colMat:   { width: 52, textAlign: 'right' },
  colHrs:   { width: 32, textAlign: 'center' },
  colRate:  { width: 40, textAlign: 'right' },
  colTotal: { width: 58, textAlign: 'right' },

  cellText: {
    fontSize: 8,
    color: '#3d3228',
  },
  cellTextBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e1a16',
  },
  cellTextMuted: {
    fontSize: 7,
    color: '#8a7968',
  },

  // Totals block
  totalsBlock: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 24,
  },
  totalsTable: {
    width: 220,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  totalsRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#1e1a16',
    borderRadius: 4,
    marginTop: 4,
  },
  totalsLabel: {
    fontSize: 8,
    color: '#8a7968',
  },
  totalsValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e1a16',
  },
  totalsLabelBig: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalsValueBig: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#e07b39',
  },

  // Invoice payment section
  paymentSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e8e0d8',
    paddingTop: 16,
    marginBottom: 24,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0ebe4',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e8e0d8',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: '#b5a99a',
  },
  footerAccent: {
    fontSize: 7,
    color: '#e07b39',
    fontFamily: 'Helvetica-Bold',
  },
})

const CATEGORY_COLORS: Record<string, string> = {
  Demo:       '#ef4444',
  Framing:    '#f97316',
  Electrical: '#eab308',
  Plumbing:   '#3b82f6',
  Finishing:  '#22c55e',
  Excavation: '#a855f7',
  Utilities:  '#06b6d4',
  Labor:      '#f97316',
  Materials:  '#8b5cf6',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:    { bg: '#f0ebe4', text: '#8a7968' },
  sent:     { bg: '#e8f2fb', text: '#1d6fba' },
  approved: { bg: '#dcfce7', text: '#166534' },
  declined: { bg: '#fee2e2', text: '#991b1b' },
  invoiced: { bg: '#fef3c7', text: '#92400e' },
  paid:     { bg: '#bbf7d0', text: '#14532d' },
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

interface EstimatePDFProps {
  estimate: Estimate
  contractorName: string
  contractorEmail?: string
  contractorPhone?: string
}

export function EstimatePDF({
  estimate,
  contractorName,
  contractorEmail,
  contractorPhone,
}: EstimatePDFProps) {
  const totals = computeTotals(estimate)
  const isInvoice = ['invoiced', 'paid'].includes(estimate.status)
  const categories = [...new Set(estimate.lineItems.map((li) => li.category))]
  const statusCfg = STATUS_COLORS[estimate.status] ?? STATUS_COLORS.draft

  const docNumber = isInvoice && estimate.invoiceNumber
    ? estimate.invoiceNumber
    : estimate.estimateNumber

  return (
    <Document title={`${isInvoice ? 'Invoice' : 'Estimate'} ${docNumber}`}>
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{contractorName}</Text>
            {contractorPhone && <Text style={styles.companyDetail}>{contractorPhone}</Text>}
            {contractorEmail && <Text style={styles.companyDetail}>{contractorEmail}</Text>}
          </View>
          <View>
            <Text style={styles.docType}>{isInvoice ? 'INVOICE' : 'ESTIMATE'}</Text>
            <Text style={styles.docNumber}>{docNumber}</Text>
            <Text style={styles.docDate}>
              {fmtDate(isInvoice ? (estimate.invoicedAt ?? estimate.createdAt) : estimate.createdAt)}
            </Text>
            {isInvoice && estimate.dueDate && (
              <Text style={[styles.docDate, { color: '#e07b39', fontFamily: 'Helvetica-Bold' }]}>
                Due: {fmtDate(estimate.dueDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Client + Status */}
        <View style={styles.clientSection}>
          <View style={styles.clientBlock}>
            <Text style={styles.sectionLabel}>
              {isInvoice ? 'Bill to' : 'Prepared for'}
            </Text>
            {estimate.client ? (
              <>
                <Text style={styles.clientName}>{estimate.client.name}</Text>
                {estimate.client.companyName && (
                  <Text style={styles.clientDetail}>{estimate.client.companyName}</Text>
                )}
                <Text style={styles.clientDetail}>{estimate.client.jobSiteAddress}</Text>
                <Text style={styles.clientDetail}>{estimate.client.phone}</Text>
                <Text style={styles.clientDetail}>{estimate.client.email}</Text>
              </>
            ) : (
              <Text style={styles.clientDetail}>No client attached</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.text }]}>
                {estimate.status.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.clientDetail, { marginTop: 8, textAlign: 'right' }]}>
              Project: {estimate.title}
            </Text>
          </View>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Materials</Text>
            <Text style={styles.summaryCardValue}>{fmt(totals.materialsCost)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Labor</Text>
            <Text style={styles.summaryCardValue}>{fmt(totals.laborCost)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Overhead</Text>
            <Text style={styles.summaryCardValue}>{fmt(totals.overheadAmount)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#1e1a16' }]}>
            <Text style={[styles.summaryCardLabel, { color: '#8a7968' }]}>Total</Text>
            <Text style={styles.summaryCardAccent}>{fmt(totals.grandTotal)}</Text>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderText, styles.colMat]}>Mat $/U</Text>
            <Text style={[styles.tableHeaderText, styles.colHrs]}>Hrs</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>$/Hr</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {categories.map((category) => {
            const catItems = estimate.lineItems.filter((li) => li.category === category)
            const catTotal = catItems.reduce((sum, li) => sum + computeLineItemTotal(li), 0)
            const color = CATEGORY_COLORS[category] ?? '#8a7968'

            return (
              <View key={category}>
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryLabel, { color }]}>{category}</Text>
                  <Text style={[styles.categoryTotal, { color }]}>{fmt(catTotal)}</Text>
                </View>
                {catItems.map((li, i) => (
                  <View
                    key={li.id}
                    style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                  >
                    <Text style={[styles.cellText, styles.colDesc]}>{li.description}</Text>
                    <Text style={[styles.cellText, styles.colQty]}>{li.qty}</Text>
                    <Text style={[styles.cellTextMuted, styles.colUnit]}>{li.unit}</Text>
                    <Text style={[styles.cellText, styles.colMat]}>{fmt(li.matPerUnit)}</Text>
                    <Text style={[styles.cellText, styles.colHrs]}>{li.hours}</Text>
                    <Text style={[styles.cellText, styles.colRate]}>{fmt(li.ratePerHr)}</Text>
                    <Text style={[styles.cellTextBold, styles.colTotal]}>
                      {fmt(computeLineItemTotal(li))}
                    </Text>
                  </View>
                ))}
              </View>
            )
          })}
        </View>

        {/* Totals block */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmt(totals.subtotal)}</Text>
            </View>
            {totals.overheadAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Overhead</Text>
                <Text style={styles.totalsValue}>{fmt(totals.overheadAmount)}</Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Margin</Text>
              <Text style={styles.totalsValue}>{totals.marginPercent.toFixed(1)}%</Text>
            </View>
            <View style={styles.totalsRowHighlight}>
              <Text style={styles.totalsLabelBig}>Grand Total</Text>
              <Text style={styles.totalsValueBig}>{fmt(totals.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Payment history — invoice only */}
        {isInvoice && estimate.payments.length > 0 && (
          <View style={styles.paymentSection}>
            <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>Payment history</Text>
            {estimate.payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <Text style={styles.cellText}>
                  {new Date(p.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {'  '}
                  {p.method.charAt(0).toUpperCase() + p.method.slice(1)}
                  {p.note ? `  ·  ${p.note}` : ''}
                </Text>
                <Text style={[styles.cellTextBold, { color: '#166534' }]}>
                  -{fmt(p.amount)}
                </Text>
              </View>
            ))}
            <View style={[styles.totalsRow, { marginTop: 6 }]}>
              <Text style={[styles.totalsLabel, { fontFamily: 'Helvetica-Bold', color: '#1e1a16' }]}>
                Balance due
              </Text>
              <Text style={[styles.totalsValue, { color: totals.balanceDue <= 0 ? '#166534' : '#e07b39' }]}>
                {fmt(Math.max(0, totals.balanceDue))}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by The Estimator
          </Text>
          <Text style={styles.footerText}>
            {docNumber}  ·  {contractorName}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
