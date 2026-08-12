import { ChapterGrid } from "@/components/help/chapter-grid"
import { HelpSearchBox } from "@/components/help/help-search-box"
import { RoleFilterChips } from "@/components/help/role-filter-chips"
import { StartHereCards } from "@/components/help/start-here-cards"

export default function HelpHomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Help Center</h1>
        <p className="text-sm text-muted-foreground">
          Everything you need to run opportunities, jobs, customers, Material Pull, and Travelers in QB Fabrication CRM.
        </p>
      </div>

      <HelpSearchBox />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Start here by role</h2>
        <StartHereCards />
      </div>

      <RoleFilterChips />

      <ChapterGrid />
    </div>
  )
}
