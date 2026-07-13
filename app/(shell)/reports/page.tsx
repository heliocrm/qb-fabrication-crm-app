import { ReportsPageClient } from "@/components/reports/reports-page-client"
import { loadReportsData } from "@/lib/data/reports"
import { listReportViews } from "@/lib/supabase/services/report-views"

export default async function ReportsPage() {
  const [initialData, savedViews] = await Promise.all([
    loadReportsData(),
    listReportViews(),
  ])

  return (
    <ReportsPageClient initialData={initialData} savedViews={savedViews} />
  )
}
