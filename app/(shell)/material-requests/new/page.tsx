import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { MaterialRequestForm } from "@/components/material-requests/material-request-form"
import { Button } from "@/components/ui/button"
import {
  canCreateMaterialRequests,
  getSessionContext,
} from "@/lib/auth/session"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

export const metadata = {
  title: "New Material Request",
}

export default async function NewMaterialRequestPage() {
  const ctx = await getSessionContext()
  const role = ctx?.role ?? "viewer"
  const caps = ctx?.materialPullCapabilities ?? DEFAULT_MATERIAL_PULL_CAPABILITIES
  if (!canCreateMaterialRequests(role, caps)) {
    redirect("/material-requests")
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-xl mx-auto w-full">
      <Button variant="ghost" size="sm" render={<Link href="/material-requests" />}>
        <ArrowLeft className="size-4" />
        Back to requests
      </Button>
      <MaterialRequestForm redirectTo="/material-requests" />
    </div>
  )
}
