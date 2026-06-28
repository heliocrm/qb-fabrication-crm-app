import type { OppStage } from "@/types"

/** Active pipeline stages (Kanban columns 1–5) */
export const ACTIVE_STAGES: OppStage[] = [
  "Prospecting",
  "Qualification",
  "Estimating",
  "Proposal",
  "Negotiation",
]

/** Terminal outcomes — combined visually as Won / Lost */
export const TERMINAL_STAGES: OppStage[] = ["Won", "Lost"]

export const ALL_STAGES: OppStage[] = [...ACTIVE_STAGES, ...TERMINAL_STAGES]

export const stageColors: Record<OppStage, string> = {
  Prospecting: "border-t-slate-400",
  Qualification: "border-t-blue-400",
  Estimating: "border-t-sky-500",
  Proposal: "border-t-purple-500",
  Negotiation: "border-t-amber-500",
  Won: "border-t-green-500",
  Lost: "border-t-red-400",
}

export function isTerminalStage(stage: OppStage): boolean {
  return stage === "Won" || stage === "Lost"
}

export function formatOppValue(n: number): string {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${(n / 1_000).toFixed(0)}K`
}

export function formatCloseDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
