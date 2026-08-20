import Image from "next/image"

import { cn } from "@/lib/utils"

type GalenMedLogoSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"

interface GalenMedLogoProps {
  size?: GalenMedLogoSize
  priority?: boolean
  className?: string
}

const logoDimensions: Record<
  GalenMedLogoSize,
  number
> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
}

const logoSizeClasses: Record<
  GalenMedLogoSize,
  string
> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
  xl: "size-[4.5rem]",
}

export function GalenMedLogo({
  size = "md",
  priority = false,
  className,
}: GalenMedLogoProps) {
  const dimension =
    logoDimensions[size]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        logoSizeClasses[size],
        className
      )}
    >
      <Image
        src="/brand/galenmed-logo.png"
        alt="GalenMed logo"
        width={dimension}
        height={dimension}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </span>
  )
}
