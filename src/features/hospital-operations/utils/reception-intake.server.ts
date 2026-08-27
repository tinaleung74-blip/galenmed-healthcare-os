import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  HOSPITAL_SERVICE_TYPES,
  type HospitalServiceType,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  RECEPTION_ARRIVAL_MODES,
  RECEPTION_QUEUE_STATUSES,
  RECEPTION_REQUEST_STATUSES,
  RECEPTION_SERVICE_PRIORITIES,
  RECEPTION_VISIT_STATUSES,
  type ReceptionArrivalMode,
  type ReceptionIntakePageData,
  type ReceptionPatientRecord,
  type ReceptionQueueStatus,
  type ReceptionRequestStatus,
  type ReceptionServiceCatalogItem,
  type ReceptionServicePriority,
  type ReceptionServiceRequestRecord,
  type ReceptionVisitRecord,
  type ReceptionVisitStatus,
} from "@/features/hospital-operations/types/reception-intake.types"
import {
  getManilaDateKey,
} from "@/features/hospital-operations/utils/reception-intake.utils"
import {
  createClient,
} from "@/lib/supabase/server"

interface RawPatient {
  id: string
  medical_record_number: string
  first_name: string
  middle_name: string | null
  last_name: string
  date_of_birth: string
  biological_sex: string
  mobile_number: string | null
  email_address: string | null
  branch_id: string
  status: string
  created_at: string
  updated_at: string
}

