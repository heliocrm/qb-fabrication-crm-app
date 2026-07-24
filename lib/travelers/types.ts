export type TravelerCatalogItem = {
  catalogId: string
  description: string
  structureNumber: string
}

export type ParsedWorkOrder = {
  customerPo: string
  orderDate: string
  customer: string
  catalogIds: string
  catalogItems: TravelerCatalogItem[]
}

export type TravelerGenerateFields = {
  customerPo: string
  orderDate: string
  customer: string
  revNumber: string
  catalogItems: TravelerCatalogItem[]
}

export type TravelerGeneration = {
  id: string
  organizationId: string
  jobId: string
  poNumber: string
  version: number
  customer: string | null
  orderDate: string | null
  revNumber: string | null
  structureNumbers: string | null
  catalogIds: string | null
  documentId: string | null
  generatedBy: string | null
  generatedAt: string
  webViewLink?: string | null
  documentName?: string | null
}
