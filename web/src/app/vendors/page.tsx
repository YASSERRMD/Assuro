'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { useToast } from '@/components/ui/Toast'
import { listVendors, createVendor, type Vendor } from '@/lib/api/vendors'
import { Building2, Plus, X, Globe, ExternalLink } from 'lucide-react'

const riskBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
  unknown: 'bg-gray-100 text-gray-500',
}

const categoryColors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
]

function getCategoryColor(name: string) {
  const idx = name.charCodeAt(0) % categoryColors.length
  return categoryColors[idx]
}

function AddVendorModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (v: Vendor) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [description, setDescription] = useState('')
  const [riskLevel, setRiskLevel] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const vendor = await createVendor({ name, website, contact_email: contactEmail, description, risk_level: riskLevel, status: 'active' })
      toast('Vendor added.', 'success')
      onCreated(vendor)
    } catch {
      toast('Failed to add vendor.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add Vendor</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Vendor Name</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this vendor provide?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Website</label>
              <input
                className="input-base"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Contact Email</label>
              <input
                className="input-base"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@..."
              />
            </div>
          </div>
          <div>
            <label className="label">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="input-base"
            >
              {['low', 'medium', 'high', 'critical'].map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    listVendors()
      .then(setVendors)
      .catch(() => setVendors([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">Third-party AI vendors and risk assessments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d1526] transition-colors"
        >
          <Plus className="h-4 w-4" />Add Vendor
        </button>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="shimmer h-5 rounded w-40" />
              <div className="shimmer h-4 rounded w-full" />
              <div className="shimmer h-5 rounded-full w-16" />
              <div className="shimmer h-8 rounded-lg w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && vendors.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
          <p className="empty-title">No vendors tracked</p>
          <p className="empty-body">Add your first AI vendor to start risk tracking.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Plus className="h-4 w-4" />Add Vendor
          </button>
        </div>
      )}

      {!loading && vendors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B2A4A]/6">
                    <Building2 className="h-4 w-4 text-[#1B2A4A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{vendor.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryColor(vendor.name)}`}>
                      AI Vendor
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${riskBadge[vendor.risk_level] ?? 'bg-gray-100 text-gray-500'}`}>
                  {vendor.risk_level}
                </span>
              </div>

              {vendor.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{vendor.description}</p>
              )}

              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  {vendor.website.replace(/^https?:\/\//, '')}
                </a>
              )}

              <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-50">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${vendor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} capitalize`}>
                  {vendor.status}
                </span>
                <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[#1B2A4A] hover:bg-[#1B2A4A]/5 transition">
                  <ExternalLink className="h-3 w-3" />
                  View Assessments
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <AddVendorModal
          onClose={() => setShowCreate(false)}
          onCreated={(v) => { setVendors((prev) => [v, ...prev]); setShowCreate(false) }}
        />
      )}
    </Shell>
  )
}
