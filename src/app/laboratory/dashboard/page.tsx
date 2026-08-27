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
      description="Manage Laboratory queues, requested tests, result entry, authorized verification, and payment-aware release status."
      actions={[
        {
          href: "/laboratory/queue",
          title:
            "Laboratory Patient Queue",
          description:
            "View queued patients and requested tests, call patients, start service, monitor payment status, and complete the department queue workflow.",
        },
        {
          href: "/laboratory/results",
          title:
            "Result Entry and Verification",
          description:
            "Enter structured results, submit drafts for Laboratory Verifier review, finalize verified documents, and monitor Reception release readiness.",
        },
      ]}
    />
  )
}
