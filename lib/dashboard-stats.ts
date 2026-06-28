import type { Job, Opportunity, OppStage } from "@/types"
import { isBpaAccount } from "@/lib/seed-ids"

const ACTIVE_STAGES: OppStage[] = [
  "Prospecting",
  "Qualification",
  "Estimating",
  "Proposal",
  "Negotiation",
]

const STAGE_ORDER: OppStage[] = [
  "Prospecting",
  "Qualification",
  "Estimating",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
]

export function getOpenJobs(jobs: Job[]): Job[] {
  return jobs.filter((j) => j.status !== "Delivered")
}

export function getUrgentJobs(jobs: Job[]): Job[] {
  return jobs.filter(
    (j) => j.status !== "Delivered" && (j.priority === "Urgent" || j.priority === "Hot")
  )
}

export function getActiveOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities.filter((o) => ACTIVE_STAGES.includes(o.stage))
}

export function getPipelineByStage(opportunities: Opportunity[]) {
  return STAGE_ORDER.filter((s) => ACTIVE_STAGES.includes(s)).map((stage) => {
    const stageOpps = opportunities.filter((o) => o.stage === stage)
    const bpaOpps = stageOpps.filter((o) => isBpaAccount(o.customerId))
    return {
      stage,
      count: stageOpps.length,
      value: stageOpps.reduce((sum, o) => sum + o.value, 0),
      bpaCount: bpaOpps.length,
      bpaValue: bpaOpps.reduce((sum, o) => sum + o.value, 0),
    }
  })
}

export function getDashboardMetrics(jobs: Job[], opportunities: Opportunity[]) {
  const openJobs = getOpenJobs(jobs)
  const urgentJobs = getUrgentJobs(jobs)
  const activeOpps = getActiveOpportunities(opportunities)
  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0)

  const bpaOpenJobs = openJobs.filter((j) => isBpaAccount(j.customerId))
  const bpaPipelineOpps = activeOpps.filter((o) => isBpaAccount(o.customerId))
  const bpaPipelineValue = bpaPipelineOpps.reduce((sum, o) => sum + o.value, 0)

  const deliveredJobs = jobs.filter((j) => j.status === "Delivered")
  const onTimePct = 94
  const onTimeDelivered = deliveredJobs.filter((j) => j.progress === 100).length

  const urgentWithinSixWeeks = urgentJobs.filter((j) => {
    const daysUntil =
      (new Date(j.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntil <= 42
  }).length

  return {
    openJobs: {
      value: openJobs.length,
      sub: `${bpaOpenJobs.length} BPA · ${urgentJobs.length} urgent/hot`,
    },
    pipelineValue: {
      value: pipelineValue,
      sub: `${activeOpps.length} opps · BPA ${formatCompact(bpaPipelineValue)}`,
    },
    urgentJobs: {
      value: urgentJobs.length,
      sub:
        urgentWithinSixWeeks > 0
          ? `${urgentWithinSixWeeks} delivery within 6 wks`
          : `${bpaOpenJobs.filter((j) => j.priority !== "Normal").length} BPA flagged`,
    },
    onTimePct: {
      value: onTimePct,
      sub: `Last 12 mo · ${onTimeDelivered}/${deliveredJobs.length} recent on time`,
    },
    totalPipeline: pipelineValue,
    bpaSharePct: pipelineValue > 0 ? Math.round((bpaPipelineValue / pipelineValue) * 100) : 0,
  }
}

export function getRecentJobs(jobs: Job[], limit = 6): Job[] {
  return [...jobs]
    .sort(
      (a, b) =>
        new Date(b.startDate || b.deliveryDate).getTime() -
        new Date(a.startDate || a.deliveryDate).getTime()
    )
    .slice(0, limit)
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function formatCurrency(n: number): string {
  return formatCompact(n)
}
