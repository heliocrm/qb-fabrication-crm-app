"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobDetailHeader } from "@/components/jobs/detail/job-detail-header"
import { JobDetailStats } from "@/components/jobs/detail/job-detail-stats"
import { JobOverviewTab } from "@/components/jobs/detail/job-overview-tab"
import { JobLineItemsTab } from "@/components/jobs/detail/job-line-items-tab"
import { JobDocumentsTab } from "@/components/jobs/detail/job-documents-tab"
import { JobChangeOrdersTab } from "@/components/jobs/detail/job-change-orders-tab"
import { JobActivityTab } from "@/components/jobs/detail/job-activity-tab"
import { JobTravelerTab } from "@/components/jobs/detail/job-traveler-tab"
import { GenerateTravelerDialog } from "@/components/travelers/generate-traveler-dialog"
import { flattenLineItemTasks } from "@/lib/job-detail-config"
import type { DocumentType, Job, LineItem } from "@/types"

type JobDetailTab =
  | "overview"
  | "line-items"
  | "traveler"
  | "documents"
  | "changes"
  | "activity"

const TAB_VALUES: JobDetailTab[] = [
  "overview",
  "line-items",
  "traveler",
  "documents",
  "changes",
  "activity",
]

interface JobDetailClientProps {
  job: Job
  dataSource?: "supabase" | "mock"
  canWrite?: boolean
  canManageAssignees?: boolean
}

export function JobDetailClient({
  job,
  dataSource,
  canWrite = true,
  canManageAssignees = false,
}: JobDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lineItems, setLineItems] = useState<LineItem[]>(job.lineItems ?? [])
  const [tab, setTab] = useState<JobDetailTab>("overview")
  const [travelerOpen, setTravelerOpen] = useState(false)
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0)
  const [travelerRefreshKey, setTravelerRefreshKey] = useState(0)
  const [documentsTypeFilter, setDocumentsTypeFilter] = useState<
    "all" | DocumentType
  >("all")
  const tasks = useMemo(() => flattenLineItemTasks(lineItems), [lineItems])
  const openTasks = tasks.filter((t) => !t.completed).length

  useEffect(() => {
    const q = searchParams.get("tab")
    if (q && TAB_VALUES.includes(q as JobDetailTab)) {
      setTab(q as JobDetailTab)
    }
  }, [searchParams])

  function handleTravelerImported() {
    setTab("traveler")
    setTravelerRefreshKey((k) => k + 1)
    setDocumentsRefreshKey((k) => k + 1)
    router.refresh()
  }

  return (
    <div className="flex flex-col min-h-full">
      <JobDetailHeader
        job={job}
        onOpenTraveler={() => setTravelerOpen(true)}
      />
      <JobDetailStats job={job} tasks={tasks} lineItemCount={lineItems.length} />

      {dataSource === "supabase" && (
        <p className="px-4 sm:px-6 pt-2 text-xs text-[var(--orange)]">
          Live data · line item and task changes sync to Supabase
        </p>
      )}

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as JobDetailTab)}
          className="space-y-6"
        >
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="line-items" className="gap-1.5">
              Line Items
              {openTasks > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {openTasks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="traveler">Traveler</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              Documents
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {job.documents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="changes" className="gap-1.5">
              Change Orders
              {job.changeOrders.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {job.changeOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <JobOverviewTab
              job={job}
              lineItems={lineItems}
              tasks={tasks}
              canManageAssignees={canManageAssignees && dataSource === "supabase"}
            />
          </TabsContent>

          <TabsContent value="line-items">
            <JobLineItemsTab
              lineItems={lineItems}
              onLineItemsChange={setLineItems}
              jobId={dataSource === "supabase" && canWrite ? job.id : undefined}
              jobTemplate={job.jobTemplate}
            />
          </TabsContent>

          <TabsContent value="traveler">
            <JobTravelerTab
              jobId={job.id}
              canWrite={canWrite && dataSource === "supabase"}
              onImport={() => setTravelerOpen(true)}
              refreshKey={travelerRefreshKey}
            />
          </TabsContent>

          <TabsContent value="documents">
            <JobDocumentsTab
              job={{ ...job, lineItems }}
              jobId={dataSource === "supabase" ? job.id : undefined}
              dataSource={dataSource}
              readOnly={!canWrite}
              onGenerateTraveler={() => setTravelerOpen(true)}
              refreshKey={documentsRefreshKey}
              typeFilter={documentsTypeFilter}
              onTypeFilterChange={setDocumentsTypeFilter}
            />
          </TabsContent>

          <TabsContent value="changes">
            <JobChangeOrdersTab job={job} />
          </TabsContent>

          <TabsContent value="activity">
            <JobActivityTab job={job} />
          </TabsContent>
        </Tabs>
      </div>

      <GenerateTravelerDialog
        open={travelerOpen}
        onOpenChange={setTravelerOpen}
        jobId={job.id}
        jobNumber={job.jobNumber}
        poNumber={job.poNumber}
        description={job.description}
        onGenerated={handleTravelerImported}
      />
    </div>
  )
}
