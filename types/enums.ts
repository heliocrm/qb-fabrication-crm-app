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

export type TaskCategory =
  | "Programming"
  | "Machine"
  | "Fabrication"
  | "Quality Assurance"
  | "Shipping"
  | "Office"

export type JobTemplateType = "qb_project" | "crossarm" | "pedestal" | "miscellaneous"

export type LineItemWipStatus = "To Do" | "Doing" | "Done"

export type DocumentType = "Drawing" | "Work Order" | "Inspection" | "Shipping" | "PO"

export type ChangeOrderType = "Change Order" | "Issue" | "NCR"

export type ChangeOrderStatus = "Open" | "Resolved" | "Pending Approval"

export type AccountStatus = "Active" | "Inactive"

export type OrganizationRole = "admin" | "manager" | "member" | "viewer"

export type MaterialPullStatus =
  | "pending"
  | "approved"
  | "batched"
  | "pulled"
  | "cancelled"
