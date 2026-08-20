import {
  StaffRoleDashboard,
} from "@/features/auth/components/staff-role-dashboard"
import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"

export default async function AdminDashboardPage() {
  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
    ])

  return (
    <StaffRoleDashboard
      context={context}
      title="System Administrator Dashboard"
      description="Manage staff accounts, roles, branch assignments, security controls, and organization-wide system configuration."
      actions={[
        {
          href: "/admin/staff",
          title:
            "Staff Account Management",
          description:
            "Create Receptionist, Doctor, Laboratory Staff, Laboratory Verifier, and Cashier accounts with branch and department access.",
        },
      ]}
    />
  )
}
