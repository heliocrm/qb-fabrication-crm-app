import { Suspense } from "react"
import { CustomersPageClient } from "@/components/customers/customers-page-client"
import { loadCustomersData } from "@/lib/data/accounts"

export default async function CustomersPage() {
  const { customers, source } = await loadCustomersData()

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <CustomersPageClient customers={customers} dataSource={source} />
    </Suspense>
  )
}
