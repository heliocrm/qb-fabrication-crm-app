import { ProfilePageClient } from "@/components/profile/profile-page-client"
import { canViewJobFinancials, getSessionContext } from "@/lib/auth/session"
import { loadProfileData } from "@/lib/data/profile"

export default async function ProfilePage() {
  const [{ profile, assignedJobs, source }, ctx] = await Promise.all([
    loadProfileData(),
    getSessionContext(),
  ])
  const canViewFinancials = canViewJobFinancials(ctx?.role ?? "member")

  return (
    <ProfilePageClient
      initialProfile={profile}
      assignedJobs={assignedJobs}
      source={source}
      canViewFinancials={canViewFinancials}
    />
  )
}
