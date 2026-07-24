"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { JobListItem } from "@/types"

export function TravelerJobPicker({ jobs }: { jobs: JobListItem[] }) {
  const [q, setQ] = useState("")
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return jobs
    return jobs.filter(
      (j) =>
        j.jobNumber.toLowerCase().includes(term) ||
        j.poNumber.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term) ||
        j.customer.toLowerCase().includes(term)
    )
  }, [jobs, q])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Pick a job, upload the work order, generate a traveler.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            const value = e.target.value
            startTransition(() => setQ(value))
          }}
          placeholder="Search job #, PO, customer…"
          className="min-h-12 pl-9 text-base"
          autoComplete="off"
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((job) => (
          <li key={job.id}>
            <Link
              href={`/traveler/jobs/${job.id}`}
              className="block rounded-lg border bg-card p-4 min-h-14 touch-manipulation active:bg-muted/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-[var(--orange)]">
                    {job.jobNumber}
                  </p>
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {job.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {job.customer} · PO {job.poNumber}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {job.status}
                </Badge>
              </div>
            </Link>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No jobs match that search.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
