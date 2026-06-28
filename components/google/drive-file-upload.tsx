"use client"

import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DriveFileUploadProps {
  onUpload: (file: File) => void
  isPending?: boolean
  disabled?: boolean
  className?: string
}

export function DriveFileUpload({
  onUpload,
  isPending,
  disabled,
  className,
}: DriveFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onUpload(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Button
          type="button"
          size="sm"
          className="gap-1.5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white border-0"
          disabled={disabled || isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <Upload className="size-4" data-icon="inline-start" />
          )}
          Upload to Drive
        </Button>
      </div>

      <button
        type="button"
        disabled={disabled || isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-[var(--orange)] bg-[var(--orange-muted)]/30"
            : "border-border hover:border-[var(--orange)] hover:bg-[var(--orange-muted)]/30 dark:hover:bg-[var(--orange)]/5",
          (disabled || isPending) && "opacity-60 pointer-events-none"
        )}
      >
        {isPending ? (
          <Loader2 className="size-8 text-muted-foreground mx-auto mb-2 animate-spin" />
        ) : (
          <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
        )}
        <p className="text-sm font-medium text-muted-foreground">
          Drop files here or click to upload to Google Drive
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, DWG, DXF, XLSX — up to 50MB each
        </p>
      </button>
    </>
  )
}
