import {
  StaffRoleDashboard,
} from "@/features/auth/components/staff-role-dashboard"
import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"

export default async function CashierDashboardPage() {
  const context =
    await requireStaffRole([
      "CASHIER",
    ])

  return (
    <StaffRoleDashboard
      context={context}
      title="Cashier Dashboard"
      description="Search patient billing accounts, post payments, issue receipts, monitor pending and paid balances, and provide payment clearance."
      actions={[
        {
          href: "/cashier/billing",
          title:
            "Patient Billing and Payment Clearance",
          description:
            "Search patients and visits, review consolidated charges, post full or partial payments, print receipts, and clear eligible service requests.",
        },
      ]}
    />
  )
}
