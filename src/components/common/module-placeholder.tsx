import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

type ModulePlaceholderProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: ModulePlaceholderProps) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-96 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-2xl bg-teal-50 p-4 text-teal-700">
              <Icon className="size-8" />
            </div>

            <h2 className="text-lg font-semibold">{title}</h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This module is ready for development. Database integration and
              operational workflows will be added in the next phases.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}