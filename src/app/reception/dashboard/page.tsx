import {
  StaffRoleDashboard,
} from "@/features/auth/components/staff-role-dashboard"
import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"

export default async function ReceptionDashboardPage() {
  const context =
    await requireStaffRole([
      "RECEPTIONIST",
    ])

  return (
    <StaffRoleDashboard
      context={context}
      title="Reception and Release Dashboard"
      description="Register patients, create hospital visits, route service requests, monitor payment clearance, and release finalized documents."
    />
  )
}
