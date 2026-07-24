import { notFound } from "next/navigation"
import { MaterialRequestDetail } from "@/components/material-requests/material-request-detail"
import { getSessionContext } from "@/lib/auth/session"
import { getMaterialPullRequestById } from "@/lib/supabase/services/material-pull-requests"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { DEFAULT_MATERIAL_PULL_CAPABILITIES } from "@/types/Profile"

export const metadata = {
  title: "Material request",
}

export default async function MaterialRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await getSessionContext()
  if (!ctx || !isSupabaseConfigured()) notFound()

  const request = await getMaterialPullRequestById(id)
  if (!request) notFound()

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <MaterialRequestDetail
        request={request}
        role={ctx.role}
        profileId={ctx.profileId}
        capabilities={
          ctx.materialPullCapabilities ?? DEFAULT_MATERIAL_PULL_CAPABILITIES
        }
        backHref="/material-requests"
      />
    </div>
  )
}
