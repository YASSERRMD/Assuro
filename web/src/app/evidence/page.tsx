'use client'

import { useEffect, useRef, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Button } from '@/components/ui/Button'
import { listEvidence, uploadEvidence, type Evidence } from '@/lib/api/evidence'

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const reload = () => {
    listEvidence().then(setEvidence).finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const handleUpload = async (): Promise<void> => {
    const file = fileRef.current?.files?.[0]
    const title = titleRef.current?.value.trim()
    if (!file || !title) return
    setError('')
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
    } catch {
      setError('Upload failed. Check file size and try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-navy">Evidence Library</h1>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Upload evidence</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={titleRef}
            type="text"
            placeholder="Document title"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            ref={fileRef}
            type="file"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {!loading && evidence.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No evidence uploaded yet.</p>
      )}
      {!loading && evidence.length > 0 && (
        <table className="mt-4 w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-sm font-medium text-navy">Title</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Type</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Size</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Hash</th>
              <th className="py-2 text-left text-sm font-medium text-navy">Date</th>
            </tr>
          </thead>
          <tbody>
            {evidence.map((e) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="py-2 text-sm">{e.title}</td>
                <td className="py-2 text-xs text-gray-500">{e.mime_type || '-'}</td>
                <td className="py-2 text-xs text-gray-500">{e.size_bytes ? `${(e.size_bytes / 1024).toFixed(1)} KB` : '-'}</td>
                <td className="py-2 font-mono text-xs text-gray-400">{e.content_hash?.slice(0, 12) ?? '-'}...</td>
                <td className="py-2 text-sm">{new Date(e.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}
