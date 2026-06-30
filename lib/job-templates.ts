import type { JobTemplateType, TaskCategory } from "@/types/enums"

export type { JobTemplateType }

export interface TemplateChecklistItem {
  category: TaskCategory
  title: string
}

export interface JobTemplateDefinition {
  label: string
  description: string
  defaultLineItemTitle: string
  checklist: TemplateChecklistItem[]
}

/** Trello checklist names → CRM task categories */
const CAT = {
  programming: "Programming" as TaskCategory,
  machine: "Machine" as TaskCategory,
  fabrication: "Fabrication" as TaskCategory,
  qa: "Quality Assurance" as TaskCategory,
  shipping: "Shipping" as TaskCategory,
  office: "Office" as TaskCategory,
}

/** Sourced from Trello template boards (qb_project, crossarm, pedestal, miscellaneous) */
export const JOB_TEMPLATES: Record<JobTemplateType, JobTemplateDefinition> = {
  qb_project: {
    label: "QB Project",
    description: "Full substation / structural project with programming, machine, fab, QA, shipping, and office steps.",
    defaultLineItemTitle: "Type QTY ea and Short Item Name",
    checklist: [
      { category: CAT.programming, title: "Drawings Attached" },
      { category: CAT.programming, title: "Nested Cutting List Attached" },
      { category: CAT.programming, title: "AngleMaster Programming" },
      { category: CAT.programming, title: "Beam Line Programming" },
      { category: CAT.programming, title: "AutoCAD Plate Detailing" },
      { category: CAT.programming, title: "Plate Programming" },
      { category: CAT.machine, title: "AngleMaster Processing" },
      { category: CAT.machine, title: "Beamline Processing" },
      { category: CAT.machine, title: "Plate Processing" },
      { category: CAT.machine, title: "Bandsaw Cutting" },
      { category: CAT.fabrication, title: "Clipping" },
      { category: CAT.fabrication, title: "Bending" },
      { category: CAT.fabrication, title: "Beveling" },
      { category: CAT.fabrication, title: "Fitting" },
      { category: CAT.fabrication, title: "Welding" },
      { category: CAT.fabrication, title: "Grinding/Cleanup" },
      { category: CAT.fabrication, title: "Shearing" },
      { category: CAT.fabrication, title: "Manual Drilling" },
      { category: CAT.fabrication, title: "Countersinking" },
      { category: CAT.qa, title: "Trial Assembly/Visual Inspection" },
      { category: CAT.qa, title: "Customer Inspected and Approved" },
      { category: CAT.qa, title: "Schedule Inspection date with customer" },
      { category: CAT.qa, title: "Testing on welds if required!" },
      { category: CAT.shipping, title: "Send To Galvanizer" },
      { category: CAT.shipping, title: "Receive From Galvanizer" },
      { category: CAT.shipping, title: "Stenciling/Final Cleanup" },
      { category: CAT.shipping, title: "Create Bundling List Documents & Tags" },
      { category: CAT.shipping, title: "Shipment Prep Bundling/Boxing/Palletizing" },
      { category: CAT.shipping, title: "Item has been Shipped" },
      { category: CAT.office, title: "Send Mill Test Reports, Weld Certs and Galv Reports to customer" },
      { category: CAT.office, title: "Send Invoice to customer" },
      { category: CAT.office, title: "Attach Work Order To Trello Board" },
      { category: CAT.office, title: "Book Freight and Notify Customer of Ship Date" },
    ],
  },
  crossarm: {
    label: "Crossarm",
    description: "Crossarm production — beamline, hooks, stamping, and shipping checklist.",
    defaultLineItemTitle: "QTY AND CROSSARM NAME",
    checklist: [
      { category: CAT.programming, title: "Drawings/PO Attached" },
      { category: CAT.programming, title: "Nested Cutting List Attached" },
      { category: CAT.programming, title: "Beam Line Programming" },
      { category: CAT.programming, title: "AutoCAD Plate Detailing" },
      { category: CAT.programming, title: "Plate Programming" },
      { category: CAT.machine, title: "Beamline Processing" },
      { category: CAT.machine, title: "Bandsaw SS Pipe Cutting" },
      { category: CAT.machine, title: "Hook Processing" },
      { category: CAT.fabrication, title: "Stamping" },
      { category: CAT.fabrication, title: "Hook Beveling" },
      { category: CAT.fabrication, title: "Fitting" },
      { category: CAT.fabrication, title: "Welding" },
      { category: CAT.fabrication, title: "Grinding/Cleanup" },
      { category: CAT.fabrication, title: "Shearing" },
      { category: CAT.fabrication, title: "Punching 1/4\" Plate" },
      { category: CAT.fabrication, title: "Countersinking" },
      { category: CAT.fabrication, title: "Plate Beveling" },
      { category: CAT.fabrication, title: "Forming Hanger Strap" },
      { category: CAT.qa, title: "Visual Inspection" },
      { category: CAT.qa, title: "Customer Inspected and Approved" },
      { category: CAT.qa, title: "Schedule Inspection date with customer" },
      { category: CAT.qa, title: "Testing on welds if required!" },
      { category: CAT.shipping, title: "Stenciling/Final Cleanup" },
      { category: CAT.shipping, title: "Create Bundling List Documents & Tags" },
      { category: CAT.shipping, title: "Shipment Prep Bundling/Boxing/Palletizing" },
      { category: CAT.shipping, title: "Item has been Shipped" },
      { category: CAT.office, title: "Send Mill Test Reports, Weld Certs" },
      { category: CAT.office, title: "Send Invoice to customer" },
      { category: CAT.office, title: "Attach Work Order To Trello Board" },
      { category: CAT.office, title: "Book Freight and Notify Customer of Ship Date" },
    ],
  },
  pedestal: {
    label: "Pedestal",
    description: "Pedestal bases — plate programming, gusset/top/bottom plates, galvanizing.",
    defaultLineItemTitle: "Type QTY ea and Pedestal Name",
    checklist: [
      { category: CAT.programming, title: "Drawings" },
      { category: CAT.programming, title: "AutoCAD Plate Detailing" },
      { category: CAT.programming, title: "Plate Programming" },
      { category: CAT.machine, title: "Bandsaw Cutting" },
      { category: CAT.machine, title: "Gusset Plates" },
      { category: CAT.machine, title: "Top Plates" },
      { category: CAT.machine, title: "Bottom Plates" },
      { category: CAT.fabrication, title: "Angle Clipping/Drill Drain Holes" },
      { category: CAT.fabrication, title: "Fitting" },
      { category: CAT.fabrication, title: "Welding" },
      { category: CAT.fabrication, title: "Grinding/Cleanup" },
      { category: CAT.fabrication, title: "Plate Countersinking/Tapping" },
      { category: CAT.fabrication, title: "Cut Pipe Drain Holes" },
      { category: CAT.qa, title: "Visual Inspection" },
      { category: CAT.qa, title: "Customer Inspected and Approved" },
      { category: CAT.qa, title: "Schedule Inspection date with customer" },
      { category: CAT.qa, title: "Testing on welds if required!" },
      { category: CAT.shipping, title: "Send To Galvanizer" },
      { category: CAT.shipping, title: "Receive From Galvanizer" },
      { category: CAT.shipping, title: "Stenciling/Final Cleanup" },
      { category: CAT.shipping, title: "Create Bundling List Documents & Tags" },
      { category: CAT.shipping, title: "Shipment Prep Bundling/Boxing/Palletizing" },
      { category: CAT.shipping, title: "Item has been Shipped" },
      { category: CAT.office, title: "Send Mill Test Reports, Weld Certs and Galv Reports to customer" },
      { category: CAT.office, title: "Send Invoice to customer" },
      { category: CAT.office, title: "Attach Work Order To Trello Board" },
      { category: CAT.office, title: "Book Freight and Notify Customer of Ship Date" },
    ],
  },
  miscellaneous: {
    label: "Miscellaneous",
    description: "General fab work — flexible checklist for one-off items.",
    defaultLineItemTitle: "Type QTY ea and Short Item Name",
    checklist: [
      { category: CAT.programming, title: "Drawings Attached" },
      { category: CAT.programming, title: "Nested Cutting List Attached" },
      { category: CAT.programming, title: "AutoCAD Plate Detailing" },
      { category: CAT.programming, title: "Plate Programming" },
      { category: CAT.programming, title: "AngleMaster Programming" },
      { category: CAT.machine, title: "AngleMaster Processing" },
      { category: CAT.machine, title: "Plate Processing" },
      { category: CAT.machine, title: "Bandsaw Cutting" },
      { category: CAT.fabrication, title: "Bending" },
      { category: CAT.fabrication, title: "Grinding/Cleanup" },
      { category: CAT.fabrication, title: "Shearing" },
      { category: CAT.fabrication, title: "Manual Drilling" },
      { category: CAT.qa, title: "Visual Inspection" },
      { category: CAT.qa, title: "Customer Inspected and Approved" },
      { category: CAT.qa, title: "Schedule Inspection date with customer" },
      { category: CAT.shipping, title: "Send To Galvanizer" },
      { category: CAT.shipping, title: "Receive From Galvanizer" },
      { category: CAT.shipping, title: "Stenciling/Final Cleanup" },
      { category: CAT.shipping, title: "Create Bundling List Documents & Tags" },
      { category: CAT.shipping, title: "Shipment Prep Bundling/Boxing/Palletizing" },
      { category: CAT.shipping, title: "Item has been Shipped" },
      { category: CAT.office, title: "Send Mill Test Reports, Weld Certs and Galv Reports to customer" },
      { category: CAT.office, title: "Send Invoice to customer" },
      { category: CAT.office, title: "Attach Work Order To Trello Board" },
      { category: CAT.office, title: "Book Freight and Notify Customer of Ship Date" },
    ],
  },
}

export const JOB_TEMPLATE_OPTIONS = (
  Object.entries(JOB_TEMPLATES) as [JobTemplateType, JobTemplateDefinition][]
).map(([value, def]) => ({ value, label: def.label, description: def.description }))

export function getTemplateChecklist(template: JobTemplateType): TemplateChecklistItem[] {
  return JOB_TEMPLATES[template].checklist
}

export function getDefaultLineItemTitle(template: JobTemplateType): string {
  return JOB_TEMPLATES[template].defaultLineItemTitle
}
