import type {
  Metadata,
} from "next"

import {
  CashierBillingWorkspace,
} from "@/features/hospital-operations/components/cashier-billing-workspace"
import {
  getCashierBillingPageData,
} from "@/features/hospital-operations/utils/cashier-billing.server"

export const metadata: Metadata = {
  title:
    "Cashier Billing | GalenMed",
  description:
    "Search patient billing, post payments, issue receipt references, and manage payment clearance.",
}

export default async function CashierBillingPage() {
  const {
    context,
    data,
  } = await getCashierBillingPageData()

  return (
    <CashierBillingWorkspace
      context={context}
      data={data}
    />
  )
}
