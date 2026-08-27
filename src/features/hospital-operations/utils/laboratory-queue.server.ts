import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  LABORATORY_PAYMENT_CLEARANCE_STATUSES,
  LABORATORY_QUEUE_PRIORITIES,
  LABORATORY_QUEUE_STATUSES,
  type LaboratoryPaymentClearanceStatus,
  type LaboratoryQueueEntryRecord,
  type LaboratoryQueuePageData,
  type LaboratoryQueuePriority,
  type LaboratoryQueueStatus,
} from "@/features/hospital-operations/types/laboratory-queue.types"
import {
  getLaboratoryDateKey,
} from "@/features/hospital-operations/utils/laboratory-queue.utils"
import {
  createClient,
} from "@/lib/supabase/server"

interface RawDepartment {
  id: string
  code: string
  name: string
}

interface RawQueueEntry {
  id: string
  queue_number: string
  queue_date: string
  queue_sequence: number
  service_request_id: string
  visit_id: string
  patient_id: string
  branch_id: string
  department_id: string
  assigned_staff_id: string | null
  priority: string
  status: string
  called_at: string | null
  service_started_at: string | null
  service_completed_at: string | null
  no_show_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

interface RawServiceRequest {
  id: string
  request_number: string
  visit_id: string
  patient_id: string
  branch_id: string
  service_catalog_item_id: string | null
  service_type: string
  priority: string
  status: string
  doctor_order_required: boolean
  doctor_order_reference: string | null
  request_notes: string | null
}

interface RawPatient {
  id: string
  medical_record_number: string
  first_name: string
  middle_name: string | null
  last_name: string
  date_of_birth: string
  biological_sex: string
}

interface RawVisit {
  id: string
  visit_number: string
}

interface RawCatalogItem {
  id: string
  code: string
  name: string
  description: string | null
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
    (value) =>
      value === candidate
  )
}

function requireQueueStatus(
  value: string
): LaboratoryQueueStatus {
  if (
    !includesValue(
      LABORATORY_QUEUE_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported laboratory queue status: ${value}`
    )
  }

  return value
}

function requireQueuePriority(
  value: string
): LaboratoryQueuePriority {
  if (
    !includesValue(
      LABORATORY_QUEUE_PRIORITIES,
      value
    )
  ) {
    throw new Error(
      `Unsupported laboratory queue priority: ${value}`
    )
  }

  return value
}

function requireClearanceStatus(
  value: string
): LaboratoryPaymentClearanceStatus {
  if (
    !includesValue(
      LABORATORY_PAYMENT_CLEARANCE_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported payment-clearance status: ${value}`
    )
  }

  return value
}

