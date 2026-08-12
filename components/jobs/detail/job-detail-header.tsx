"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronRight,
  Edit,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { deleteJobAction } from "@/lib/actions/jobs"
import { toast } from "@/lib/toast"
import type { Job } from "@/types"

interface JobDetailHeaderProps {
  job: Job
  canWrite?: boolean
  onOpenTraveler?: () => void
  onEdit?: () => void
  onAddTask?: () => void
  onLogIssue?: () => void
}

export function JobDetailHeader({
  job,
  canWrite = true,
  onOpenTraveler,
  onEdit,
  onAddTask,
  onLogIssue,
}: JobDetailHeaderProps) {
  const router = useRouter()

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete job ${job.jobNumber}? Linked Google Drive folder will be moved to trash. This cannot be undone.`
      )
    ) {
      return
    }
    const result = await deleteJobAction(job.id)
    if (result.error) {
      toast.error("Could not delete job", result.error)
      return
    }
    if (result.data?.driveFailed) {
      toast.success(
        "Job deleted",
        "Drive folder could not be trashed — remove it manually if needed."
      )
    } else {
      toast.success("Job deleted")
    }
    router.push("/jobs")
    router.refresh()
  }

  return (
    <div className="border-b bg-card px-4 sm:px-6 py-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Link href="/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground font-medium">{job.jobNumber}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {job.description}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <span className="text-xs font-mono font-semibold text-[var(--orange)] bg-[var(--orange-muted)] dark:bg-[var(--orange)]/10 px-2 py-0.5 rounded">
              {job.poNumber}
            </span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-xs text-muted-foreground">{job.customer}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenTraveler ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 min-h-10 touch-manipulation"
              onClick={onOpenTraveler}
            >
              <FileText className="size-4" data-icon="inline-start" />
              Import traveler
            </Button>
          ) : null}
          <Link href="/jobs">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" data-icon="inline-start" />
              Back
            </Button>
          </Link>
          {canWrite ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onEdit}
              >
                <Edit className="size-4" data-icon="inline-start" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
                onClick={onAddTask}
              >
                <Plus className="size-4" data-icon="inline-start" />
                Add Task
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onLogIssue}>
                    Log issue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void handleDelete()}
                  >
                    <Trash2 className="size-4" />
                    Delete job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
