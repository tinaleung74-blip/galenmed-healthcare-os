import {
  StaffRoleDashboard,
} from "@/features/auth/components/staff-role-dashboard"
import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"

export default async function LaboratoryStaffDashboardPage() {
  const context =
    await requireStaffRole([
      "LABORATORY_STAFF",
      "LABORATORY_VERIFIER",
    ])

  return (
    <StaffRoleDashboard
      context={context}
      title="Laboratory Staff Dashboard"
      description="Manage laboratory queues, requested tests, specimen workflows, result entry, and authorized result verification."
    />
  )
}
