import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getOwnProfile, listJobsAssignedToProfile } from "@/lib/supabase/services/profiles"
import { jobs as mockJobs } from "@/lib/mock-data"
import type { JobListItem, OwnProfile } from "@/types"

function mockOwnProfile(): OwnProfile {
  return {
    id: "mock-profile",
    userId: "mock-user",
    organizationId: "mock-org",
    fullName: "Ivy Chen",
    email: "ivy@qbfabrication.com",
    role: "manager",
    avatarInitials: "IC",
    avatarUrl: null,
    notificationPreferences: {
      job_updates_email: true,
      task_assignments_email: true,
    },
  }
}

function mockAssignedJobs(): JobListItem[] {
  return mockJobs
    .filter((j) => j.assignees?.includes("Ivy Chen") || j.assignedUsers?.length)
    .slice(0, 6)
    .map((j) => ({
      id: j.id,
      jobNumber: j.jobNumber,
      poNumber: j.poNumber,
      description: j.description,
      customer: j.customer,
      customerId: j.customerId,
      status: j.status,
      priority: j.priority,
      deliveryDate: j.deliveryDate,
      tonnage: j.tonnage,
      value: j.value,
      progress: j.progress,
      assignees: j.assignees,
    }))
}

export async function loadProfileData(): Promise<{
  profile: OwnProfile
  assignedJobs: JobListItem[]
  source: "supabase" | "mock"
}> {
  if (isSupabaseConfigured()) {
    try {
      const profile = await getOwnProfile()
      if (profile) {
        const assignedJobs = await listJobsAssignedToProfile(profile.id)
        return { profile, assignedJobs, source: "supabase" }
      }
    } catch {
      // fall through
    }
  }

  return {
    profile: mockOwnProfile(),
    assignedJobs: mockAssignedJobs(),
    source: "mock",
  }
}
