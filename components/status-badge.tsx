import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { JobStatus, Priority, OppStage } from "@/types"

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config: Record<JobStatus, { label: string; className: string }> = {
    "To Do":      { label: "To Do",      className: "bg-secondary text-secondary-foreground border" },
    "In Progress":{ label: "In Progress",className: "bg-blue-100 text-blue-800 border-blue-200" },
    "QC":         { label: "QC",         className: "bg-purple-100 text-purple-800 border-purple-200" },
    "Shipping":   { label: "Shipping",   className: "bg-amber-100 text-amber-800 border-amber-200" },
    "Delivered":  { label: "Delivered",  className: "bg-green-100 text-green-800 border-green-200" },
  }
  const c = config[status]
  return <Badge className={cn("text-xs font-medium border", c.className)}>{c.label}</Badge>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; className: string }> = {
    Normal: { label: "Normal", className: "bg-secondary text-secondary-foreground border" },
    Hot:    { label: "Hot",    className: "bg-orange-100 text-orange-700 border-orange-200" },
    Urgent: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200" },
  }
  const c = config[priority]
  return <Badge className={cn("text-xs font-medium border", c.className)}>{c.label}</Badge>
}

export function StageBadge({ stage }: { stage: OppStage }) {
  const config: Record<OppStage, { className: string }> = {
    Prospecting: { className: "bg-secondary text-secondary-foreground border" },
    Qualification: { className: "bg-blue-50 text-blue-700 border-blue-200" },
    Estimating:  { className: "bg-sky-100 text-sky-700 border-sky-200" },
    Proposal:    { className: "bg-purple-100 text-purple-700 border-purple-200" },
    Negotiation: { className: "bg-amber-100 text-amber-700 border-amber-200" },
    Won:         { className: "bg-green-100 text-green-700 border-green-200" },
    Lost:        { className: "bg-red-100 text-red-700 border-red-200" },
  }
  const c = config[stage]
  return <Badge className={cn("text-xs font-medium border", c.className)}>{stage}</Badge>
}
