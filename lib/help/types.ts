/** Role filter chips shown in the Help Center — a superset of OrganizationRole
 *  that also includes "floor" for shop-floor / station-tablet audiences. */
export type HelpRole = "admin" | "manager" | "member" | "viewer" | "floor"

export const HELP_ROLES: { value: HelpRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
  { value: "floor", label: "Floor" },
]

export type HelpNavGroup = "user-guide" | "admin-guide" | "floor-cheat-sheets"

export const HELP_NAV_GROUP_LABELS: Record<HelpNavGroup, string> = {
  "user-guide": "User guide",
  "admin-guide": "Admin guide",
  "floor-cheat-sheets": "Floor cheat sheets",
}

export interface HelpStep {
  text: string
  /** Description for a future screenshot — rendered as a placeholder slot. */
  imageSlot?: string
}

export interface HelpCta {
  label: string
  href: string
}

export interface HelpTableSection {
  kind: "table"
  headers: string[]
  rows: string[][]
}

export interface HelpStepsSection {
  kind: "steps"
  steps: HelpStep[]
}

export interface HelpTextSection {
  kind: "text"
  body: string
}

export type HelpSectionBody = HelpTableSection | HelpStepsSection | HelpTextSection

export interface HelpSubsection {
  heading: string
  whoCanDoThis?: string
  body: HelpSectionBody
  ctas?: HelpCta[]
}

export type HelpIconName =
  | "Rocket"
  | "LayoutDashboard"
  | "TrendingUp"
  | "Briefcase"
  | "Building2"
  | "Bell"
  | "Mail"
  | "Package"
  | "ClipboardList"
  | "BarChart3"
  | "Link2"
  | "CircleHelp"
  | "BookOpen"
  | "Shield"
  | "Tablet"

export interface HelpTour {
  title: string
  description: string
  /** Element hooks that a future spotlight library can target. */
  steps: { label: string; targetHint: string }[]
}

export interface HelpChapter {
  slug: string
  title: string
  navGroup: HelpNavGroup
  iconName: HelpIconName
  summary: string
  whoCanDoThis?: string
  /** Roles for whom this chapter is a recommended starting point. */
  recommendedFor: HelpRole[]
  subsections: HelpSubsection[]
  primaryCtas?: HelpCta[]
  tour?: HelpTour
  adminOnly?: boolean
}
