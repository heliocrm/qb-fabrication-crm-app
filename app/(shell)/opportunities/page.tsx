import { OpportunitiesPageClient } from "@/components/opportunities/opportunities-page-client"
import { loadOpportunities } from "@/lib/data/opportunities"

export default async function OpportunitiesPage() {
  const { opportunities, source, error } = await loadOpportunities()

  return (
    <OpportunitiesPageClient
      initialOpportunities={opportunities}
      dataSource={source}
      loadError={error}
    />
  )
}
