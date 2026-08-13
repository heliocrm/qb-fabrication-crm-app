import { Suspense } from "react"
import { CustomersPageClient } from "@/components/customers/customers-page-client"
import { canViewJobFinancials, getSessionContext } from "@/lib/auth/session"
import { loadCustomersData } from "@/lib/data/accounts"

export default async function CustomersPage() {
  const [{ customers, source }, ctx] = await Promise.all([
    loadCustomersData(),
    getSessionContext(),
  ])
  const canViewFinancials = canViewJobFinancials(ctx?.role ?? "member")

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <CustomersPageClient
        customers={customers}
        dataSource={source}
        canViewFinancials={canViewFinancials}
      />
    </Suspense>
  )
}
