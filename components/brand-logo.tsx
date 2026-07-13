import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  /** Icon-only size (sidebar collapsed, favicon-style mark) */
  size?: "sm" | "md" | "lg"
  priority?: boolean
}

const sizeMap = {
  sm: { className: "h-8 w-auto", width: 96, height: 32 },
  md: { className: "h-10 w-auto", width: 120, height: 40 },
  lg: { className: "h-14 w-auto", width: 168, height: 56 },
} as const

export function BrandLogo({
  className,
  size = "md",
  priority = false,
}: BrandLogoProps) {
  const dims = sizeMap[size]
  return (
    <Image
      src="/qb-logo.png"
      alt="QB Fabrication"
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn("object-contain rounded-md", dims.className, className)}
    />
  )
}
