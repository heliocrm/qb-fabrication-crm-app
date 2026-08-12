"use client"

import { useState } from "react"
import { ChevronRight, MapPin, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HelpTour as HelpTourData } from "@/lib/help/types"
import { cn } from "@/lib/utils"

interface HelpTourProps {
  tour: HelpTourData
}

/**
 * Simple step-list stub for a guided tour. Each step carries a `targetHint`
 * describing the real UI element it points at — wire a spotlight library to
 * `data-tour="<slug>-step-<n>"` on those elements later; this component
 * already exposes the hook via `data-tour-step`.
 */
export function HelpTour({ tour }: HelpTourProps) {
  const [started, setStarted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="rounded-xl border border-border bg-card p-4" data-tour="help-tour">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{tour.title}</p>
          <p className="text-xs text-muted-foreground">{tour.description}</p>
        </div>
        {!started && (
          <Button size="sm" className="gap-1.5 self-start sm:self-auto" onClick={() => setStarted(true)}>
            <Play className="size-3.5" data-icon="inline-start" />
            Start tour
          </Button>
        )}
      </div>

      {started && (
        <ol className="mt-4 space-y-2">
          {tour.steps.map((step, index) => (
            <li
              key={step.label}
              data-tour-step={index}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                index === activeStep
                  ? "border-[var(--orange)]/40 bg-[var(--orange-muted)]"
                  : "border-border bg-background"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  index === activeStep
                    ? "bg-[var(--orange)] text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  {step.targetHint}
                </p>
              </div>
              {index < tour.steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(index + 1)}
                  className="flex shrink-0 items-center gap-0.5 self-center text-xs font-medium text-primary hover:underline"
                >
                  Next
                  <ChevronRight className="size-3" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
