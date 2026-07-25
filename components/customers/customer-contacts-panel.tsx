"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CalendarPlus,
  Loader2,
  Mail,
  Pencil,
  Plus,
  StickyNote,
  User,
} from "lucide-react"
import { ScheduleMeetingDialog } from "@/components/crm/schedule-meeting-dialog"
import { ComposeEmailDialog } from "@/components/crm/compose-email-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContactFormDialog } from "@/components/customers/contact-form-dialog"
import { CustomerFollowUpsPanel } from "@/components/customers/customer-follow-ups-panel"
import {
  listContactsByAccountAction,
} from "@/lib/actions/contacts"
import {
  createCrmActivityAction,
  listAccountActivitiesAction,
} from "@/lib/actions/crm-activities"
import { toast } from "@/lib/toast"
import type { Contact, CrmActivity, CrmActivityKind } from "@/types"

interface CustomerContactsPanelProps {
  accountId: string
  canWrite: boolean
}

export function CustomerContactsPanel({
  accountId,
  canWrite,
}: CustomerContactsPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [noteBody, setNoteBody] = useState("")
  const [noteKind, setNoteKind] = useState<CrmActivityKind>("note")
  const [savingNote, setSavingNote] = useState(false)
  const [meetingContact, setMeetingContact] = useState<Contact | null>(null)
  const [emailContact, setEmailContact] = useState<Contact | null>(null)
  const [replyActivity, setReplyActivity] = useState<CrmActivity | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    const [cRes, aRes] = await Promise.all([
      listContactsByAccountAction(accountId),
      listAccountActivitiesAction(accountId),
    ])
    if (cRes.error) toast.error("Could not load contacts", cRes.error)
    else if (cRes.data) setContacts(cRes.data)
    if (aRes.error) toast.error("Could not load activity", aRes.error)
    else if (aRes.data) setActivities(aRes.data)
    setLoading(false)
  }, [accountId])

  useEffect(() => {
    void reload()
  }, [reload])

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteBody.trim()) return
    setSavingNote(true)
    const result = await createCrmActivityAction({
      accountId,
      kind: noteKind,
      body: noteBody.trim(),
    })
    setSavingNote(false)
    if (result.error) {
      toast.error("Could not save note", result.error)
      return
    }
    setNoteBody("")
    toast.success("Note added")
    void reload()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <Loader2 className="size-4 animate-spin" />
        Loading contacts…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="size-4" />
            Contacts
          </CardTitle>
          {canWrite ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" data-icon="inline-start" />
              Add
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No contacts yet.
            </p>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.fullName}</p>
                    {c.roleTitle ? (
                      <p className="text-xs text-muted-foreground">{c.roleTitle}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.isPrimary ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Primary
                      </Badge>
                    ) : null}
                    {canWrite ? (
                      <>
                        {c.email ? (
                          <>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setEmailContact(c)}
                              aria-label={`Email ${c.fullName}`}
                            >
                              <Mail className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setMeetingContact(c)}
                              aria-label={`Schedule meeting with ${c.fullName}`}
                            >
                              <CalendarPlus className="size-3.5" />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(c)
                            setFormOpen(true)
                          }}
                          aria-label={`Edit ${c.fullName}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {c.email ? <p>{c.email}</p> : null}
                  {c.phone ? <p>{c.phone}</p> : null}
                  {c.nextTouchAt ? (
                    <p>
                      Next touch:{" "}
                      {new Date(c.nextTouchAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
                {c.personalNotes ? (
                  <p className="text-xs text-foreground/90 pt-1 border-t">
                    {c.personalNotes}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CustomerFollowUpsPanel
        accountId={accountId}
        contacts={contacts}
        canWrite={canWrite}
      />

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="size-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canWrite ? (
            <form onSubmit={handleAddNote} className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Select
                  value={noteKind}
                  onValueChange={(v) => {
                    if (v != null) setNoteKind(v as CrmActivityKind)
                  }}
                >
                  <SelectTrigger className="w-32 bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="touch">Touch</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" disabled={savingNote}>
                  {savingNote ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={2}
                placeholder="Log a call, lunch, or follow-up…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs resize-y min-h-[60px]"
              />
            </form>
          ) : null}

          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activity yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => {
                const meta = a.metadata ?? {}
                const threadId =
                  typeof meta.threadId === "string" ? meta.threadId : null
                const matchedEmail =
                  typeof meta.matchedEmail === "string"
                    ? meta.matchedEmail
                    : typeof meta.to === "string"
                      ? meta.to
                      : null
                const canReply =
                  canWrite && a.kind === "email" && Boolean(matchedEmail)

                return (
                  <li
                    key={a.id}
                    className="border-l-2 border-border pl-3 space-y-0.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {a.kind}
                      </Badge>
                      <span>
                        {new Date(a.occurredAt).toLocaleString()}
                      </span>
                      {a.createdByName ? (
                        <span>· {a.createdByName}</span>
                      ) : null}
                      {canReply ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => setReplyActivity(a)}
                        >
                          Reply
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                    {threadId && typeof meta.deepLink === "string" ? (
                      <a
                        href={meta.deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--orange)] hover:underline"
                      >
                        Open in Gmail
                      </a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {canWrite ? (
        <ContactFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          accountId={accountId}
          contact={editing}
          onSaved={() => void reload()}
        />
      ) : null}

      <ScheduleMeetingDialog
        open={Boolean(meetingContact)}
        onOpenChange={(o) => {
          if (!o) setMeetingContact(null)
        }}
        titleDefault={
          meetingContact
            ? `Meeting with ${meetingContact.fullName}`
            : "Customer meeting"
        }
        attendeeEmail={meetingContact?.email}
        accountId={accountId}
        contactId={meetingContact?.id}
        onScheduled={() => void reload()}
      />

      <ComposeEmailDialog
        open={Boolean(emailContact)}
        onOpenChange={(o) => {
          if (!o) setEmailContact(null)
        }}
        toEmail={emailContact?.email}
        accountId={accountId}
        contactId={emailContact?.id}
        onSent={() => void reload()}
      />

      <ComposeEmailDialog
        open={Boolean(replyActivity)}
        onOpenChange={(o) => {
          if (!o) setReplyActivity(null)
        }}
        toEmail={
          typeof replyActivity?.metadata?.matchedEmail === "string"
            ? replyActivity.metadata.matchedEmail
            : typeof replyActivity?.metadata?.to === "string"
              ? replyActivity.metadata.to
              : null
        }
        accountId={accountId}
        contactId={replyActivity?.contactId}
        subjectDefault={
          typeof replyActivity?.metadata?.subject === "string"
            ? replyActivity.metadata.subject
            : replyActivity?.body.split("\n")[0] ?? ""
        }
        threadId={
          typeof replyActivity?.metadata?.threadId === "string"
            ? replyActivity.metadata.threadId
            : null
        }
        onSent={() => {
          setReplyActivity(null)
          void reload()
        }}
      />
    </div>
  )
}
