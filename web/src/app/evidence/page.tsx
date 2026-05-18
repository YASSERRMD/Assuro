'use client'

import { useEffect, useRef, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listEvidence, uploadEvidence, type Evidence } from '@/lib/api/evidence'
import { FileText, Upload } from 'lucide-react'

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        <FileText className="h-7 w-7 text-gray-300" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">No evidence uploaded yet</p>
        <p className="mt-1 text-sm text-gray-400">Upload documents, reports, or audit files above to build your evidence library.</p>
      </div>
    </div>
  )
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const reload = () => {
    listEvidence().then(setEvidence).finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Evidence Library</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage compliance documents and audit evidence</p>
      </div>

      {/* Upload panel */}
      <div className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">Upload Evidence</h2>
        <p className="mt-0.5 text-xs text-gray-400">Supports PDF, DOCX, XLSX, images and other document formats</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Document title</label>
            <input
              ref={titleRef}
              type="text"
              placeholder="e.g. EU AI Act Risk Assessment Q2 2025"
              className="w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0f1f3d] focus:ring-1 focus:ring-[#0f1f3d]/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">File</label>
            <input
              ref={fileRef}
              type="file"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs file:font-medium"
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading} className="gap-2">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="mt-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && evidence.length === 0 && <EmptyState />}

      {!loading && evidence.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hash</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {evidence.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{e.mime_type || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {e.size_bytes ? `${(e.size_bytes / 1024).toFixed(1)} KB` : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {e.content_hash?.slice(0, 12) ?? '—'}…
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
