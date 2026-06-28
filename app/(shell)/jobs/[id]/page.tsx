"use client"

import { useState, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Paperclip,
  Plus,
  Tag,
  Upload,
  Users,
  Weight,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { jobs } from "@/lib/mock-data"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${n.toLocaleString()}`
}

const docTypeIcon: Record<string, string> = {
  Drawing: "📐",
  "Work Order": "📋",
  Inspection: "🔍",
  Shipping: "🚛",
  PO: "📄",
}

const taskCategoryColor: Record<string, string> = {
  Fabrication: "bg-blue-100 text-blue-700",
  QC: "bg-purple-100 text-purple-700",
  Logistics: "bg-amber-100 text-amber-700",
  Engineering: "bg-teal-100 text-teal-700",
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const job = jobs.find((j) => j.id === id) ?? jobs[0]
  const [tasks, setTasks] = useState(job.tasks)

  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb + title bar */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">{job.jobNumber}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground truncate">{job.description}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <JobStatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
              <span className="text-xs text-muted-foreground">PO: {job.poNumber}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{job.customer}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/jobs">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="size-4" data-icon="inline-start" />
                Back
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0">
              <Plus className="size-4" data-icon="inline-start" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Key stats bar */}
      <div className="bg-card border-b px-6 py-3">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-1.5">
            <Weight className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tonnage</span>
            <span className="text-xs font-semibold text-foreground">{job.tonnage} T</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Value</span>
            <span className="text-xs font-semibold text-foreground">{fmt(job.value)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Delivery</span>
            <span className="text-xs font-semibold text-foreground">
              {new Date(job.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckSquare className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tasks</span>
            <span className="text-xs font-semibold text-foreground">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="flex items-center gap-2 min-w-32">
            <Progress value={job.progress} className="h-1.5 w-24" />
            <span className="text-xs font-semibold text-foreground">{job.progress}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Team</span>
            <div className="flex -space-x-1">
              {job.assignees.map((a) => (
                <Avatar key={a} className="size-5 border border-card">
                  <AvatarFallback className="text-[9px] font-bold bg-[var(--orange)] text-white">
                    {a.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks
              {totalTasks > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                  {totalTasks - completedTasks}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{job.documents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="changes">
              Change Orders
              {job.changeOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">{job.changeOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="team">Team & Activity</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW TAB ─── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Job Info */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardList className="size-4 text-[var(--orange)]" />
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Job Number", value: job.jobNumber },
                    { label: "PO Number", value: job.poNumber },
                    { label: "Customer", value: job.customer },
                    { label: "Start Date", value: new Date(job.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    { label: "Delivery Date", value: new Date(job.deliveryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                    { label: "Tonnage", value: `${job.tonnage} tons` },
                    { label: "Contract Value", value: fmt(job.value) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-baseline gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
                      <span className="text-xs font-medium text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Mark Numbers */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Tag className="size-4 text-[var(--orange)]" />
                    Mark Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.markNumbers.map((mk) => (
                      <Badge key={mk} variant="secondary" className="font-mono text-xs px-2.5 py-1 border">
                        {mk}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="size-4 text-[var(--orange)]" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{job.notes || "No notes added."}</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress breakdown */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Task Progress by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(["Engineering", "Fabrication", "QC", "Logistics"] as const).map((cat) => {
                    const catTasks = tasks.filter((t) => t.category === cat)
                    const done = catTasks.filter((t) => t.completed).length
                    const pct = catTasks.length ? Math.round((done / catTasks.length) * 100) : 0
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge className={cn("text-xs border-0", taskCategoryColor[cat])}>{cat}</Badge>
                          <span className="text-xs font-semibold text-muted-foreground">{done}/{catTasks.length}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground">{pct}% complete</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TASKS TAB ─── */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="size-4" data-icon="inline-start" />
                Add Task
              </Button>
            </div>

            {(["Engineering", "Fabrication", "QC", "Logistics"] as const).map((cat) => {
              const catTasks = tasks.filter((t) => t.category === cat)
              if (!catTasks.length) return null
              return (
                <Card key={cat} className="border shadow-sm">
                  <CardHeader className="py-3 px-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs border-0", taskCategoryColor[cat])}>{cat}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {catTasks.filter((t) => t.completed).length}/{catTasks.length} done
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {catTasks.map((task, i) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/20 transition-colors",
                          task.completed && "opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Avatar className="size-6">
                            <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
                              {task.assignee.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          {task.completed
                            ? <CheckCircle2 className="size-4 text-green-500" />
                            : <Clock className="size-4 text-muted-foreground/50" />
                          }
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          {/* ─── DOCUMENTS TAB ─── */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{job.documents.length} files attached</p>
              <Button size="sm" className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0">
                <Upload className="size-4" data-icon="inline-start" />
                Upload File
              </Button>
            </div>

            {/* Drive folder link */}
            <Card className="border shadow-sm bg-blue-50/60 border-blue-100">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <FolderOpen className="size-5 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Google Drive Folder</p>
                  <p className="text-xs text-blue-600">QB-2025-041 – BPA McNary Crossarms</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-blue-700 border-blue-200 bg-white hover:bg-blue-50">
                  <ExternalLink className="size-3.5" data-icon="inline-start" />
                  Open Drive
                </Button>
              </CardContent>
            </Card>

            {/* Document list */}
            <div className="space-y-2">
              {(["Drawing", "PO", "Work Order", "Inspection", "Shipping"] as const).map((docType) => {
                const docs = job.documents.filter((d) => d.type === docType)
                if (!docs.length) return null
                return (
                  <div key={docType}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{docType}s</p>
                    {docs.map((doc) => (
                      <Card key={doc.id} className="border shadow-sm mb-2 hover:shadow-md transition-shadow">
                        <CardContent className="flex items-center gap-3 py-3 px-4">
                          <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                            {docTypeIcon[doc.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.size} · Uploaded by {doc.uploadedBy} · {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.preview && (
                              <Badge variant="secondary" className="text-xs">Preview</Badge>
                            )}
                            <Button variant="ghost" size="icon" className="size-8">
                              <ExternalLink className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8">
                              <Download className="size-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Drop zone */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-[var(--orange)] hover:bg-[var(--orange-muted)] transition-colors cursor-pointer">
              <Paperclip className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DWG, DXF, XLSX — up to 50MB each</p>
            </div>
          </TabsContent>

          {/* ─── CHANGE ORDERS TAB ─── */}
          <TabsContent value="changes" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{job.changeOrders.length} items logged</p>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="size-4" data-icon="inline-start" />
                Log Issue
              </Button>
            </div>

            {job.changeOrders.length === 0 ? (
              <Card className="border shadow-sm">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No change orders or issues logged</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        {["Date", "Type", "Description", "Impact", "Status"].map((h) => (
                          <th key={h} className="text-left font-medium text-muted-foreground px-4 py-2.5 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {job.changeOrders.map((co) => (
                        <tr key={co.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(co.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={cn("text-xs border-0", {
                                "bg-amber-100 text-amber-700": co.type === "Change Order",
                                "bg-red-100 text-red-700": co.type === "NCR",
                                "bg-blue-100 text-blue-700": co.type === "Issue",
                              })}
                            >
                              {co.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs">{co.description}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{co.impact}</td>
                          <td className="px-4 py-3">
                            <Badge
                              className={cn("text-xs border-0", {
                                "bg-amber-100 text-amber-700": co.status === "Pending Approval",
                                "bg-green-100 text-green-700": co.status === "Resolved",
                                "bg-red-100 text-red-700": co.status === "Open",
                              })}
                            >
                              {co.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ─── TEAM & ACTIVITY TAB ─── */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="size-4 text-[var(--orange)]" />
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.assignees.map((name) => {
                    const initials = name.split(" ").map((n) => n[0]).join("")
                    const roles: Record<string, string> = {
                      "Ivy Chen": "Project Manager",
                      "James Nguyen": "Lead Fabricator",
                      "Cuong Tran": "Fabricator",
                    }
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs font-bold bg-[var(--orange)] text-white">{initials}</AvatarFallback>
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

              {/* Activity */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.activity.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No activity yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {job.activity.map((act, i) => (
                        <div key={act.id} className="flex gap-3">
                          <Avatar className="size-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">{act.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">
                              <span className="font-semibold text-foreground">{act.user}</span>
                              <span className="text-muted-foreground"> {act.action}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{act.timestamp}</p>
                          </div>
                          {i < job.activity.length - 1 && (
                            <div className="absolute ml-3 mt-7 w-px h-4 bg-border" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
