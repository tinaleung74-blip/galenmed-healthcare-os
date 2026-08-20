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
      description="Review assigned patient queues, open clinically relevant records, complete consultations, and prepare prescriptions."
    />
  )
}
