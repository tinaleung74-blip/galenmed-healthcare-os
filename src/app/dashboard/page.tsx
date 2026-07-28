import {
  CalendarCheck,
  Clock3,
  PhilippinePeso,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { StatCard } from "@/features/dashboard/components/stat-card"

const queue = [
  {
    patient: "Juan Dela Cruz",
    service: "General Consultation",
    time: "09:30 AM",
    status: "In progress",
  },
  {
    patient: "Ana Reyes",
    service: "Laboratory",
    time: "09:45 AM",
    status: "Waiting",
  },
  {
    patient: "Carlo Mendoza",
    service: "Radiology",
    time: "10:00 AM",
    status: "Waiting",
  },
  {
    patient: "Liza Ramos",
    service: "Follow-up Consultation",
    time: "10:15 AM",
    status: "Confirmed",
  },
]

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Monday, July 28, 2026
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Good afternoon, Dr. Santos
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Here is today&apos;s clinic overview.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Patients"
            value="1,248"
            description="+8.2% from last month"
            icon={Users}
          />

          <StatCard
            title="Today's Appointments"
            value="32"
            description="12 appointments remaining"
            icon={CalendarCheck}
          />

          <StatCard
            title="Patients in Queue"
            value="8"
            description="Average wait: 18 minutes"
            icon={Clock3}
          />

          <StatCard
            title="Today's Revenue"
            value="₱84,250"
            description="+5.4% from yesterday"
            icon={PhilippinePeso}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Patient Queue</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {queue.map((item) => (
                <div
                  key={`${item.patient}-${item.time}`}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.patient}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.service}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">{item.time}</p>

                  <Badge
                    variant={
                      item.status === "In progress" ? "default" : "secondary"
                    }
                    className={
                      item.status === "In progress"
                        ? "bg-teal-700 hover:bg-teal-700"
                        : ""
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Department Activity</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {[
                ["Consultations", "24", "75%"],
                ["Laboratory Tests", "18", "56%"],
                ["Radiology Requests", "9", "28%"],
                ["Pharmacy Orders", "21", "66%"],
              ].map(([label, value, width]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-700"
                      style={{ width }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}