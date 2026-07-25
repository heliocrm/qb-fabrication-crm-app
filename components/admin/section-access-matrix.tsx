"use client"

import { useState, useTransition } from "react"
import { setSectionAccessAction } from "@/lib/actions/admin"
import { ALL_ORGANIZATION_ROLES } from "@/lib/section-registry"
import { toast } from "@/lib/toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { OrganizationRole } from "@/types"

const ROLE_LABELS: Record<OrganizationRole, string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  viewer: "Viewer",
}

export type SectionAccessRow = {
  sectionKey: string
  label: string
  roles: Record<OrganizationRole, boolean>
}

interface SectionAccessMatrixProps {
  initialRows: SectionAccessRow[]
}

export function SectionAccessMatrix({ initialRows }: SectionAccessMatrixProps) {
  const [rows, setRows] = useState(initialRows)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(
    sectionKey: string,
    role: OrganizationRole,
    enabled: boolean
  ) {
    const cellKey = `${sectionKey}:${role}`
    setPendingKey(cellKey)

    setRows((prev) =>
      prev.map((row) =>
        row.sectionKey === sectionKey
          ? { ...row, roles: { ...row.roles, [role]: enabled } }
          : row
      )
    )

    startTransition(async () => {
      const result = await setSectionAccessAction({
        sectionKey,
        role,
        enabled,
      })
      setPendingKey(null)

      if (result.error) {
        setRows((prev) =>
          prev.map((row) =>
            row.sectionKey === sectionKey
              ? { ...row, roles: { ...row.roles, [role]: !enabled } }
              : row
          )
        )
        toast.error("Could not update section access", result.error)
        return
      }

      toast.success("Section access updated")
    })
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Section access</CardTitle>
        <CardDescription>
          Choose which roles can see each main-menu section. Dashboard and
          Settings are always available. Admin is always admin-only.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Section</th>
              {ALL_ORGANIZATION_ROLES.map((role) => (
                <th key={role} className="px-2 py-2 font-medium text-center">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sectionKey} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.sectionKey}
                  </p>
                </td>
                {ALL_ORGANIZATION_ROLES.map((role) => {
                  const cellKey = `${row.sectionKey}:${role}`
                  const busy = isPending && pendingKey === cellKey
                  return (
                    <td key={role} className="px-2 py-3 text-center">
                      <Checkbox
                        checked={row.roles[role]}
                        disabled={busy}
                        onCheckedChange={(checked) =>
                          toggle(row.sectionKey, role, checked === true)
                        }
                        aria-label={`${row.label} for ${ROLE_LABELS[role]}`}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
