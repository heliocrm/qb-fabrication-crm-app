import { ReportsPageClient } from "@/components/reports/reports-page-client"
import { canViewJobFinancials, getSessionContext } from "@/lib/auth/session"
import { loadReportsData } from "@/lib/data/reports"
import { listReportViews } from "@/lib/supabase/services/report-views"

export default async function ReportsPage() {
  const [initialData, savedViews, ctx] = await Promise.all([
    loadReportsData(),
    listReportViews(),
    getSessionContext(),
  ])
  const canViewFinancials = canViewJobFinancials(ctx?.role ?? "member")

  return (
    <ReportsPageClient
      initialData={initialData}
      savedViews={savedViews}
      canViewFinancials={canViewFinancials}
    />
  )
}
