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
      description="Register patients, create hospital visits, route service requests, assign consultation Doctors, monitor payment clearance, and release finalized documents."
      actions={[
        {
          href:
            "/reception/patient-portal-accounts",
          title:
            "Patient Portal Account Management",
          description:
            "Create and link a secure Patient Portal login to the correct verified medical record.",
        },
        {
          href: "/reception/prescriptions",
          title:
            "Prescription Review Queue",
          description:
            "Review Doctor-signed prescriptions, return corrections, or approve payment-controlled patient release.",
        },        {
          href: "/reception/intake",
          title:
            "Patient Intake and Service Routing",
          description:
            "Search or register a patient, create a visit, route an approved hospital service, and generate the department queue and initial billing charge.",
        },
        {
          href: "/reception/doctor-assignments",
          title:
            "Doctor Assignment Queue",
          description:
            "Assign active Doctors to consultation requests before they appear in the Doctor patient queue.",
        },
        {
          href: "/reception/releases",
          title:
            "Patient Document Release Center",
          description:
            "View finalized clinical documents, enforce payment clearance, print patient copies, and record release evidence.",
        },
      ]}
    />
  )
}
