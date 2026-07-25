import { SectionAccessMatrix } from "@/components/admin/section-access-matrix"
import type { SectionAccessRow } from "@/components/admin/section-access-matrix"

interface OrgSettingsPanelProps {
  sectionAccessRows: SectionAccessRow[]
}

export function OrgSettingsPanel({ sectionAccessRows }: OrgSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <SectionAccessMatrix initialRows={sectionAccessRows} />
    </div>
  )
}

/** @deprecated Use OrgSettingsPanel */
export const OrgSettingsPlaceholder = OrgSettingsPanel
