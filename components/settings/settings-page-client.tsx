"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Bell, User } from "lucide-react"
import { GoogleIntegrationsCard } from "@/components/settings/google-integrations-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  JOBS_VIEW_KEY,
  OPPORTUNITIES_VIEW_KEY,
  readViewPref,
  writeViewPref,
  type JobsView,
  type OpportunitiesView,
} from "@/lib/view-prefs"

const JOB_VIEWS = ["table", "kanban"] as const
const OPP_VIEWS = ["kanban", "list"] as const

interface SettingsPageClientProps {
  isAdmin: boolean
}

export function SettingsPageClient({ isAdmin }: SettingsPageClientProps) {
  const [jobsView, setJobsView] = useState<JobsView>("table")
  const [oppsView, setOppsView] = useState<OpportunitiesView>("kanban")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setJobsView(readViewPref(JOBS_VIEW_KEY, JOB_VIEWS, "table"))
    setOppsView(readViewPref(OPPORTUNITIES_VIEW_KEY, OPP_VIEWS, "kanban"))
    setReady(true)
  }, [])

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Personal preferences for this browser
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Default views</CardTitle>
          <CardDescription>
            Remembers your last choice on Jobs and Opportunities. Changing here
            updates the same preference used on those pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Jobs default view</label>
            <Select
              value={ready ? jobsView : "table"}
              onValueChange={(v) => {
                if (v == null) return
                const next = v as JobsView
                setJobsView(next)
                writeViewPref(JOBS_VIEW_KEY, next)
              }}
            >
              <SelectTrigger className="w-full bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Opportunities default view</label>
            <Select
              value={ready ? oppsView : "kanban"}
              onValueChange={(v) => {
                if (v == null) return
                const next = v as OpportunitiesView
                setOppsView(next)
                writeViewPref(OPPORTUNITIES_VIEW_KEY, next)
              }}
            >
              <SelectTrigger className="w-full bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kanban">Kanban</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" />
              Profile
            </CardTitle>
            <CardDescription>Name, avatar, and assigned jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" render={<Link href="/profile" />}>
              Open profile
            </Button>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4" />
                Organization settings
              </CardTitle>
              <CardDescription>
                Users, section access, Material Pull caps, and floor PINs live in
                Admin — not duplicated here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" render={<Link href="/admin" />}>
                Open Admin
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4" />
                Organization settings
              </CardTitle>
              <CardDescription>
                Ask an admin to manage users, section access, and shop tools.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Card className="border shadow-sm opacity-90">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
          </CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email and push preferences for approvals and job updates will appear
            here. This section is not available yet.
          </p>
        </CardContent>
      </Card>

      <GoogleIntegrationsCard />
    </div>
  )
}
