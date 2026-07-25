"use client"

import { useState } from "react"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScheduleMeetingDialog } from "@/components/crm/schedule-meeting-dialog"

interface ScheduleMeetingButtonProps {
  titleDefault: string
  attendeeEmail?: string | null
  accountId?: string | null
  contactId?: string | null
  jobId?: string | null
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "icon-sm"
  label?: string
}

export function ScheduleMeetingButton({
  titleDefault,
  attendeeEmail,
  accountId,
  contactId,
  jobId,
  variant = "outline",
  size = "sm",
  label = "Schedule meeting",
}: ScheduleMeetingButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
      >
        <CalendarPlus className="size-3.5" data-icon="inline-start" />
        {label}
      </Button>
      <ScheduleMeetingDialog
        open={open}
        onOpenChange={setOpen}
        titleDefault={titleDefault}
        attendeeEmail={attendeeEmail}
        accountId={accountId}
        contactId={contactId}
        jobId={jobId}
      />
    </>
  )
}
