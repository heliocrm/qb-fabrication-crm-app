import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/opportunities/new">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="size-4" data-icon="inline-start" />
          New Opportunity
        </Button>
      </Link>
      <Link href="/jobs/new">
        <Button
          size="sm"
          className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0 shadow-sm"
        >
          <Plus className="size-4" data-icon="inline-start" />
          New Job
        </Button>
      </Link>
    </div>
  )
}
