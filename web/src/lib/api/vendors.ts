import { typedFetch } from '@/lib/api'

export interface Vendor {
  id: string
  name: string
  description: string
  website: string
  contact_email: string
  risk_level: string
  status: string
  created_at: string
  updated_at: string
}

export interface VendorAssessment {
  id: string
  vendor_id: string
  title: string
  status: string
  score?: number
  assessed_at?: string
  created_at: string
}

export async function listVendors(): Promise<Vendor[]> {
  return typedFetch<Vendor[]>('/v1/vendors')
}

export async function createVendor(data: Partial<Vendor>): Promise<Vendor> {
  return typedFetch<Vendor>('/v1/vendors', { method: 'POST', body: JSON.stringify(data) })
}

export async function listVendorAssessments(vendorId: string): Promise<VendorAssessment[]> {
  return typedFetch<VendorAssessment[]>(`/v1/vendors/${vendorId}/assessments`)
}

export async function createVendorAssessment(vendorId: string, data: Partial<VendorAssessment>): Promise<VendorAssessment> {
  return typedFetch<VendorAssessment>(`/v1/vendors/${vendorId}/assessments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
