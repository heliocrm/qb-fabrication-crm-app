"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CustomerDetailView } from "@/components/customers/customer-detail-view"
import { formatCompact } from "@/lib/dashboard-stats"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { Customer360 } from "@/lib/data/accounts"

interface CustomersPageClientProps {
  customers: Customer360[]
  dataSource?: "supabase" | "mock"
}

export function CustomersPageClient({
  customers,
  dataSource,
}: CustomersPageClientProps) {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(
    customers[0]?.id ?? null
  )
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    )
  }, [customers, search])

  const selected =
    filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null

  function handleSelect(id: string) {
    setSelectedId(id)
    if (isMobile) setSheetOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customers.length} accounts · 360° view with job history
            {dataSource === "supabase" && (
              <span className="ml-1 text-[var(--orange)]">· live data</span>
            )}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <Input
          id="customer-search"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No customers match your search.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop split view */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-5 min-h-[600px]">
            <div className="lg:col-span-2 space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {filtered.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50",
                    selected?.id === customer.id &&
                      "border-[var(--orange)] bg-[var(--orange-muted)]/30 dark:bg-[var(--orange)]/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-[var(--navy)] shrink-0">
                      <span className="text-[10px] font-bold text-white">
                        {customer.shortName.slice(0, 3)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.activeJobs} active · {formatCompact(customer.totalValue)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] shrink-0",
                        customer.status === "Active" &&
                          "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      )}
                    >
                      {customer.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-3">
              {selected ? (
                <Card className="border shadow-sm h-full">
                  <CardContent className="p-5 sm:p-6">
                    <CustomerDetailView customer={selected} />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border shadow-sm h-full flex items-center justify-center">
                  <CardContent className="py-20 text-sm text-muted-foreground">
                    Select a customer to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mobile / tablet card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer.id)}
                className="text-left rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow bg-card"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--navy)] shrink-0">
                      <span className="text-xs font-bold text-white">
                        {customer.shortName.slice(0, 3)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.city}, {customer.state}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] shrink-0",
                      customer.status === "Active" &&
                        "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                    )}
                  >
                    {customer.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold">{customer.totalJobs}</p>
                    <p className="text-[10px] text-muted-foreground">Jobs</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{customer.activeJobs}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-base font-bold">{formatCompact(customer.ytdValue)}</p>
                    <p className="text-[10px] text-muted-foreground">YTD</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile detail sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="w-full max-w-full sm:max-w-lg overflow-y-auto p-0">
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle>Customer 360°</SheetTitle>
              </SheetHeader>
              {selected && (
                <div className="px-4 pb-8 pt-2">
                  <CustomerDetailView customer={selected} />
                </div>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
