import type {
  Metadata,
} from "next"

import {
  ServiceCatalogWorkspace,
} from "@/features/hospital-operations/components/service-catalog-workspace"
import {
  getServiceCatalogPageData,
} from "@/features/hospital-operations/utils/service-catalog.server"

export const metadata: Metadata = {
  title:
    "Service Catalog | GalenMed",
  description:
    "Manage approved GalenMed hospital services, departments, branch scope, and default pricing.",
}

export default async function AdminServicesPage() {
  const {
    context,
    data,
  } =
    await getServiceCatalogPageData()

  return (
    <ServiceCatalogWorkspace
      context={context}
      data={data}
    />
  )
}