export async function getLaboratoryQueuePageData() {
  const context =
    await requireStaffRole([
      "LABORATORY_STAFF",
      "LABORATORY_VERIFIER",
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

  if (
    branches.length === 0
  ) {
    return {
      context,
      data: {
        branches: [],
        queueEntries: [],
      } satisfies LaboratoryQueuePageData,
    }
  }

  const supabase =
    await createClient()

  const {
    data: departmentData,
    error: departmentError,
  } = await supabase
    .from("staff_departments")
    .select("id, code, name")
    .eq("code", "LABORATORY")
    .eq("active", true)
    .maybeSingle()

  if (departmentError) {
    throw new Error(
      "Unable to load the Laboratory department configuration."
    )
  }

  if (!departmentData) {
    return {
      context,
      data: {
        branches,
        queueEntries: [],
      } satisfies LaboratoryQueuePageData,
    }
  }

  const laboratoryDepartment =
    departmentData as RawDepartment

  const branchIds =
    branches.map(
      (branch) => branch.id
    )

  const today =
    getLaboratoryDateKey()

  const {
    data: queueData,
    error: queueError,
  } = await supabase
    .from("queue_entries")
    .select(
      "id, queue_number, queue_date, queue_sequence, service_request_id, visit_id, patient_id, branch_id, department_id, assigned_staff_id, priority, status, called_at, service_started_at, service_completed_at, no_show_at, cancelled_at, created_at, updated_at"
    )
    .in("branch_id", branchIds)
    .eq(
      "department_id",
      laboratoryDepartment.id
    )
    .eq("queue_date", today)
    .order("queue_sequence")
    .limit(500)

  if (queueError) {
    throw new Error(
      "Unable to load the Laboratory queue."
    )
  }

  const rawQueues =
    (queueData ?? []) as
      RawQueueEntry[]

  if (
    rawQueues.length === 0
  ) {
    return {
      context,
      data: {
        branches,
        queueEntries: [],
      } satisfies LaboratoryQueuePageData,
    }
  }

  const requestIds =
    rawQueues.map(
      (queue) =>
        queue.service_request_id
    )

  const patientIds =
    Array.from(
      new Set(
        rawQueues.map(
          (queue) =>
            queue.patient_id
        )
      )
    )

  const visitIds =
    Array.from(
      new Set(
        rawQueues.map(
          (queue) =>
            queue.visit_id
        )
      )
    )

  const [
    requestResult,
    patientResult,
    visitResult,
    clearanceResult,
  ] = await Promise.all([
    supabase
      .from("service_requests")
      .select(
        "id, request_number, visit_id, patient_id, branch_id, service_catalog_item_id, service_type, priority, status, doctor_order_required, doctor_order_reference, request_notes"
      )
      .in("id", requestIds)
      .eq("service_type", "laboratory"),

    supabase
      .from("patients")
      .select(
        "id, medical_record_number, first_name, middle_name, last_name, date_of_birth, biological_sex"
      )
      .in("id", patientIds),

    supabase
      .from("hospital_visits")
      .select("id, visit_number")
      .in("id", visitIds),

    supabase
      .from("payment_clearances")
      .select(
        "service_request_id, clearance_status, required_amount_centavos, cleared_amount_centavos"
      )
      .in(
        "service_request_id",
        requestIds
      ),
  ])

  if (
    requestResult.error ||
    patientResult.error ||
    visitResult.error ||
    clearanceResult.error
  ) {
    throw new Error(
      "Unable to load the complete Laboratory queue context."
    )
  }

  const rawRequests =
    (requestResult.data ?? []) as
      RawServiceRequest[]

  const catalogItemIds =
    Array.from(
      new Set(
        rawRequests
          .map(
            (request) =>
              request.service_catalog_item_id
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
      )
    )

  const catalogResult =
    catalogItemIds.length > 0
      ? await supabase
          .from(
            "service_catalog_items"
          )
          .select(
            "id, code, name, description"
          )
          .in("id", catalogItemIds)
      : {
          data: [] as RawCatalogItem[],
          error: null,
        }

  if (catalogResult.error) {
    throw new Error(
      "Unable to load the requested Laboratory services."
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

  const requestById =
    new Map(
      rawRequests.map(
        (request) => [
          request.id,
          request,
        ]
      )
    )

  const patientById =
    new Map(
      rawPatients.map(
        (patient) => [
          patient.id,
          patient,
        ]
      )
    )

  const visitById =
    new Map(
      rawVisits.map(
        (visit) => [
          visit.id,
          visit,
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

  const clearanceByRequestId =
    new Map(
      rawClearances.map(
        (clearance) => [
          clearance.service_request_id,
          clearance,
        ]
      )
    )

  const queueEntries:
    LaboratoryQueueEntryRecord[] =
    rawQueues.map((queue) => {
      const branch =
        branchById.get(
          queue.branch_id
        )

      const request =
        requestById.get(
          queue.service_request_id
        )

      const patient =
        patientById.get(
          queue.patient_id
        )

      const visit =
        visitById.get(
          queue.visit_id
        )

      if (
        !branch ||
        !request ||
        !patient ||
        !visit
      ) {
        throw new Error(
          "A Laboratory queue record references incomplete hospital data."
        )
      }

      const catalogItem =
        request.service_catalog_item_id
          ? catalogById.get(
              request.service_catalog_item_id
            ) ?? null
          : null

      const clearance =
        clearanceByRequestId.get(
          request.id
        ) ?? null

      return {
        id: queue.id,
        queueNumber:
          queue.queue_number,
        queueDate:
          queue.queue_date,
        queueSequence:
          queue.queue_sequence,
        status:
          requireQueueStatus(
            queue.status
          ),
        priority:
          requireQueuePriority(
            queue.priority
          ),
        calledAt:
          queue.called_at,
        serviceStartedAt:
          queue.service_started_at,
        serviceCompletedAt:
          queue.service_completed_at,
        noShowAt:
          queue.no_show_at,
        cancelledAt:
          queue.cancelled_at,
        createdAt:
          queue.created_at,
        updatedAt:
          queue.updated_at,

        branchId:
          queue.branch_id,
        branchName:
          branch.name,
        departmentId:
          queue.department_id,
        assignedStaffId:
          queue.assigned_staff_id,

        serviceRequestId:
          request.id,
        requestNumber:
          request.request_number,
        requestStatus:
          request.status,
        requestNotes:
          request.request_notes,
        doctorOrderRequired:
          request.doctor_order_required,
        doctorOrderReference:
          request.doctor_order_reference,

        visitId:
          visit.id,
        visitNumber:
          visit.visit_number,

        patient: {
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
        },

        serviceCatalogItemId:
          request.service_catalog_item_id,
        serviceCode:
          catalogItem?.code ??
          null,
        serviceName:
          catalogItem?.name ??
          "Laboratory service",
        serviceDescription:
          catalogItem?.description ??
          null,

        paymentClearanceStatus:
          clearance
            ? requireClearanceStatus(
                clearance.clearance_status
              )
            : null,
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
      queueEntries,
    } satisfies LaboratoryQueuePageData,
  }
}
