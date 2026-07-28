import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type StatCardProps = {
  title: string
  value: string
  description: string
  icon: LucideIcon
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}