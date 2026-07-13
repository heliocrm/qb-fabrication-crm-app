"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { ProfileAvatarUpload } from "@/components/profile/profile-avatar-upload"
import { ProfileAssignedJobs } from "@/components/profile/profile-assigned-jobs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  changePasswordAction,
  updateNotificationPreferencesAction,
  updateProfileAction,
} from "@/lib/actions/profile"
import { toast } from "@/lib/toast"
import type { JobListItem, NotificationPreferences, OwnProfile } from "@/types"

interface ProfilePageClientProps {
  initialProfile: OwnProfile
  assignedJobs: JobListItem[]
  source: "supabase" | "mock"
}

export function ProfilePageClient({
  initialProfile,
  assignedJobs,
  source,
}: ProfilePageClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [fullName, setFullName] = useState(profile.fullName)
  const [avatarInitials, setAvatarInitials] = useState(profile.avatarInitials)
  const [prefs, setPrefs] = useState(profile.notificationPreferences)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  async function handleSaveProfile() {
    setSavingProfile(true)
    const result = await updateProfileAction({ fullName, avatarInitials })
    setSavingProfile(false)

    if (result.error) {
      toast.error("Update failed", result.error)
      return
    }

    if (result.data) {
      setProfile(result.data)
      setFullName(result.data.fullName)
      setAvatarInitials(result.data.avatarInitials)
      toast.success("Profile updated")
    }
  }

  async function handleSavePrefs() {
    setSavingPrefs(true)
    const result = await updateNotificationPreferencesAction(prefs)
    setSavingPrefs(false)

    if (result.error) {
      toast.error("Update failed", result.error)
      return
    }

    if (result.data) {
      setProfile(result.data)
      setPrefs(result.data.notificationPreferences)
      toast.success("Preferences saved")
    }
  }

  async function handleChangePassword() {
    setChangingPassword(true)
    const result = await changePasswordAction({ password, confirm: confirmPassword })
    setChangingPassword(false)

    if (result.error) {
      toast.error("Password change failed", result.error)
      return
    }

    setPassword("")
    setConfirmPassword("")
    toast.success("Password updated")
  }

  function togglePref(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your account, preferences, and assigned work
          {source === "supabase" && (
            <span className="ml-1 text-[var(--orange)]">· live data</span>
          )}
        </p>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal info</CardTitle>
              <CardDescription>
                Update how you appear across QB Fabrication.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProfileAvatarUpload profile={profile} onUpdated={setProfile} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full name
                  </label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="initials" className="text-sm font-medium">
                    Avatar initials
                  </label>
                  <Input
                    id="initials"
                    value={avatarInitials}
                    maxLength={3}
                    onChange={(e) =>
                      setAvatarInitials(e.target.value.toUpperCase().slice(0, 3))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Input
                    id="role"
                    value={profile.role}
                    disabled
                    className="capitalize"
                  />
                </div>
              </div>

              <Button
                className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
                onClick={handleSaveProfile}
                disabled={savingProfile || source === "mock"}
              >
                {savingProfile && (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                )}
                Save changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Choose a strong password with at least 6 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button
                className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
                onClick={handleChangePassword}
                disabled={changingPassword || source === "mock"}
              >
                {changingPassword && (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                )}
                Update password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Control which email notifications you receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.job_updates_email}
                  onCheckedChange={() => togglePref("job_updates_email")}
                />
                <div>
                  <p className="text-sm font-medium">Job updates</p>
                  <p className="text-xs text-muted-foreground">
                    Email when jobs you follow change status or delivery dates.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.task_assignments_email}
                  onCheckedChange={() => togglePref("task_assignments_email")}
                />
                <div>
                  <p className="text-sm font-medium">Task assignments</p>
                  <p className="text-xs text-muted-foreground">
                    Email when you are assigned a new task on a job.
                  </p>
                </div>
              </label>
              <Button
                className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
                onClick={handleSavePrefs}
                disabled={savingPrefs || source === "mock"}
              >
                {savingPrefs && (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                )}
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My assigned jobs</CardTitle>
              <CardDescription>
                Jobs where you are on the shop team ({assignedJobs.length}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileAssignedJobs jobs={assignedJobs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
