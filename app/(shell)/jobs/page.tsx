"use client"

import { useState } from "react"
import Link from "next/link"
import { Briefcase, Grid3X3, List, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { jobs, type JobStatus } from "@/lib/mock-data"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"

const KANBAN_COLS: JobStatus[] = ["To Do", "In Progress", "QC", "Shipping", "Delivered"]

const colColors: Record<JobStatus, string> = {
  "To Do":       "border-t-slate-400",
  "In Progress": "border-t-blue-500",
  "QC":          "border-t-purple-500",
  "Shipping":    "border-t-amber-500",
  "Delivered":   "border-t-green-500",
}

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`
}

export default function JobsPage() {
  const [view, setView] = useState<"list" | "kanban">("list")
  const [search, setSearch] = useState("")

  const filtered = jobs.filter(
    (j) =>
      j.jobNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.customer.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{jobs.length} total jobs</p>
        </div>
        <Link href="/jobs/new">
          <Button size="sm" className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0">
            <Plus className="size-4" data-icon="inline-start" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search job #, PO, customer…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30 w-fit">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="size-7"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            className="size-7"
            onClick={() => setView("kanban")}
          >
            <Grid3X3 className="size-4" />
          </Button>
        </div>
      </div>

      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Job / PO", "Description", "Customer", "Status", "Priority", "Delivery", "Tonnage", "Value", "Progress", "Team"].map((h) => (
                    <th key={h} className="text-left font-medium text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, i) => (
                  <tr
                    key={job.id}
                    className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", i % 2 !== 0 && "bg-muted/10")}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/jobs/${job.id}`} className="hover:underline">
                        <div className="font-semibold text-xs text-foreground">{job.jobNumber}</div>
                        <div className="text-xs text-muted-foreground">{job.poNumber}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs truncate">{job.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{job.customer.split(" ").slice(0, 2).join(" ")}</td>
                    <td className="px-4 py-3"><JobStatusBadge status={job.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={job.priority} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(job.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{job.tonnage}T</td>
                    <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{fmt(job.value)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1">
                        {job.assignees.map((a) => (
                          <Avatar key={a} className="size-6 border border-card">
                            <AvatarFallback className="text-[9px] font-bold bg-[var(--orange)] text-white">
                              {a.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                      No jobs found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── KANBAN VIEW ─── */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLS.map((col) => {
            const colJobs = filtered.filter((j) => j.status === col)
            return (
              <div key={col} className="flex flex-col gap-3 min-w-64 w-64 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{col}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">{colJobs.length}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {fmt(colJobs.reduce((s, j) => s + j.value, 0))}
                  </span>
                </div>

                <div className={`flex flex-col gap-3 bg-muted/30 rounded-xl p-3 border-t-4 ${colColors[col]} min-h-32`}>
                  {colJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <Card className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-foreground">{job.jobNumber}</p>
                              <p className="text-xs text-muted-foreground">{job.poNumber}</p>
                            </div>
                            <PriorityBadge priority={job.priority} />
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-2 text-foreground">{job.description}</p>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-1">
                              {job.assignees.map((a) => (
                                <Avatar key={a} className="size-5 border border-card">
                                  <AvatarFallback className="text-[8px] font-bold bg-[var(--orange)] text-white">
                                    {a.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Progress value={job.progress} className="h-1 w-14" />
                              <span className="text-xs text-muted-foreground">{job.progress}%</span>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Due {new Date(job.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            <span className="ml-2 font-bold text-foreground">{fmt(job.value)}</span>
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {colJobs.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                      No jobs
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
