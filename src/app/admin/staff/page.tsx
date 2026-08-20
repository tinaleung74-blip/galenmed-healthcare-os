import type {
  Metadata,
} from "next"

import {
  StaffManagementWorkspace,
} from "@/features/staff/components/staff-management-workspace"
import {
  getStaffManagementPageData,
} from "@/features/staff/utils/staff-management.server"

export const metadata: Metadata = {
  title:
    "Staff Accounts | GalenMed",
  description:
    "Secure GalenMed staff account administration.",
}

export default async function AdminStaffPage() {
  const {
    context,
    data,
  } =
    await getStaffManagementPageData()

  return (
    <StaffManagementWorkspace
      context={context}
      data={data}
    />
  )
}
