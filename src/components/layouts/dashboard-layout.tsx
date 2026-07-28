import type { ReactNode } from "react"

import { AppHeader } from "@/components/layouts/app-header"
import { AppSidebar } from "@/components/layouts/app-sidebar"

type DashboardLayoutProps = {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <AppSidebar />

        <div className="min-w-0 flex-1">
          <AppHeader />

          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}