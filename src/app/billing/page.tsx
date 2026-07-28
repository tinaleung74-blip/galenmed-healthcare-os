import { CreditCard } from "lucide-react"

import { ModulePlaceholder } from "@/components/common/module-placeholder"

export default function Page() {
  return (
    <ModulePlaceholder
      title="Billing"
      description="Manage charges, invoices, payments, and patient account balances."
      icon={CreditCard}
    />
  )
}
