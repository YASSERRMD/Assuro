'use client'

import { useEffect, useState } from 'react'
import { Shell } from '@/components/shell/Shell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { listVendors, createVendor, type Vendor } from '@/lib/api/vendors'
import { Building2, Plus, X, Globe, Mail } from 'lucide-react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

const riskVariant = (risk: string): BadgeVariant => {
  if (risk === 'high' || risk === 'critical') return 'danger'
  if (risk === 'medium') return 'warning'
  if (risk === 'low') return 'success'
  return 'default'
}

function AddVendorModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (v: Vendor) => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [riskLevel, setRiskLevel] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const vendor = await createVendor({ name, website, contact_email: contactEmail, risk_level: riskLevel, status: 'active' })
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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add Vendor</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input label="Vendor Name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Company name" required />
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com" />
          <Input label="Contact Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@example.com" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Risk Level</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#0f1f3d] focus:ring-2 focus:ring-[#0f1f3d]/10">
              {['low', 'medium', 'high', 'critical'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Vendor'}</Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track third-party AI vendors and their risk levels</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-4 w-40" />
            </Card>
          ))}
        </div>
      )}

      {!loading && vendors.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
            <Building2 className="h-8 w-8 text-purple-200" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No vendors tracked</p>
            <p className="mt-1 text-sm text-gray-400">Add your first AI vendor to start risk tracking.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Vendor
          </Button>
        </div>
      )}

      {!loading && vendors.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f1f3d]/5">
                    <Building2 className="h-4 w-4 text-[#0f1f3d]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
                    <Badge variant={riskVariant(vendor.risk_level)} className="capitalize mt-0.5">{vendor.risk_level} risk</Badge>
                  </div>
                </div>
              </div>
              {vendor.website && (
                <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Globe className="h-3 w-3" />
                  {vendor.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {vendor.contact_email && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  {vendor.contact_email}
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <Badge variant={vendor.status === 'active' ? 'success' : 'default'} className="capitalize">
                  {vendor.status}
                </Badge>
                <span className="text-xs text-gray-400">{new Date(vendor.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
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
