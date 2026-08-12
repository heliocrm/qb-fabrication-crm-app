import { notFound } from "next/navigation"
import { ChapterView } from "@/components/help/chapter-view"
import { RoleFilterChips } from "@/components/help/role-filter-chips"
import { getHelpChapter, helpChapters } from "@/lib/help/content"

export function generateStaticParams() {
  return helpChapters.map((chapter) => ({ slug: chapter.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const chapter = getHelpChapter(slug)
  return {
    title: chapter ? `${chapter.title} — Help Center` : "Help Center",
    description: chapter?.summary,
  }
}

export default async function HelpChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const chapter = getHelpChapter(slug)

  if (!chapter) {
    notFound()
  }

  return (
    <div className="space-y-5">
      <RoleFilterChips />
      <ChapterView chapter={chapter} />
    </div>
  )
}
