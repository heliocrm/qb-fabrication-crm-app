"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobDetailHeader } from "@/components/jobs/detail/job-detail-header"
import { JobDetailStats } from "@/components/jobs/detail/job-detail-stats"
import { JobOverviewTab } from "@/components/jobs/detail/job-overview-tab"
import { JobTasksTab } from "@/components/jobs/detail/job-tasks-tab"
import { JobDocumentsTab } from "@/components/jobs/detail/job-documents-tab"
import { JobChangeOrdersTab } from "@/components/jobs/detail/job-change-orders-tab"
import { JobActivityTab } from "@/components/jobs/detail/job-activity-tab"
import type { Job } from "@/types"

interface JobDetailClientProps {
  job: Job
  dataSource?: "supabase" | "mock"
}

export function JobDetailClient({ job, dataSource }: JobDetailClientProps) {
  const [tasks, setTasks] = useState(job.tasks)
  const completedTasks = tasks.filter((t) => t.completed).length
  const openTasks = tasks.length - completedTasks

  return (
    <div className="flex flex-col min-h-full">
      <JobDetailHeader job={job} />
      <JobDetailStats job={job} tasks={tasks} />

      {dataSource === "supabase" && (
        <p className="px-4 sm:px-6 pt-2 text-xs text-[var(--orange)]">
          Live data · task changes sync to Supabase
        </p>
      )}

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5">
              Tasks
              {openTasks > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {openTasks}
                </Badge>
              )}
            </TabsTrigger>
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
            <JobOverviewTab job={job} tasks={tasks} />
          </TabsContent>

          <TabsContent value="tasks">
            <JobTasksTab
              tasks={tasks}
              onTasksChange={setTasks}
              jobId={dataSource === "supabase" ? job.id : undefined}
            />
          </TabsContent>

          <TabsContent value="documents">
            <JobDocumentsTab
              job={job}
              jobId={dataSource === "supabase" ? job.id : undefined}
              dataSource={dataSource}
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
    </div>
  )
}
