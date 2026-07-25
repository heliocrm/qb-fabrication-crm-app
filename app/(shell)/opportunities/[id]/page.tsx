import { notFound } from "next/navigation"
import { OpportunityDetailClient } from "@/components/opportunities/opportunity-detail-client"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  getOpportunityById,
  listJobsForOpportunity,
  type LinkedJobSummary,
} from "@/lib/supabase/services/opportunities"
import type { Opportunity } from "@/types"

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    notFound()
  }

  let opportunity: Opportunity | null = null
  let linkedJobs: LinkedJobSummary[] = []
  try {
    opportunity = await getOpportunityById(id)
    if (opportunity) {
      linkedJobs = await listJobsForOpportunity(id)
    }
  } catch {
    notFound()
  }

  if (!opportunity) notFound()

  return (
    <OpportunityDetailClient
      opportunity={opportunity}
      linkedJobs={linkedJobs}
      dataSource="supabase"
    />
  )
}
