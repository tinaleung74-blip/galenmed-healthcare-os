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
        {
          href: "/admin/services",
          title:
            "Hospital Service Catalog",
          description:
            "Configure consultation, laboratory, radiology, pharmacy, procedure, and other services used by Receptionist intake, queues, and billing.",
        },
      ]}
    />
  )
}
