import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CreateOpportunityForm } from "@/components/opportunities/create-opportunity-form"
import { Button } from "@/components/ui/button"
import { loadCustomersData } from "@/lib/data/accounts"

export default async function NewOpportunityPage() {
  const { customers, source } = await loadCustomersData()

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" render={<Link href="/opportunities" />}>
          <ArrowLeft className="size-4" />
          Back to opportunities
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Opportunity</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add a prospect or bid to the pipeline
          </p>
        </div>
      </div>
      <CreateOpportunityForm accounts={customers} dataSource={source} />
    </div>
  )
}
