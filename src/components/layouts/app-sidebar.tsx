"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Pill,
  ScanLine,
  Settings,
  Stethoscope,
  Users,
  Settings2,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Patients",
    href: "/patients",
    icon: Users,
  },
  {
    name: "Consultations",
    href: "/consultations",
    icon: Stethoscope,
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    name: "Laboratory",
    href: "/laboratory",
    icon: FlaskConical,
  },
  {
    name: "Radiology",
    href: "/radiology",
    icon: ScanLine,
  },
  {
    name: "Pharmacy",
    href: "/pharmacy",
    icon: Pill,
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings2,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-white">
          <Activity className="size-5" />
        </div>

        <div>
          <p className="font-semibold tracking-tight">GalenMed</p>
          <p className="text-xs text-muted-foreground">Healthcare OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className="size-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/settings"
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-teal-50 text-teal-800"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
