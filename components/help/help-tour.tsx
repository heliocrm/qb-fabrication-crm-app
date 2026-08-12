"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { Check, MapPin, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHelpUserId } from "@/components/help/help-user-context"
import { isTourCompleted, markTourCompleted } from "@/lib/help/tour-storage"
import type { HelpTour as HelpTourData } from "@/lib/help/types"
import { cn } from "@/lib/utils"

interface HelpTourProps {
  tour: HelpTourData
  /** Chapter slug — namespaces the DOM ids and the localStorage completion key. */
  chapterSlug: string
}

/**
 * A short, skippable spotlight walkthrough over this chapter's own step list.
 * Driver.js dims the page and highlights each step card in turn while a
 * popover explains what to do and where to find it in the real app.
 * Completion is recorded in localStorage per signed-in user.
 */
export function HelpTour({ tour, chapterSlug }: HelpTourProps) {
  const userId = useHelpUserId()
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setCompleted(isTourCompleted(userId, chapterSlug))
  }, [userId, chapterSlug])

  function stepId(index: number) {
    return `help-tour-${chapterSlug}-step-${index}`
  }

  function startTour() {
    const driverObj = driver({
      animate: true,
      allowClose: true,
      overlayOpacity: 0.65,
      stagePadding: 6,
      stageRadius: 10,
      smoothScroll: true,
      showProgress: true,
      progressText: "Step {{current}} of {{total}}",
      popoverClass: "help-tour-popover",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      onCloseClick: () => {
        driverObj.destroy()
      },
      onDoneClick: () => {
        markTourCompleted(userId, chapterSlug)
        setCompleted(true)
        driverObj.destroy()
      },
      steps: tour.steps.map((step, index) => ({
        element: `#${stepId(index)}`,
        popover: {
          title: step.label,
          description: `Look for: ${step.targetHint}`,
          side: "bottom",
          align: "start",
        },
      })),
    })

    driverObj.drive()
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4" data-tour={chapterSlug}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{tour.title}</p>
            {completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--orange-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--orange)]">
                <Check className="size-3" aria-hidden="true" />
                Completed
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{tour.description}</p>
        </div>
        <Button size="sm" variant={completed ? "outline" : "default"} className="gap-1.5 self-start sm:self-auto" onClick={startTour}>
          {completed ? (
            <>
              <RotateCcw className="size-3.5" data-icon="inline-start" />
              Replay tour
            </>
          ) : (
            <>
              <Play className="size-3.5" data-icon="inline-start" />
              Start tour
            </>
          )}
        </Button>
      </div>

      <ol className="mt-4 space-y-2">
        {tour.steps.map((step, index) => (
          <li
            key={step.label}
            id={stepId(index)}
            data-tour-step={index}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            )}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{step.label}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                {step.targetHint}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
