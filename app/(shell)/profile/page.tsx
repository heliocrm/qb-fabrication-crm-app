import { ProfilePageClient } from "@/components/profile/profile-page-client"
import { loadProfileData } from "@/lib/data/profile"

export default async function ProfilePage() {
  const { profile, assignedJobs, source } = await loadProfileData()

  return (
    <ProfilePageClient
      initialProfile={profile}
      assignedJobs={assignedJobs}
      source={source}
    />
  )
}
