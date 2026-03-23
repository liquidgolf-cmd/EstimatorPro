import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { EstimatePDF } from './EstimatePDF'
import type { Estimate } from '../../types'

interface PDFDownloadButtonProps {
  estimate: Estimate
  contractorName: string
  contractorEmail?: string
  contractorPhone?: string
  className?: string
}

export function PDFDownloadButton({
  estimate,
  contractorName,
  contractorEmail,
  contractorPhone,
  className = '',
}: PDFDownloadButtonProps) {
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    setGenerating(true)
    try {
      const isInvoice = ['invoiced', 'paid'].includes(estimate.status)
      const docNumber = isInvoice && estimate.invoiceNumber
        ? estimate.invoiceNumber
        : estimate.estimateNumber
      const fileName = `${docNumber}-${estimate.client?.name ?? 'estimate'}.pdf`
        .replace(/[^a-zA-Z0-9-_.]/g, '-')
        .toLowerCase()

      const blob = await pdf(
        <EstimatePDF
          estimate={estimate}
          contractorName={contractorName}
          contractorEmail={contractorEmail}
          contractorPhone={contractorPhone}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className={`flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 ${className}`}
      title="Download PDF"
    >
      {generating ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 19h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
      {generating ? 'Generating...' : 'Download PDF'}
    </button>
  )
}
