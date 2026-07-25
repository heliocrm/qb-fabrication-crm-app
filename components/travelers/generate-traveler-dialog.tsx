"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TravelerJobFlow } from "@/components/travelers/traveler-job-flow"

interface GenerateTravelerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobNumber: string
  poNumber: string
  description: string
  onGenerated?: () => void
}

export function GenerateTravelerDialog({
  open,
  onOpenChange,
  jobId,
  jobNumber,
  poNumber,
  description,
  onGenerated,
}: GenerateTravelerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate traveler</DialogTitle>
          <DialogDescription>
            Upload work order PDF → review Structure #s → create Word file in
            Drive.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <TravelerJobFlow
            jobId={jobId}
            jobNumber={jobNumber}
            poNumber={poNumber}
            description={description}
            variant="crm"
            onClose={() => onOpenChange(false)}
            onGenerated={onGenerated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
