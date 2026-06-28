import Link from "next/link"
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Mail,
  MapPin,
  Phone,
  Tag,
  Weight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  TASK_CATEGORIES,
  formatJobCurrency,
  formatJobDate,
  taskCategoryStyles,
} from "@/lib/job-detail-config"
import { accounts } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Job, Task } from "@/types"

interface JobOverviewTabProps {
  job: Job
  tasks: Task[]
}

export function JobOverviewTab({ job, tasks }: JobOverviewTabProps) {
  const account = accounts.find((a) => a.id === job.customerId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PO & job info */}
        <Card className="border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-[var(--orange)]" />
              PO & Job Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { label: "PO Number", value: job.poNumber, mono: true, highlight: true },
              { label: "Job Number", value: job.jobNumber, mono: true },
              { label: "Contract Value", value: formatJobCurrency(job.value) },
              { label: "Start Date", value: formatJobDate(job.startDate) },
              { label: "Delivery Date", value: formatJobDate(job.deliveryDate) },
            ].map(({ label, value, mono, highlight }, i, arr) => (
              <div key={label}>
                <div className="flex justify-between items-baseline gap-3 py-2.5">
                  <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                  <span
                    className={cn(
                      "text-xs font-medium text-right",
                      mono && "font-mono",
                      highlight && "text-[var(--orange)] font-bold"
                    )}
                  >
                    {value}
                  </span>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Customer */}
        <Card className="border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="size-4 text-[var(--orange)]" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{job.customer}</p>
              {account && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3" />
                  {account.city}, {account.state}
                </p>
              )}
            </div>
            {account && (
              <>
                <Separator />
                <div className="space-y-2 text-xs">
                  <p className="font-medium text-foreground">{account.contact}</p>
                  <a
                    href={`mailto:${account.email}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-[var(--orange)]"
                  >
                    <Mail className="size-3" />
                    {account.email}
                  </a>
                  <a
                    href={`tel:${account.phone}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-[var(--orange)]"
                  >
                    <Phone className="size-3" />
                    {account.phone}
                  </a>
                </div>
                <Link href="/customers">
                  <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-muted">
                    View account →
                  </Badge>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Key specs */}
        <Card className="border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Weight className="size-4 text-[var(--orange)]" />
              Key Specs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Tonnage
              </p>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {job.tonnage}
                <span className="text-base font-medium text-muted-foreground ml-1">tons</span>
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                <Tag className="size-3" />
                Mark Numbers
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.markNumbers.length > 0 ? (
                  job.markNumbers.map((mk) => (
                    <Badge
                      key={mk}
                      variant="secondary"
                      className="font-mono text-[10px] px-2 py-0.5 border"
                    >
                      {mk}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">None assigned</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dates timeline + team + notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--orange)]" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-4 border-l-2 border-[var(--orange)]/30 space-y-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Started</p>
                <p className="text-sm font-semibold">{formatJobDate(job.startDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Target Delivery</p>
                <p className="text-sm font-semibold text-[var(--orange)]">
                  {formatJobDate(job.deliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Remaining</p>
                <p className="text-sm font-semibold tabular-nums">
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(job.deliveryDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{" "}
                  days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Shop Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.assignees.map((name) => {
              const roles: Record<string, string> = {
                "Ivy Chen": "Project Manager",
                "James Nguyen": "Lead Fabricator",
                "Cuong Tran": "Fabricator",
              }
              return (
                <div key={name} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs font-bold bg-[var(--orange)] text-white">
                      {name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{roles[name] ?? "Team Member"}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="size-4 text-[var(--orange)]" />
              Job Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {job.notes || "No notes added."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress by category */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Task Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TASK_CATEGORIES.map((cat) => {
              const catTasks = tasks.filter((t) => t.category === cat)
              const done = catTasks.filter((t) => t.completed).length
              const pct = catTasks.length ? Math.round((done / catTasks.length) * 100) : 0
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge className={cn("text-xs border", taskCategoryStyles[cat])}>{cat}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {done}/{catTasks.length}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{pct}% complete</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
