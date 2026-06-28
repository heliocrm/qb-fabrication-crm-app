"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { StageBadge } from "@/components/status-badge"
import { cn } from "@/lib/utils"
import { formatCloseDate, formatOppValue } from "@/lib/opportunities-config"
import type { Opportunity } from "@/types"

interface OpportunityListProps {
  opportunities: Opportunity[]
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  const sorted = [...opportunities].sort((a, b) => b.value - a.value)

  if (sorted.length === 0) {
    return (
      <Card className="border shadow-sm">
        <div className="py-16 text-center text-sm text-muted-foreground">
          No opportunities match your search.
        </div>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {[
                "Opportunity",
                "Customer",
                "Stage",
                "Value",
                "Probability",
                "Close Date",
                "Assignee",
              ].map((h, idx) => (
                <th
                  key={h}
                  className={cn(
                    "text-left font-medium text-muted-foreground px-4 py-3 text-xs whitespace-nowrap",
                    idx === 0 && "pl-5",
                    idx === 6 && "pr-5",
                    idx >= 4 && idx <= 5 && "hidden md:table-cell"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((opp, i) => (
              <tr
                key={opp.id}
                className={cn(
                  "border-b last:border-0 hover:bg-muted/30 transition-colors",
                  i % 2 !== 0 && "bg-muted/10"
                )}
              >
                <td className="px-5 py-3 max-w-xs">
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {opp.title}
                  </p>
                  {opp.notes && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 max-w-sm">
                      {opp.notes}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium max-w-[140px] truncate">
                      {opp.customer}
                    </span>
                    {opp.customerId === "c1" && (
                      <Badge className="text-[8px] px-1 py-0 bg-[var(--navy)] text-white border-0 shrink-0">
                        BPA
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StageBadge stage={opp.stage} />
                </td>
                <td className="px-4 py-3 text-xs font-semibold tabular-nums whitespace-nowrap">
                  {formatOppValue(opp.value)}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={opp.probability} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {opp.probability}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
                  {formatCloseDate(opp.closeDate)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[9px] font-bold bg-[var(--orange)] text-white">
                        {opp.assignee
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground hidden lg:inline">
                      {opp.assignee.split(" ")[0]}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
