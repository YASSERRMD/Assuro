'use client'

import { useRef, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { exportOrg, exportAssetsCSV, importAssets, importVendors, type ImportResult } from '@/lib/api/exportimport'
import { Download, Upload, FileDown, Database, Building2, Cpu } from 'lucide-react'

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export / Import</h1>
        <p className="mt-1 text-sm text-gray-500">Download your data or import assets and vendors from CSV</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export section */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Export Data</h2>
          <div className="space-y-3">
            <Card className="flex items-center gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f1f3d]/5">
                <Database className="h-5 w-5 text-[#0f1f3d]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Full Organisation Export</p>
                <p className="text-xs text-gray-500">Download all AI systems, incidents, assessments, and policies as JSON</p>
              </div>
              <Button
                onClick={handleExportOrg}
                disabled={exportingOrg}
                variant="outline"
                className="gap-2 flex-shrink-0"
              >
                <FileDown className="h-4 w-4" />
                {exportingOrg ? 'Exporting...' : 'Export'}
              </Button>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">AI Assets CSV</p>
                <p className="text-xs text-gray-500">Download all registered AI systems and assets as a CSV file</p>
              </div>
              <Button
                onClick={handleExportAssetsCSV}
                disabled={exportingCSV}
                variant="outline"
                className="gap-2 flex-shrink-0"
              >
                <Download className="h-4 w-4" />
                {exportingCSV ? 'Exporting...' : 'Export CSV'}
              </Button>
            </Card>
          </div>
        </div>

        {/* Import section */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Import Data</h2>
          <div className="space-y-3">
            {/* Import assets */}
            <Card className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Cpu className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Import Assets</p>
                <p className="text-xs text-gray-500 mb-3">Upload a CSV file to bulk import AI assets</p>
                <input
                  ref={assetFileRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleImportAssets}
                  className="hidden"
                  id="import-assets"
                />
                <label htmlFor="import-assets">
                  <Button
                    variant="outline"
                    className="gap-2 cursor-pointer"
                    disabled={assetImport.loading}
                    onClick={() => assetFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {assetImport.loading ? 'Importing...' : 'Choose File'}
                  </Button>
                </label>
                {assetImport.result && (
                  <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Imported: {assetImport.result.imported} | Skipped: {assetImport.result.skipped}
                    {assetImport.result.errors.length > 0 && (
                      <div className="mt-1 text-red-600">{assetImport.result.errors.join(', ')}</div>
                    )}
                  </div>
                )}
                {assetImport.error && (
                  <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{assetImport.error}</div>
                )}
              </div>
            </Card>

            {/* Import vendors */}
            <Card className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Import Vendors</p>
                <p className="text-xs text-gray-500 mb-3">Upload a CSV file to bulk import vendor data</p>
                <input
                  ref={vendorFileRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleImportVendors}
                  className="hidden"
                  id="import-vendors"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={vendorImport.loading}
                  onClick={() => vendorFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {vendorImport.loading ? 'Importing...' : 'Choose File'}
                </Button>
                {vendorImport.result && (
                  <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Imported: {vendorImport.result.imported} | Skipped: {vendorImport.result.skipped}
                    {vendorImport.result.errors.length > 0 && (
                      <div className="mt-1 text-red-600">{vendorImport.result.errors.join(', ')}</div>
                    )}
                  </div>
                )}
                {vendorImport.error && (
                  <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{vendorImport.error}</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Info */}
      <Card className="mt-6 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Data Portability</p>
            <p className="mt-1 text-xs text-blue-700">
              Export your data at any time in standard formats (JSON, CSV). Imports support CSV files with the required column headers.
              Contact your administrator for schema documentation.
            </p>
          </div>
        </div>
      </Card>
    </Shell>
  )
}
