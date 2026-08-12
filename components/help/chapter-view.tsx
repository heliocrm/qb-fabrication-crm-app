import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HelpImageSlot } from "@/components/help/help-image-slot"
import { WhoCanCallout } from "@/components/help/who-can-callout"
import { HelpTour } from "@/components/help/help-tour"
import { HELP_ICONS } from "@/lib/help/icons"
import type { HelpChapter, HelpCta, HelpSectionBody } from "@/lib/help/types"

function CtaRow({ ctas }: { ctas: HelpCta[] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {ctas.map((cta) => (
        <Button
          key={cta.href}
          size="sm"
          variant="outline"
          className="gap-1.5"
          render={<Link href={cta.href} />}
        >
          {cta.label}
          <ArrowRight className="size-3.5" data-icon="inline-end" />
        </Button>
      ))}
    </div>
  )
}

function SectionBodyView({ body }: { body: HelpSectionBody }) {
  if (body.kind === "text") {
    return <p className="text-sm leading-relaxed text-muted-foreground">{body.body}</p>
  }

  if (body.kind === "steps") {
    return (
      <ol className="space-y-3">
        {body.steps.map((step, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground/80">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm leading-relaxed text-foreground">{step.text}</p>
              {step.imageSlot && <HelpImageSlot description={step.imageSlot} />}
            </div>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {body.headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-muted/20" : undefined}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top text-foreground/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ChapterView({ chapter }: { chapter: HelpChapter }) {
  const Icon = HELP_ICONS[chapter.iconName]

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--orange-muted)] text-[var(--orange)]">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">{chapter.title}</h1>
              {chapter.adminOnly && (
                <Badge variant="secondary" className="text-[10px]">
                  Admin
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{chapter.summary}</p>
          </div>
        </div>

        {chapter.whoCanDoThis && <WhoCanCallout text={chapter.whoCanDoThis} />}

        {chapter.primaryCtas && chapter.primaryCtas.length > 0 && (
          <CtaRow ctas={chapter.primaryCtas} />
        )}
      </header>

      {chapter.tour && <HelpTour tour={chapter.tour} chapterSlug={chapter.slug} />}

      <div className="space-y-6">
        {chapter.subsections.map((sub, index) => (
          <section key={index} className="space-y-2.5 border-t border-border pt-5 first:border-t-0 first:pt-0">
            <h2 className="text-sm font-semibold text-foreground">{sub.heading}</h2>
            {sub.whoCanDoThis && <WhoCanCallout text={sub.whoCanDoThis} />}
            <SectionBodyView body={sub.body} />
            {sub.ctas && sub.ctas.length > 0 && <CtaRow ctas={sub.ctas} />}
          </section>
        ))}
      </div>
    </article>
  )
}
