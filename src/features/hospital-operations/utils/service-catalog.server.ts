import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import type {
  HospitalServiceType,
  ServiceCatalogBranch,
  ServiceCatalogDepartment,
  ServiceCatalogItem,
  ServiceCatalogPageData,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  HOSPITAL_SERVICE_TYPES,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  createAdminClient,
} from "@/lib/supabase/admin"

interface RawServiceCatalogItem {
  id: string
  code: string
  name: string
  description: string | null
  service_type: string
  department_id: string
  branch_id: string | null
  default_price_centavos: number
  doctor_order_required: boolean
  allows_patient_request: boolean
  active: boolean
  created_at: string
  updated_at: string
}

interface RawDepartment {
  id: string
  code: string
  name: string
  active: boolean
}

interface RawBranch {
  id: string
  code: string
  name: string
  active: boolean
}

function isHospitalServiceType(
  value: string
): value is HospitalServiceType {
  return HOSPITAL_SERVICE_TYPES.some(
    (serviceType) =>
      serviceType === value
  )
}

export async function getServiceCatalogPageData(): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  data: ServiceCatalogPageData
}> {
  const context =
    await requireStaffRole([
      "SYSTEM_ADMIN",
    ])

  const adminClient =
    createAdminClient()

  const [
    itemResult,
    departmentResult,
    branchResult,
  ] = await Promise.all([
    adminClient
      .from(
        "service_catalog_items"
      )
      .select(
        "id, code, name, description, service_type, department_id, branch_id, default_price_centavos, doctor_order_required, allows_patient_request, active, created_at, updated_at"
      )
      .order("name"),

    adminClient
      .from("staff_departments")
      .select(
        "id, code, name, active"
      )
      .order("name"),

    adminClient
      .from("hospital_branches")
      .select(
        "id, code, name, active"
      )
      .order("name"),
  ])

  if (
    itemResult.error ||
    departmentResult.error ||
    branchResult.error
  ) {
    throw new Error(
      "Unable to load the GalenMed service catalog."
    )
  }

  const rawItems =
    (itemResult.data ?? []) as
      RawServiceCatalogItem[]

  const rawDepartments =
    (departmentResult.data ?? []) as
      RawDepartment[]

  const rawBranches =
    (branchResult.data ?? []) as
      RawBranch[]

  const departments:
    ServiceCatalogDepartment[] =
    rawDepartments.map(
      (department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        active: department.active,
      })
    )

  const branches:
    ServiceCatalogBranch[] =
    rawBranches.map(
      (branch) => ({
        id: branch.id,
        code: branch.code,
        name: branch.name,
        active: branch.active,
      })
    )

  const departmentById =
    new Map(
      departments.map(
        (department) => [
          department.id,
          department,
        ]
      )
    )

  const branchById =
    new Map(
      branches.map(
        (branch) => [
          branch.id,
          branch,
        ]
      )
    )

  const items:
    ServiceCatalogItem[] =
    rawItems.map((item) => {
      if (
        !isHospitalServiceType(
          item.service_type
        )
      ) {
        throw new Error(
          `Unsupported service type: ${item.service_type}`
        )
      }

      const department =
        departmentById.get(
          item.department_id
        )

      if (!department) {
        throw new Error(
          `Department missing for service ${item.code}.`
        )
      }

      const branch =
        item.branch_id
          ? branchById.get(
              item.branch_id
            ) ?? null
          : null

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        description:
          item.description,
        serviceType:
          item.service_type,
        departmentId:
          department.id,
        departmentCode:
          department.code,
        departmentName:
          department.name,
        branchId:
          branch?.id ?? null,
        branchCode:
          branch?.code ?? null,
        branchName:
          branch?.name ?? null,
        defaultPriceCentavos:
          item.default_price_centavos,
        doctorOrderRequired:
          item.doctor_order_required,
        allowsPatientRequest:
          item.allows_patient_request,
        active: item.active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }
    })

  return {
    context,
    data: {
      items,
      departments,
      branches,
    },
  }
}