interface RawVisit {
  id: string
  visit_number: string
  patient_id: string
  branch_id: string
  arrival_mode: string
  initial_service_type: string
  chief_concern: string | null
  status: string
  registered_at: string
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

interface RawCatalogItem {
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
}

interface RawDepartment {
  id: string
  code: string
  name: string
}

interface RawServiceRequest {
  id: string
  request_number: string
  visit_id: string
  patient_id: string
  branch_id: string
  service_catalog_item_id: string | null
  service_type: string
  assigned_department_id: string
  priority: string
  status: string
  queued_at: string | null
  created_at: string
}

interface RawQueueEntry {
  id: string
  queue_number: string
  service_request_id: string
  status: string
}

interface RawPaymentClearance {
  service_request_id: string
  clearance_status: string
  required_amount_centavos: number
  cleared_amount_centavos: number
}

function includesValue<
  Value extends string,
>(
  values: readonly Value[],
  candidate: string
): candidate is Value {
  return values.some(
    (value) => value === candidate
  )
}

function requireHospitalServiceType(
  value: string
): HospitalServiceType {
  if (
    !includesValue(
      HOSPITAL_SERVICE_TYPES,
      value
    )
  ) {
    throw new Error(
      `Unsupported hospital service type: ${value}`
    )
  }

  return value
}

function requireArrivalMode(
  value: string
): ReceptionArrivalMode {
  if (
    !includesValue(
      RECEPTION_ARRIVAL_MODES,
      value
    )
  ) {
    throw new Error(
      `Unsupported arrival mode: ${value}`
    )
  }

  return value
}

function requireVisitStatus(
  value: string
): ReceptionVisitStatus {
  if (
    !includesValue(
      RECEPTION_VISIT_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported hospital visit status: ${value}`
    )
  }

  return value
}

function requireRequestStatus(
  value: string
): ReceptionRequestStatus {
  if (
    !includesValue(
      RECEPTION_REQUEST_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported service request status: ${value}`
    )
  }

  return value
}

function requireQueueStatus(
  value: string
): ReceptionQueueStatus {
  if (
    !includesValue(
      RECEPTION_QUEUE_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported queue status: ${value}`
    )
  }

  return value
}

function requirePriority(
  value: string
): ReceptionServicePriority {
  if (
    !includesValue(
      RECEPTION_SERVICE_PRIORITIES,
      value
    )
  ) {
    throw new Error(
      `Unsupported service priority: ${value}`
    )
  }

  return value
}

export async function getReceptionIntakePageData() {
  const context =
    await requireStaffRole([
      "RECEPTIONIST",
      "SYSTEM_ADMIN",
    ])

  const branches =
    context.branches.map(
      (branch) => ({
        id: branch.id,
        code: branch.code,
        name: branch.name,
        isPrimary:
          branch.isPrimary,
      })
    )

  if (branches.length === 0) {
    return {
      context,
      data: {
        branches: [],
        patients: [],
        activeVisits: [],
        catalogItems: [],
        activeRequests: [],
      } satisfies ReceptionIntakePageData,
    }
  }

  const branchIds =
    branches.map(
      (branch) => branch.id
    )

  const supabase =
    await createClient()

  const today =
    getManilaDateKey()

  const [
    patientResult,
    visitResult,
    catalogResult,
    departmentResult,
    requestResult,
    queueResult,
    clearanceResult,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "id, medical_record_number, first_name, middle_name, last_name, date_of_birth, biological_sex, mobile_number, email_address, branch_id, status, created_at, updated_at"
      )
      .in("branch_id", branchIds)
      .neq("status", "archived")
      .order("last_name")
      .order("first_name")
      .limit(500),

    supabase
      .from("hospital_visits")
      .select(
        "id, visit_number, patient_id, branch_id, arrival_mode, initial_service_type, chief_concern, status, registered_at, checked_in_at, created_at, updated_at"
      )
      .in("branch_id", branchIds)
      .in(
        "status",
        [
          "registered",
          "checked_in",
          "active",
        ]
      )
      .order(
        "registered_at",
        {
          ascending: false,
        }
      )
      .limit(500),

    supabase
      .from(
        "service_catalog_items"
      )
      .select(
        "id, code, name, description, service_type, department_id, branch_id, default_price_centavos, doctor_order_required, allows_patient_request"
      )
      .eq("active", true)
      .order("name")
      .limit(500),

    supabase
      .from("staff_departments")
      .select("id, code, name")
      .eq("active", true)
      .order("name"),

    supabase
      .from("service_requests")
      .select(
        "id, request_number, visit_id, patient_id, branch_id, service_catalog_item_id, service_type, assigned_department_id, priority, status, queued_at, created_at"
      )
      .in("branch_id", branchIds)
      .in(
        "status",
        [
          "requested",
          "queued",
          "in_progress",
        ]
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(500),

    supabase
      .from("queue_entries")
      .select(
        "id, queue_number, service_request_id, status"
      )
      .in("branch_id", branchIds)
      .eq("queue_date", today)
      .in(
        "status",
        [
          "waiting",
          "called",
          "in_service",
        ]
      )
      .order("queue_sequence")
      .limit(500),

    supabase
      .from("payment_clearances")
      .select(
        "service_request_id, clearance_status, required_amount_centavos, cleared_amount_centavos"
      )
      .in("branch_id", branchIds)
      .limit(500),
  ])

  if (
    patientResult.error ||
    visitResult.error ||
    catalogResult.error ||
    departmentResult.error ||
    requestResult.error ||
    queueResult.error ||
    clearanceResult.error
  ) {
    throw new Error(
      "Unable to load the Receptionist patient-intake workspace."
    )
  }

  const rawPatients =
    (patientResult.data ?? []) as
      RawPatient[]

  const rawVisits =
    (visitResult.data ?? []) as
      RawVisit[]

  const rawCatalogItems =
    (catalogResult.data ?? []) as
      RawCatalogItem[]

  const rawDepartments =
    (departmentResult.data ?? []) as
      RawDepartment[]

  const rawRequests =
    (requestResult.data ?? []) as
      RawServiceRequest[]

  const rawQueues =
    (queueResult.data ?? []) as
      RawQueueEntry[]

  const rawClearances =
    (clearanceResult.data ?? []) as
      RawPaymentClearance[]

  const branchById =
    new Map(
      branches.map(
        (branch) => [
          branch.id,
          branch,
        ]
      )
    )

  const departmentById =
    new Map(
      rawDepartments.map(
        (department) => [
          department.id,
          department,
        ]
      )
    )

  const catalogById =
    new Map(
      rawCatalogItems.map(
        (item) => [
          item.id,
          item,
        ]
      )
    )

  const queueByRequestId =
    new Map(
      rawQueues.map((queue) => [
        queue.service_request_id,
        queue,
      ])
    )

  const clearanceByRequestId =
    new Map(
      rawClearances.map(
        (clearance) => [
          clearance.service_request_id,
          clearance,
        ]
      )
    )

  const patients:
    ReceptionPatientRecord[] =
    rawPatients.map((patient) => {
      const branch =
        branchById.get(
          patient.branch_id
        )

      if (!branch) {
        throw new Error(
          "A patient record references an unavailable hospital branch."
        )
      }

      if (
        patient.biological_sex !==
          "male" &&
        patient.biological_sex !==
          "female" &&
        patient.biological_sex !==
          "intersex" &&
        patient.biological_sex !==
          "unknown"
      ) {
        throw new Error(
          "A patient record contains an unsupported biological-sex value."
        )
      }

      if (
        patient.status !==
          "active" &&
        patient.status !==
          "inactive" &&
        patient.status !==
          "archived"
      ) {
        throw new Error(
          "A patient record contains an unsupported status."
        )
      }

      return {
        id: patient.id,
        medicalRecordNumber:
          patient.medical_record_number,
        firstName:
          patient.first_name,
        middleName:
          patient.middle_name,
        lastName:
          patient.last_name,
        dateOfBirth:
          patient.date_of_birth,
        biologicalSex:
          patient.biological_sex,
        mobileNumber:
          patient.mobile_number,
        emailAddress:
          patient.email_address,
        branchId:
          patient.branch_id,
        branchName:
          branch.name,
        status:
          patient.status,
        createdAt:
          patient.created_at,
        updatedAt:
          patient.updated_at,
      }
    })

  const activeVisits:
    ReceptionVisitRecord[] =
    rawVisits.map((visit) => {
      const branch =
        branchById.get(
          visit.branch_id
        )

      if (!branch) {
        throw new Error(
          "A hospital visit references an unavailable branch."
        )
      }

      return {
        id: visit.id,
        visitNumber:
          visit.visit_number,
        patientId:
          visit.patient_id,
        branchId:
          visit.branch_id,
        branchName:
          branch.name,
        arrivalMode:
          requireArrivalMode(
            visit.arrival_mode
          ),
        initialServiceType:
          requireHospitalServiceType(
            visit.initial_service_type
          ),
        chiefConcern:
          visit.chief_concern,
        status:
          requireVisitStatus(
            visit.status
          ),
        registeredAt:
          visit.registered_at,
        checkedInAt:
          visit.checked_in_at,
        createdAt:
          visit.created_at,
        updatedAt:
          visit.updated_at,
      }
    })

  const catalogItems:
    ReceptionServiceCatalogItem[] =
    rawCatalogItems.map((item) => {
      const department =
        departmentById.get(
          item.department_id
        )

      if (!department) {
        throw new Error(
          `Department is missing for service ${item.code}.`
        )
      }

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        description:
          item.description,
        serviceType:
          requireHospitalServiceType(
            item.service_type
          ),
        departmentId:
          item.department_id,
        departmentCode:
          department.code,
        departmentName:
          department.name,
        branchId:
          item.branch_id,
        defaultPriceCentavos:
          item.default_price_centavos,
        doctorOrderRequired:
          item.doctor_order_required,
        allowsPatientRequest:
          item.allows_patient_request,
      }
    })

  const activeRequests:
    ReceptionServiceRequestRecord[] =
    rawRequests.map((request) => {
      const department =
        departmentById.get(
          request.assigned_department_id
        )

      if (!department) {
        throw new Error(
          "A service request references an unavailable department."
        )
      }

      const catalog =
        request.service_catalog_item_id
          ? catalogById.get(
              request.service_catalog_item_id
            ) ?? null
          : null

      const queue =
        queueByRequestId.get(
          request.id
        ) ?? null

      const clearance =
        clearanceByRequestId.get(
          request.id
        ) ?? null

      return {
        id: request.id,
        requestNumber:
          request.request_number,
        visitId:
          request.visit_id,
        patientId:
          request.patient_id,
        branchId:
          request.branch_id,
        serviceCatalogItemId:
          request.service_catalog_item_id,
        serviceName:
          catalog?.name ??
          "Hospital service",
        serviceType:
          requireHospitalServiceType(
            request.service_type
          ),
        departmentId:
          request.assigned_department_id,
        departmentName:
          department.name,
        priority:
          requirePriority(
            request.priority
          ),
        status:
          requireRequestStatus(
            request.status
          ),
        queuedAt:
          request.queued_at,
        createdAt:
          request.created_at,
        queueNumber:
          queue?.queue_number ?? null,
        queueStatus:
          queue
            ? requireQueueStatus(
                queue.status
              )
            : null,
        clearanceStatus:
          clearance?.clearance_status ??
          null,
        requiredAmountCentavos:
          clearance
            ?.required_amount_centavos ??
          0,
        clearedAmountCentavos:
          clearance
            ?.cleared_amount_centavos ??
          0,
      }
    })

  return {
    context,
    data: {
      branches,
      patients,
      activeVisits,
      catalogItems,
      activeRequests,
    } satisfies ReceptionIntakePageData,
  }
}
