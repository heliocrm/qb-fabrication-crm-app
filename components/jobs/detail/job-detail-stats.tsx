import {
  Calendar,
  CheckSquare,
  Tag,
  Users,
  Weight,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatJobCurrency, formatJobDate } from "@/lib/job-detail-config"
import type { Job, Task } from "@/types"

interface JobDetailStatsProps {
  job: Job
  tasks: Task[]
  lineItemCount?: number
}

export function JobDetailStats({ job, tasks, lineItemCount }: JobDetailStatsProps) {
  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length

  const stats = [
    { icon: Weight, label: "Tonnage", value: `${job.tonnage} T` },
    { icon: Tag, label: "Value", value: formatJobCurrency(job.value) },
    {
      icon: Calendar,
      label: "Delivery",
      value: formatJobDate(job.deliveryDate),
    },
    {
      icon: CheckSquare,
      label: lineItemCount != null ? "Line Items" : "Tasks",
      value:
        lineItemCount != null
          ? `${lineItemCount} · ${completedTasks}/${totalTasks} tasks`
          : `${completedTasks}/${totalTasks}`,
    },
  ]

  return (
    <div className="bg-muted/30 border-b px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="size-4 text-[var(--orange)]" />
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {value}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={job.progress} className="h-2 w-24" />
          <span className="text-xs font-bold text-foreground tabular-nums">
            {job.progress}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Users className="size-4 text-muted-foreground" />
          <div className="flex -space-x-1.5">
            {job.assignedUsers?.map((user) => (
              <Avatar key={user.id} className="size-6 border-2 border-card">
                <AvatarFallback className="text-[9px] font-bold bg-[var(--orange)] text-white">
                  {user.avatarInitials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
