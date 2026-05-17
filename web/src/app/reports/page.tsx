'use client'

import { useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'

export default function ReportsPage() {
  const [framework, setFramework] = useState('eu_ai_act')
  const [reportHtml, setReportHtml] = useState('')

  const handlePreview = async (): Promise<void> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/v1/assets/demo-id/report?framework=${framework}&format=html`)
    const html = await res.text()
    setReportHtml(html)
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Reports</h1>
      <div className="mt-4 flex gap-4">
        <select className="rounded border border-gray-300 px-3 py-2 text-sm" value={framework} onChange={(e) => setFramework(e.target.value)}>
          <option value="eu_ai_act">EU AI Act</option>
          <option value="nist_ai_rmf">NIST AI RMF</option>
          <option value="iso_42001">ISO 42001</option>
        </select>
        <Button onClick={handlePreview}>Preview</Button>
      </div>
      {reportHtml && (
        <div className="mt-4 rounded-lg border border-gray-200 p-4" dangerouslySetInnerHTML={{ __html: reportHtml }} />
      )}
    </Shell>
  )
}
