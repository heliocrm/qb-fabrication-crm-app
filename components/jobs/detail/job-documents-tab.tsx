"use client"

import { useState } from "react"
import {
  AlertCircle,
  Download,
  ExternalLink,
  Eye,
  FolderOpen,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreateJobFolderButton } from "@/components/google/create-job-folder-button"
import { DriveFileUpload } from "@/components/google/drive-file-upload"
import { useJobDrive } from "@/hooks/use-job-drive"
import {
  docTypeMeta,
  formatJobDate,
} from "@/lib/job-detail-config"
import {
  driveFilePreviewUrl,
  driveFolderUrl,
  isGoogleDriveFolderId,
} from "@/lib/google/drive/urls"
import { isPreviewableMime } from "@/lib/google/drive/mime"
import type { Document, Job } from "@/types"

interface JobDocumentsTabProps {
  job: Job
  jobId?: string
  dataSource?: "supabase" | "mock"
}

export function JobDocumentsTab({ job, jobId, dataSource }: JobDocumentsTabProps) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [docFilter, setDocFilter] = useState<"all" | "job" | string>("all")
  const [uploadScope, setUploadScope] = useState<"job" | string>("job")
  const effectiveJobId = jobId ?? job.id
  const useLiveDrive = dataSource === "supabase" && Boolean(jobId)
  const lineItems = job.lineItems ?? []

  const {
    folderId,
    documents,
    source,
    error,
    isLoading,
    isPending,
    refresh,
    createFolder,
    uploadFile,
  } = useJobDrive({
    jobId: effectiveJobId,
    initialFolderId: job.googleDriveFolderId,
    initialDocuments: job.documents,
    enabled: useLiveDrive,
  })

  const displayDocs = useLiveDrive ? documents : job.documents

  const filteredDocs = displayDocs.filter((d) => {
    if (docFilter === "all") return true
    if (docFilter === "job") return !d.lineItemId
    return d.lineItemId === docFilter
  })

  const jobLevelDocs = filteredDocs.filter((d) => !d.lineItemId)
  const lineItemGroups = lineItems
    .map((li) => ({
      lineItem: li,
      docs: filteredDocs.filter((d) => d.lineItemId === li.id),
    }))
    .filter((g) => g.docs.length > 0 || docFilter === g.lineItem.id)

  const uploadLineItemId = uploadScope === "job" ? null : uploadScope
  const activeFolderId = useLiveDrive ? folderId ?? job.googleDriveFolderId : job.googleDriveFolderId
  const folderUrl = isGoogleDriveFolderId(activeFolderId)
    ? driveFolderUrl(activeFolderId!)
    : null

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Drive error</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 h-8" onClick={() => refresh()}>
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" /> Loading files…
              </span>
            ) : (
              <>
                {displayDocs.length} file{displayDocs.length !== 1 ? "s" : ""}
                {useLiveDrive && source === "drive" && (
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    Live from Drive
                  </Badge>
                )}
              </>
            )}
          </p>
          {useLiveDrive && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => refresh()}
              disabled={isLoading}
              aria-label="Refresh files"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {useLiveDrive && (
            <CreateJobFolderButton
              folderId={activeFolderId}
              onCreateFolder={createFolder}
              isPending={isPending}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={docFilter === "all"} onClick={() => setDocFilter("all")}>
          All ({displayDocs.length})
        </FilterChip>
        <FilterChip active={docFilter === "job"} onClick={() => setDocFilter("job")}>
          Job-level ({displayDocs.filter((d) => !d.lineItemId).length})
        </FilterChip>
        {lineItems.map((li) => (
          <FilterChip
            key={li.id}
            active={docFilter === li.id}
            onClick={() => setDocFilter(li.id)}
          >
            {li.lineItemNumber ?? li.title.slice(0, 20)} (
            {displayDocs.filter((d) => d.lineItemId === li.id).length})
          </FilterChip>
        ))}
      </div>

      {/* Google Drive folder card */}
      <Card className="border shadow-sm bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-4">
          <FolderOpen className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Google Drive Folder
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
              {activeFolderId && isGoogleDriveFolderId(activeFolderId)
                ? activeFolderId
                : `${job.jobNumber} – not linked yet`}
            </p>
          </div>
          {folderUrl ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shrink-0"
              render={
                <a href={folderUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              <ExternalLink className="size-3.5" data-icon="inline-start" />
              Open Drive
            </Button>
          ) : useLiveDrive ? (
            <CreateJobFolderButton
              folderId={activeFolderId}
              onCreateFolder={createFolder}
              isPending={isPending}
              className="border-blue-200 dark:border-blue-800"
            />
          ) : null}
        </CardContent>
      </Card>

      {isLoading && displayDocs.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {(docFilter === "all" || docFilter === "job") && jobLevelDocs.length > 0 && (
            <DocumentSection title="Job-level files" docs={jobLevelDocs} onPreview={setPreviewDoc} />
          )}
          {lineItemGroups.map(({ lineItem, docs }) =>
            docs.length > 0 ? (
              <DocumentSection
                key={lineItem.id}
                title={lineItem.title}
                subtitle={lineItem.lineItemNumber ? `CID ${lineItem.lineItemNumber}` : undefined}
                docs={docs}
                onPreview={setPreviewDoc}
              />
            ) : null
          )}
        </>
      )}

      {!isLoading && filteredDocs.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No documents yet. Create a Drive folder and upload files to get started.
          </CardContent>
        </Card>
      )}

      {!useLiveDrive && (
        <p className="text-xs text-muted-foreground text-center">
          Connect Supabase + Google Workspace for live Drive sync.
        </p>
      )}

      {useLiveDrive && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Upload scope:</span>
            <select
              value={uploadScope}
              onChange={(e) => setUploadScope(e.target.value)}
              className="text-xs rounded-md border border-input bg-transparent px-2 py-1"
            >
              <option value="job">Job-level</option>
              {lineItems.map((li) => (
                <option key={li.id} value={li.id}>
                  {li.title}
                </option>
              ))}
            </select>
          </div>
          <DriveFileUpload
            onUpload={(file) => uploadFile(file, uploadLineItemId)}
            isPending={isPending}
          />
        </div>
      )}

      <PreviewDialog doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-[var(--orange-muted)] border-[var(--orange)] text-foreground font-medium"
          : "bg-muted/40 border-transparent text-muted-foreground hover:border-border"
      }`}
    >
      {children}
    </button>
  )
}

function DocumentSection({
  title,
  subtitle,
  docs,
  onPreview,
}: {
  title: string
  subtitle?: string
  docs: Document[]
  onPreview: (doc: Document) => void
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
        {title}
        {subtitle && <span className="font-normal normal-case ml-2">({subtitle})</span>}
        <span className="ml-1">· {docs.length}</span>
      </p>
      <div className="space-y-2">
        {docs.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            meta={docTypeMeta[doc.type]}
            onPreview={() => onPreview(doc)}
          />
        ))}
      </div>
    </div>
  )
}

function DocumentRow({
  doc,
  meta,
  onPreview,
}: {
  doc: Document
  meta: { icon: string; color: string }
  onPreview: () => void
}) {
  const fileId = doc.googleDriveFileId
  const mime = doc.mimeType ?? "application/octet-stream"
  const canPreview = doc.preview ?? isPreviewableMime(mime)
  const viewUrl = doc.webViewLink ?? doc.url
  const thumbUrl =
    doc.mimeType?.startsWith("image/") && fileId
      ? doc.webViewLink
      : fileId
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w220`
        : null

  return (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow ${meta.color}`}>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="size-10 rounded-lg bg-background/80 border overflow-hidden flex items-center justify-center text-lg shrink-0">
          {thumbUrl && (mime.startsWith("image/") || mime === "application/pdf") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt=""
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            meta.icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          <p className="text-xs text-muted-foreground">
            {doc.size ?? "—"} · {doc.uploadedBy} · {formatJobDate(doc.uploadedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canPreview && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs hidden sm:flex"
              onClick={onPreview}
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
          )}
          {viewUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Open ${doc.name} in Drive`}
              render={
                <a href={viewUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              <ExternalLink className="size-3.5" />
            </Button>
          )}
          {fileId && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Download ${doc.name}`}
              render={
                <a
                  href={`https://drive.google.com/uc?export=download&id=${fileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Download className="size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewDialog({
  doc,
  onClose,
}: {
  doc: Document | null
  onClose: () => void
}) {
  const fileId = doc?.googleDriveFileId
  const previewUrl = fileId ? driveFilePreviewUrl(fileId) : doc?.url

  return (
    <Dialog open={!!doc} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc?.name}</DialogTitle>
          <DialogDescription>
            {doc?.type} · {doc?.size ?? "—"}
          </DialogDescription>
        </DialogHeader>

        {previewUrl && fileId ? (
          <div className="rounded-lg border overflow-hidden bg-muted/30 aspect-[4/3]">
            <iframe
              src={previewUrl}
              title={doc.name}
              className="w-full h-full min-h-[360px]"
              allow="autoplay"
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 aspect-[4/3] flex flex-col items-center justify-center gap-3 p-8">
            <div className="text-5xl">
              {doc ? docTypeMeta[doc.type].icon : "📄"}
            </div>
            <p className="text-sm text-muted-foreground">Preview not available</p>
          </div>
        )}

        <DialogFooter>
          {previewUrl && (
            <Button
              variant="outline"
              render={
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              <ExternalLink className="size-4" data-icon="inline-start" />
              Open in Drive
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
