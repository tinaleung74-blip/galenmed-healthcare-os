import {
  StaffRoleDashboard,
} from "@/features/auth/components/staff-role-dashboard"
import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"

export default async function DoctorDashboardPage() {
  const context =
    await requireStaffRole([
      "DOCTOR",
    ])

  return (
    <StaffRoleDashboard
      context={context}
      title="Doctor Dashboard"
      description="Open assigned consultation patients, review authorized clinical information, and document Doctor consultations."
      actions={[
        {
          href: "/doctor/prescriptions",
          title:
            "Prescription Composer",
          description:
            "Create, correct, sign, and submit prescriptions linked to your Doctor consultations.",
        },        {
          href: "/doctor/queue",
          title:
            "Assigned Patient Queue",
          description:
            "Open consultation requests assigned to your Doctor account and start or continue clinical documentation.",
        },
      ]}
    />
  )
}
