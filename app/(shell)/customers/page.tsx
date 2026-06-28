import Link from "next/link"
import { ArrowRight, Building2, Briefcase, DollarSign, Mail, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { customers, jobs } from "@/lib/mock-data"
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge"

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`
}

export default function CustomersPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {customers.map((customer) => {
          const customerJobs = jobs.filter((j) => j.customerId === customer.id)
          const activeJobs = customerJobs.filter((j) => j.status !== "Delivered")

          return (
            <Card key={customer.id} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--navy)] shrink-0">
                      <span className="text-xs font-bold text-white">{customer.shortName.slice(0, 3)}</span>
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold leading-snug">{customer.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{customer.city}, {customer.state}</p>
                    </div>
                  </div>
                  <Badge
                    className={customer.status === "Active"
                      ? "bg-green-100 text-green-700 border-green-200 text-xs border"
                      : "bg-secondary text-muted-foreground text-xs border"}
                  >
                    {customer.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-3.5 shrink-0" />
                    <span className="font-medium text-foreground">{customer.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{customer.totalJobs}</p>
                    <p className="text-xs text-muted-foreground">All Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{customer.activeJobs}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{fmt(customer.ytdValue)}</p>
                    <p className="text-xs text-muted-foreground">YTD</p>
                  </div>
                </div>

                <Separator />

                {/* Recent jobs for this customer */}
                {activeJobs.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Jobs</p>
                    {activeJobs.slice(0, 2).map((job) => (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{job.jobNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">{job.poNumber}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <JobStatusBadge status={job.status} />
                            <PriorityBadge priority={job.priority} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No active jobs</p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">{fmt(customer.totalValue)}</span>
                  </span>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-[var(--orange)] hover:text-[var(--orange)]">
                    View all <ArrowRight className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
