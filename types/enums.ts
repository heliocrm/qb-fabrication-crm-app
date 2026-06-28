/** Shared enum / union types used across CRM entities */

export type JobStatus = "To Do" | "In Progress" | "QC" | "Shipping" | "Delivered"

export type Priority = "Normal" | "Hot" | "Urgent"

export type OppStage =
  | "Prospecting"
  | "Qualification"
  | "Estimating"
  | "Proposal"
  | "Negotiation"
  | "Won"
  | "Lost"

export type TaskCategory = "Fabrication" | "QC" | "Logistics" | "Engineering"

export type DocumentType = "Drawing" | "Work Order" | "Inspection" | "Shipping" | "PO"

export type ChangeOrderType = "Change Order" | "Issue" | "NCR"

export type ChangeOrderStatus = "Open" | "Resolved" | "Pending Approval"

export type AccountStatus = "Active" | "Inactive"

export type OrganizationRole = "owner" | "admin" | "manager" | "member" | "viewer"
