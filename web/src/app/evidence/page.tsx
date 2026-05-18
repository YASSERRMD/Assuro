'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listEvidence, uploadEvidence, type Evidence } from '@/lib/api/evidence'
import { getToken } from '@/lib/api'
import { FileText, Upload, Download, File, FileImage, Sheet } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

function getFileIcon(mimeType: string) {
  if (mimeType?.includes('image')) return FileImage
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('csv')) return Sheet
  return File
}

function getTypeLabel(mimeType: string) {
  if (!mimeType) return 'Unknown'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('docx')) return 'Word'
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return 'CSV'
  if (mimeType.includes('image')) return 'Image'
  if (mimeType.includes('text')) return 'Text'
  return mimeType.split('/')[1]?.toUpperCase() ?? 'File'
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const reload = useCallback(() => {
    listEvidence().then(setEvidence).finally(() => setLoading(false))
  }, [])

  useEffect(() => { reload() }, [reload])

  const handleDownload = async (ev: Evidence): Promise<void> => {
    const token = getToken()
    const res = await fetch(`${API_BASE}/v1/evidence/${ev.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      if (err?.message === 'file not available') {
        toast('File not on disk — upload the actual document to enable download.', 'warning')
      } else {
        toast('Download failed.', 'error')
      }
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = ev.title
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = async (): Promise<void> => {
    const file = fileRef.current?.files?.[0]
    const title = titleRef.current?.value.trim()
    if (!file) { toast('Please select a file.', 'warning'); return }
    if (!title) { toast('Please enter a document title.', 'warning'); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('target_type', 'org')
      const ev = await uploadEvidence(form)
      setEvidence((prev) => [ev, ...prev])
      if (fileRef.current) fileRef.current.value = ''
      if (titleRef.current) titleRef.current.value = ''
      toast('Evidence uploaded successfully.', 'success')
    } catch {
      toast('Upload failed. Check file size and try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence Library</h1>
          <p className="page-subtitle">Manage compliance documents and audit evidence</p>
        </div>
      </div>

      {/* Upload panel */}
      <div className="card mb-4 animate-in">
        <div className="card-header">
          <h2 className="text-sm font-semibold text-gray-700">Upload Evidence</h2>
          <span className="text-xs text-gray-400">PDF, DOCX, XLSX, images supported</span>
        </div>
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="label">Document title</label>
            <input
              ref={titleRef}
              type="text"
              placeholder="e.g. EU AI Act Risk Assessment Q2 2025"
              className="input-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label">File</label>
            <input
              ref={fileRef}
              type="file"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs file:font-medium"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card animate-in overflow-hidden">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="shimmer h-8 w-8 rounded-lg" />
                <div className="shimmer h-4 rounded w-48" />
                <div className="shimmer h-4 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && evidence.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No evidence uploaded yet</p>
          <p className="empty-body">Upload documents, reports, or audit files to build your evidence library.</p>
        </div>
      )}

      {!loading && evidence.length > 0 && (
        <div className="card animate-in overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Type</th>
                <th>Size</th>
                <th>Content Hash</th>
                <th>Upload Date</th>
                <th className="text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => {
                const IconComp = getFileIcon(e.mime_type)
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 flex-shrink-0">
                          <IconComp className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-xs">{e.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                        {getTypeLabel(e.mime_type)}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {e.size_bytes ? `${(e.size_bytes / 1024).toFixed(1)} KB` : '-'}
                    </td>
                    <td className="font-mono text-xs text-gray-400">
                      {e.content_hash?.slice(0, 12) ?? '-'}...
                    </td>
                    <td className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="text-right">
                      {e.file_key ? (
                        <button
                          onClick={() => handleDownload(e)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[#1B2A4A] hover:bg-[#1B2A4A]/5 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
