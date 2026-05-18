'use client'

import { useRef, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { exportOrg, exportAssetsCSV, importAssets, importVendors, type ImportResult } from '@/lib/api/exportimport'
import { Download, Upload, FileDown, Database, Building2, Cpu, Info, CheckCircle2, AlertCircle } from 'lucide-react'

interface ImportStatus {
  result: ImportResult | null
  error: string | null
  loading: boolean
}

export default function ExportPage() {
  const { toast } = useToast()
  const assetFileRef = useRef<HTMLInputElement>(null)
  const vendorFileRef = useRef<HTMLInputElement>(null)
  const [exportingOrg, setExportingOrg] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [assetImport, setAssetImport] = useState<ImportStatus>({ result: null, error: null, loading: false })
  const [vendorImport, setVendorImport] = useState<ImportStatus>({ result: null, error: null, loading: false })

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportOrg = async (): Promise<void> => {
    setExportingOrg(true)
    try {
      const blob = await exportOrg()
      downloadBlob(blob, `assuro-org-export-${new Date().toISOString().slice(0, 10)}.json`)
      toast('Organisation export downloaded.', 'success')
    } catch {
      toast('Failed to export organisation data.', 'error')
    } finally {
      setExportingOrg(false)
    }
  }

  const handleExportAssetsCSV = async (): Promise<void> => {
    setExportingCSV(true)
    try {
      const blob = await exportAssetsCSV()
      downloadBlob(blob, `assuro-assets-${new Date().toISOString().slice(0, 10)}.csv`)
      toast('Assets CSV downloaded.', 'success')
    } catch {
      toast('Failed to export assets CSV.', 'error')
    } finally {
      setExportingCSV(false)
    }
  }

  const handleImportAssets = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    setAssetImport({ result: null, error: null, loading: true })
    try {
      const result = await importAssets(file)
      setAssetImport({ result, error: null, loading: false })
      toast(`Imported ${result.imported} assets.`, 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      setAssetImport({ result: null, error: msg, loading: false })
      toast(msg, 'error')
    }
    if (assetFileRef.current) assetFileRef.current.value = ''
  }

  const handleImportVendors = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    setVendorImport({ result: null, error: null, loading: true })
    try {
      const result = await importVendors(file)
      setVendorImport({ result, error: null, loading: false })
      toast(`Imported ${result.imported} vendors.`, 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      setVendorImport({ result: null, error: msg, loading: false })
      toast(msg, 'error')
    }
    if (vendorFileRef.current) vendorFileRef.current.value = ''
  }

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Export / Import</h1>
          <p className="page-subtitle">Download your data or bulk-import assets and vendors from CSV</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 animate-in">
        {/* Export section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">Export Data</h2>

          {/* Full org export */}
          <div className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1B2A4A]/5">
                <Database className="h-5 w-5 text-[#1B2A4A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Full Organisation Export</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  All AI systems, incidents, assessments, and policies as JSON.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportOrg}
              disabled={exportingOrg}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              {exportingOrg ? 'Exporting...' : 'Download JSON'}
            </button>
          </div>

          {/* AI assets CSV export */}
          <div className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">AI Assets CSV</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  All registered AI systems and assets as a spreadsheet-ready CSV file.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportAssetsCSV}
              disabled={exportingCSV}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {exportingCSV ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Import section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">Import Data</h2>

          {/* Import assets */}
          <div className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Cpu className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Import Assets</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Bulk-import AI assets from a CSV file.
                </p>
              </div>
            </div>
            <input
              ref={assetFileRef}
              type="file"
              accept=".csv,.json"
              onChange={handleImportAssets}
              className="hidden"
              id="import-assets"
            />
            <button
              onClick={() => assetFileRef.current?.click()}
              disabled={assetImport.loading}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {assetImport.loading ? 'Importing...' : 'Choose CSV / JSON'}
            </button>
            {assetImport.result && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <span className="font-semibold">Imported {assetImport.result.imported}</span>, skipped {assetImport.result.skipped}
                  {assetImport.result.errors.length > 0 && (
                    <p className="mt-0.5 text-red-600">{assetImport.result.errors.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
            {assetImport.error && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                {assetImport.error}
              </div>
            )}
          </div>

          {/* Import vendors */}
          <div className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Import Vendors</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Bulk-import vendor data from a CSV file.
                </p>
              </div>
            </div>
            <input
              ref={vendorFileRef}
              type="file"
              accept=".csv,.json"
              onChange={handleImportVendors}
              className="hidden"
              id="import-vendors"
            />
            <button
              onClick={() => vendorFileRef.current?.click()}
              disabled={vendorImport.loading}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {vendorImport.loading ? 'Importing...' : 'Choose CSV / JSON'}
            </button>
            {vendorImport.result && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <span className="font-semibold">Imported {vendorImport.result.imported}</span>, skipped {vendorImport.result.skipped}
                  {vendorImport.result.errors.length > 0 && (
                    <p className="mt-0.5 text-red-600">{vendorImport.result.errors.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
            {vendorImport.error && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                {vendorImport.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-5 card p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Data Portability</p>
            <p className="mt-0.5 text-xs text-blue-700">
              Export your data at any time in standard formats (JSON, CSV). Imports support CSV files with the required column headers.
              Contact your administrator for schema documentation.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  )
}
