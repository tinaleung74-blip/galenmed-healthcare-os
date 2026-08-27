import type {
  Metadata,
} from "next"

import {
  CashierReceiptDocument,
} from "@/features/hospital-operations/components/cashier-receipt-document"
import {
  getCashierReceiptPageData,
} from "@/features/hospital-operations/utils/cashier-billing.server"

export const metadata: Metadata = {
  title:
    "Payment Receipt | GalenMed",
  description:
    "GalenMed hospital payment receipt print page.",
}

interface CashierReceiptPrintPageProps {
  params: Promise<{
    paymentId: string
  }>
}

export default async function CashierReceiptPrintPage({
  params,
}: CashierReceiptPrintPageProps) {
  const {
    paymentId,
  } = await params

  const {
    data,
  } = await getCashierReceiptPageData(
    paymentId
  )

  return (
    <CashierReceiptDocument
      data={data}
    />
  )
}
