"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  commitGoogleContactsImportAction,
  previewGoogleContactsImportAction,
} from "@/lib/actions/google-crm"
import type {
  GoogleContactImportRow,
  GoogleContactImportStatus,
} from "@/lib/google/people/service"
import { toast } from "@/lib/toast"
import type { ProfileSummary } from "@/types"

type AccountOption = { id: string; name: string; shortName: string }

type DraftRow = GoogleContactImportRow & {
  selected: boolean
  accountMode: "matched" | "existing" | "create" | "none"
  accountId: string
  createAccountName: string
  relationshipOwnerId: string
  enrichIfExists: boolean
}

const STATUS_LABEL: Record<GoogleContactImportStatus, string> = {
  exists: "Already in CRM",
  new_on_account: "New on account",
  new_account: "New account",
  needs_account: "Needs account",
  skip: "No email",
}

function statusVariant(
  status: GoogleContactImportStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "new_on_account":
    case "new_account":
      return "default"
    case "exists":
      return "secondary"
    case "needs_account":
      return "outline"
    case "skip":
      return "destructive"
  }
}

function toDraft(
  row: GoogleContactImportRow,
  defaultOwnerId: string
): DraftRow {
  const accountMode: DraftRow["accountMode"] =
    row.status === "new_on_account" && row.matchedAccountId
      ? "matched"
      : row.status === "new_account"
        ? "create"
        : row.status === "needs_account"
          ? "none"
          : row.status === "exists"
            ? "none"
            : "none"

  return {
    ...row,
    selected: row.recommended,
    accountMode,
    accountId: row.matchedAccountId ?? "",
    createAccountName:
      row.status === "new_account" ? (row.company ?? "") : "",
    relationshipOwnerId: defaultOwnerId,
    enrichIfExists: false,
  }
}

