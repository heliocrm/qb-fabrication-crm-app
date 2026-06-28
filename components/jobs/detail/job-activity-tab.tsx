import {
  FileText,
  MessageSquare,
  Upload,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Activity, Job } from "@/types"

interface JobActivityTabProps {
  job: Job
}

function activityIcon(action: string) {
  if (action.toLowerCase().includes("upload")) return Upload
  if (action.toLowerCase().includes("change order")) return FileText
  if (action.toLowerCase().includes("task") || action.toLowerCase().includes("complete"))
    return Wrench
  return MessageSquare
}

export function JobActivityTab({ job }: JobActivityTabProps) {
  const activity = [...job.activity].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Activity Log</p>
        <p className="text-xs text-muted-foreground">
          Recent updates from PM, fab, and QC — newest first
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {activity.length} event{activity.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No activity recorded yet.
            </p>
          ) : (
            <div className="relative space-y-0">
              {activity.map((act: Activity, i) => {
                const Icon = activityIcon(act.action)
                const isLast = i === activity.length - 1

                return (
                  <div key={act.id} className="flex gap-4 pb-6 relative">
                    {!isLast && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                    )}
                    <div className="relative shrink-0">
                      <Avatar className="size-8 border-2 border-background">
                        <AvatarFallback className="text-[10px] font-bold bg-[var(--orange)] text-white">
                          {act.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-card border flex items-center justify-center">
                        <Icon className="size-2.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{act.user}</span>{" "}
                        <span className="text-muted-foreground">{act.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                        {act.timestamp}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
