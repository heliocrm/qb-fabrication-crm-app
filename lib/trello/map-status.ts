import { JOB_STATUSES } from "@/lib/jobs-config"
import type {
  JobStatus,
  JobTemplateType,
  LineItemWipStatus,
  TaskCategory,
} from "@/types"

const JOB_STATUS_RANK: Record<JobStatus, number> = {
  "To Do": 0,
  "In Progress": 1,
  QC: 2,
  Shipping: 3,
  Delivered: 4,
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
}

/** Map a Trello list name to CRM job status when possible. */
export function mapListNameToJobStatus(listName: string): JobStatus | null {
  const n = normalize(listName)

  for (const status of JOB_STATUSES) {
    if (n === normalize(status)) return status
  }

  if (
    n.includes("deliver") ||
    n === "done" ||
    n === "complete" ||
    n === "completed" ||
    n === "closed" ||
    n === "shipped"
  ) {
    return "Delivered"
  }
  if (n.includes("ship")) return "Shipping"
  if (
    n === "qc" ||
    n.includes("quality") ||
    n.includes("inspect") ||
    n === "qa"
  ) {
    return "QC"
  }
  if (
    n.includes("progress") ||
    n.includes("doing") ||
    n.includes("active") ||
    n.includes("fab") ||
    n.includes("machine") ||
    n.includes("program")
  ) {
    return "In Progress"
  }
  if (n.includes("to do") || n === "todo" || n.includes("backlog") || n === "new") {
    return "To Do"
  }

  return null
}

export function mapListNameToWipStatus(listName: string): LineItemWipStatus {
  const jobStatus = mapListNameToJobStatus(listName)
  if (jobStatus === "Delivered") return "Done"
  if (
    jobStatus === "In Progress" ||
    jobStatus === "QC" ||
    jobStatus === "Shipping"
  ) {
    return "Doing"
  }

  const n = normalize(listName)
  if (n === "done" || n === "complete" || n === "completed") return "Done"
  if (n.includes("doing") || n.includes("progress")) return "Doing"
  return "To Do"
}

export function furthestJobStatus(statuses: JobStatus[]): JobStatus {
  if (statuses.length === 0) return "To Do"
  return statuses.reduce((best, cur) =>
    JOB_STATUS_RANK[cur] > JOB_STATUS_RANK[best] ? cur : best
  )
}

export function mapChecklistNameToCategory(checklistName: string): TaskCategory {
  const n = normalize(checklistName)
  if (n.includes("program") || n.includes("engineer") || n.includes("draw")) {
    return "Programming"
  }
  if (n.includes("machine") || n.includes("beam") || n.includes("angle") || n.includes("plate process")) {
    return "Machine"
  }
  if (
    n.includes("fab") ||
    n.includes("weld") ||
    n.includes("fit") ||
    n.includes("grind") ||
    n.includes("bend")
  ) {
    return "Fabrication"
  }
  if (n.includes("quality") || n.includes("qa") || n.includes("qc") || n.includes("inspect")) {
    return "Quality Assurance"
  }
  if (n.includes("ship") || n.includes("galv") || n.includes("bundle") || n.includes("freight")) {
    return "Shipping"
  }
  if (n.includes("office") || n.includes("invoice") || n.includes("admin")) {
    return "Office"
  }
  return "Fabrication"
}

export function inferJobTemplate(
  boardName: string,
  labelNames: string[]
): JobTemplateType {
  const hay = normalize([boardName, ...labelNames].join(" "))
  if (hay.includes("crossarm") || hay.includes("cross arm")) return "crossarm"
  if (hay.includes("pedestal")) return "pedestal"
  if (
    hay.includes("qb project") ||
    hay.includes("substation") ||
    hay.includes("structural")
  ) {
    return "qb_project"
  }
  return "miscellaneous"
}

/** Prefer board name when it looks like a job number; else TR-{shortId}. */
export function deriveJobNumber(boardName: string, boardId: string): string {
  const trimmed = boardName.trim()
  if (/^[A-Za-z0-9][A-Za-z0-9._\/-]{1,40}$/.test(trimmed) && !/\s{2,}/.test(trimmed)) {
    // Allow spaces only if overall looks like a compact code (no multi-word sentences)
    if (!/\s/.test(trimmed) || /^[A-Za-z]{1,6}[-\s]?\d/.test(trimmed)) {
      return trimmed.replace(/\s+/g, "-").slice(0, 48)
    }
  }
  const codeMatch = trimmed.match(
    /\b((?:QB[-\s]?)?\d{4}[-\s]?\d{2,}|WO[-\s]?\d{4,}|\d{6,})\b/i
  )
  if (codeMatch?.[1]) {
    return codeMatch[1].replace(/\s+/g, "-").slice(0, 48)
  }
  return `TR-${boardId.slice(0, 8)}`
}
