import { CustomersPageClient } from "@/components/customers/customers-page-client"
import { loadCustomersData } from "@/lib/data/accounts"

export default async function CustomersPage() {
  const { customers, source } = await loadCustomersData()

  return <CustomersPageClient customers={customers} dataSource={source} />
}