interface GoogleContactsImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoogleContactsImportDialog({
  open,
  onOpenChange,
}: GoogleContactsImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [rows, setRows] = useState<DraftRow[]>([])
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [owners, setOwners] = useState<ProfileSummary[]>([])
  const [currentProfileId, setCurrentProfileId] = useState("")
  const [search, setSearch] = useState("")
  const [bulkOwnerId, setBulkOwnerId] = useState("")
  const [scanned, setScanned] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await previewGoogleContactsImportAction()
    setLoading(false)
    if (result.error) {
      toast.error("Could not load Google contacts", result.error)
      return
    }
    const data = result.data!
    setAccounts(data.accounts)
    setOwners(data.owners)
    setCurrentProfileId(data.currentProfileId)
    setBulkOwnerId(data.currentProfileId)
    setScanned(data.googlePeopleScanned)
    setRows(data.rows.map((r) => toDraft(r, data.currentProfileId)))
  }, [])

  useEffect(() => {
    if (!open) return
    setSearch("")
    void load()
  }, [open, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.email?.toLowerCase().includes(q) ?? false) ||
        (r.company?.toLowerCase().includes(q) ?? false)
    )
  }, [rows, search])

  const selectedCount = rows.filter((r) => r.selected).length

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    )
  }

  function selectRecommended() {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        selected: r.recommended,
      }))
    )
  }

  function clearSelection() {
    setRows((prev) => prev.map((r) => ({ ...r, selected: false })))
  }

  function applyBulkOwner() {
    if (!bulkOwnerId) return
    setRows((prev) =>
      prev.map((r) =>
        r.selected ? { ...r, relationshipOwnerId: bulkOwnerId } : r
      )
    )
    toast.success("Owner updated", "Applied to selected rows")
  }

  function canCommitRow(r: DraftRow): boolean {
    if (!r.selected) return false
    if (r.status === "skip") return false
    if (r.status === "exists") return true
    if (r.accountMode === "matched" && r.accountId) return true
    if (r.accountMode === "existing" && r.accountId) return true
    if (r.accountMode === "create" && r.createAccountName.trim()) return true
    return false
  }

  async function handleCommit() {
    const selected = rows.filter((r) => r.selected)
    if (selected.length === 0) {
      toast.error("Nothing selected", "Select at least one contact.")
      return
    }

    const invalid = selected.filter((r) => !canCommitRow(r))
    if (invalid.length > 0) {
      toast.error(
        "Account required",
        `${invalid.length} selected contact(s) need an account before import.`
      )
      return
    }

    const selections = selected.map((r) => {
      const base = {
        key: r.key,
        email: r.email,
        fullName: r.fullName,
        phone: r.phone,
        roleTitle: r.roleTitle,
        company: r.company,
        relationshipOwnerId: r.relationshipOwnerId || currentProfileId,
        enrichIfExists: r.status === "exists" ? r.enrichIfExists : false,
      }

      if (r.status === "exists") {
        return base
      }

      if (r.accountMode === "create") {
        return {
          ...base,
          createAccountName: r.createAccountName.trim(),
          accountId: null,
        }
      }

      return {
        ...base,
        accountId: r.accountId || r.matchedAccountId,
        createAccountName: null,
      }
    })

    setCommitting(true)
    const result = await commitGoogleContactsImportAction(selections)
    setCommitting(false)

    if (result.error) {
      toast.error("Import failed", result.error)
      return
    }

    const d = result.data!
    const parts = [
      `${d.contactsCreated} contact(s)`,
      `${d.accountsCreated} account(s)`,
      `${d.contactsEnriched} enriched`,
    ]
    if (d.errors.length > 0) {
      toast.error(
        "Import finished with errors",
        `${parts.join(" · ")}. ${d.errors.slice(0, 3).join("; ")}`
      )
    } else {
      toast.success("Import complete", parts.join(" · "))
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle>Import Google contacts</DialogTitle>
          <DialogDescription>
            Review before creating CRM accounts and contacts. Emails already in
            the CRM are never duplicated. Assign an account when Google has no
            company. You can reassign the relationship owner per row or in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-3 space-y-3 shrink-0 border-b">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[160px] space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Search
              </label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, company…"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={selectRecommended}
              disabled={loading}
            >
              Select recommended
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              disabled={loading}
            >
              Clear
            </Button>
            <div className="flex items-end gap-2">
              <div className="space-y-1 min-w-[160px]">
                <label className="text-xs font-medium text-muted-foreground">
                  Bulk owner
                </label>
                <Select
                  value={bulkOwnerId || undefined}
                  onValueChange={(v) => {
                    if (v != null) setBulkOwnerId(v)
                  }}
                >
                  <SelectTrigger className="w-full bg-background text-foreground h-8">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={applyBulkOwner}
                disabled={loading || selectedCount === 0}
              >
                Apply to selected
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {loading
              ? "Loading…"
              : `${filtered.length} shown · ${selectedCount} selected · ${scanned} Google people scanned`}
          </p>
        </div>

        <div className="flex-1 overflow-auto px-6 py-3 min-h-0">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Loading Google contacts…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No contacts match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-2 w-8" />
                    <th className="py-2 pr-2 font-medium">Name</th>
                    <th className="py-2 pr-2 font-medium">Email</th>
                    <th className="py-2 pr-2 font-medium">Status</th>
                    <th className="py-2 pr-2 font-medium min-w-[180px]">
                      Account
                    </th>
                    <th className="py-2 pr-2 font-medium min-w-[140px]">
                      Owner
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const selectable = r.status !== "skip"
                    return (
                      <tr key={r.key} className="border-b align-top">
                        <td className="py-2 pr-2">
                          <Checkbox
                            checked={r.selected}
                            disabled={!selectable}
                            onCheckedChange={() =>
                              updateRow(r.key, { selected: !r.selected })
                            }
                            aria-label={`Select ${r.fullName}`}
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <div className="font-medium">{r.fullName}</div>
                          {r.roleTitle ? (
                            <div className="text-xs text-muted-foreground">
                              {r.roleTitle}
                            </div>
                          ) : null}
                          {r.company ? (
                            <div className="text-xs text-muted-foreground">
                              {r.company}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2 text-muted-foreground">
                          {r.email ?? "—"}
                        </td>
                        <td className="py-2 pr-2">
                          <Badge variant={statusVariant(r.status)}>
                            {STATUS_LABEL[r.status]}
                          </Badge>
                          {r.status === "exists" && r.selected ? (
                            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Checkbox
                                checked={r.enrichIfExists}
                                onCheckedChange={() =>
                                  updateRow(r.key, {
                                    enrichIfExists: !r.enrichIfExists,
                                  })
                                }
                              />
                              Fill blank phone/title
                            </label>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2">
                          {r.status === "exists" || r.status === "skip" ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <div className="space-y-1.5">
                              <Select
                                value={
                                  r.accountMode === "matched"
                                    ? "matched"
                                    : r.accountMode === "create"
                                      ? "create"
                                      : r.accountMode === "existing"
                                        ? "existing"
                                        : "none"
                                }
                                onValueChange={(v) => {
                                  if (v == null) return
                                  if (v === "matched") {
                                    updateRow(r.key, {
                                      accountMode: "matched",
                                      accountId: r.matchedAccountId ?? "",
                                      createAccountName: "",
                                    })
                                  } else if (v === "create") {
                                    updateRow(r.key, {
                                      accountMode: "create",
                                      accountId: "",
                                      createAccountName:
                                        r.createAccountName ||
                                        r.company ||
                                        "",
                                    })
                                  } else if (v === "existing") {
                                    updateRow(r.key, {
                                      accountMode: "existing",
                                      createAccountName: "",
                                    })
                                  } else {
                                    updateRow(r.key, {
                                      accountMode: "none",
                                      accountId: "",
                                      createAccountName: "",
                                    })
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full bg-background text-foreground h-8">
                                  <SelectValue placeholder="Account action" />
                                </SelectTrigger>
                                <SelectContent>
                                  {r.matchedAccountId ? (
                                    <SelectItem value="matched">
                                      Use {r.matchedAccountName}
                                    </SelectItem>
                                  ) : null}
                                  <SelectItem value="existing">
                                    Pick existing account
                                  </SelectItem>
                                  <SelectItem value="create">
                                    Create new account
                                  </SelectItem>
                                  {r.status === "needs_account" ? (
                                    <SelectItem value="none">
                                      Choose…
                                    </SelectItem>
                                  ) : null}
                                </SelectContent>
                              </Select>
                              {r.accountMode === "existing" ? (
                                <Select
                                  value={r.accountId || undefined}
                                  onValueChange={(v) => {
                                    if (v != null)
                                      updateRow(r.key, { accountId: v })
                                  }}
                                >
                                  <SelectTrigger className="w-full bg-background text-foreground h-8">
                                    <SelectValue placeholder="Account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map((a) => (
                                      <SelectItem key={a.id} value={a.id}>
                                        {a.shortName} — {a.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : null}
                              {r.accountMode === "create" ? (
                                <Input
                                  className="h-8"
                                  value={r.createAccountName}
                                  onChange={(e) =>
                                    updateRow(r.key, {
                                      createAccountName: e.target.value,
                                    })
                                  }
                                  placeholder="New account name"
                                />
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {r.status === "skip" ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <Select
                              value={r.relationshipOwnerId || undefined}
                              onValueChange={(v) => {
                                if (v != null)
                                  updateRow(r.key, {
                                    relationshipOwnerId: v,
                                  })
                              }}
                            >
                              <SelectTrigger className="w-full bg-background text-foreground h-8">
                                <SelectValue placeholder="Owner" />
                              </SelectTrigger>
                              <SelectContent>
                                {owners.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={committing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCommit()}
            disabled={loading || committing || selectedCount === 0}
          >
            {committing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Importing…
              </>
            ) : (
              `Import ${selectedCount || ""}`.trim()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
