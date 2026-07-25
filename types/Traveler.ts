import type { TravelerCatalogItem } from "@/lib/travelers/types"

export type TravelerStatus = "draft" | "active" | "superseded"

/** Domain model — digital traveler header + lines */
export interface TravelerLine {
  id: string
  organizationId: string
  travelerId: string
  jobId: string
  lineNumber: string | null
  quantity: number
  catalogId: string
  description: string | null
  structureNumber: string | null
  lineItemId: string | null
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface Traveler {
  id: string
  organizationId: string
  jobId: string
  poNumber: string
  customer: string | null
  orderDate: string | null
  revNumber: string | null
  qbSalesOrder: string | null
  shipDate: string | null
  sourceDocumentId: string | null
  version: number
  status: TravelerStatus
  importedBy: string | null
  importedAt: string
  createdAt?: string
  updatedAt?: string
  lines: TravelerLine[]
}

export interface TravelerRow {
  id: string
  organization_id: string
  job_id: string
  po_number: string
  customer: string | null
  order_date: string | null
  rev_number: string | null
  qb_sales_order: string | null
  ship_date: string | null
  source_document_id: string | null
  version: number
  status: TravelerStatus
  imported_by: string | null
  imported_at: string
  created_at: string
  updated_at: string
}

export interface TravelerLineRow {
  id: string
  organization_id: string
  traveler_id: string
  job_id: string
  line_number: string | null
  quantity: number
  catalog_id: string
  description: string | null
  structure_number: string | null
  line_item_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type TravelerImportFields = {
  customerPo: string
  orderDate: string
  customer: string
  revNumber: string
  qbSalesOrder?: string
  shipDate?: string
  catalogItems: TravelerCatalogItem[]
}
