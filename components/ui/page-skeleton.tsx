import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border shadow-sm">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="border-b bg-muted/40 px-5 py-3">
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3 border-b last:border-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16 hidden sm:block" />
          <Skeleton className="h-4 w-12 hidden md:block" />
        </div>
      ))}
    </Card>
  )
}

export function CustomerCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full" />
      </CardContent>
    </Card>
  )
}

export function CustomersPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeaderSkeleton />
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="hidden lg:grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="lg:col-span-3">
          <Card className="border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
              <TableSkeleton rows={4} />
            </CardContent>
          </Card>
        </div>
      </div>
      <CustomerCardsSkeleton />
    </div>
  )
}

export function ReportsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeaderSkeleton />
      <MetricCardsSkeleton count={6} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton rows={5} />
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeaderSkeleton />
      <MetricCardsSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TableSkeleton />
        </div>
        <div className="space-y-6">
          <ChartSkeleton />
          <Card className="border shadow-sm">
            <CardContent className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function JobsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full" />
      <TableSkeleton rows={8} />
    </div>
  )
}

export function OpportunitiesPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5">
      <PageHeaderSkeleton />
      <MetricCardsSkeleton count={4} />
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border shadow-sm min-w-64 w-64 shrink-0">
            <CardContent className="p-3 space-y-2">
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function SettingsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeaderSkeleton />
      <Card className="border shadow-sm">
        <CardContent className="py-20 flex flex-col items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    </div>
  )
}

export function JobDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b bg-card px-4 sm:px-6 py-4 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-3/4 max-w-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}
