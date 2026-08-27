import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  LABORATORY_DOCUMENT_STATUSES,
  LABORATORY_PAYMENT_STATUSES,
  LABORATORY_RELEASE_STATUSES,
  type LaboratoryDocumentStatus,
  type LaboratoryPaymentStatus,
  type LaboratoryReleaseStatus,
  type LaboratoryResultWorkItem,
  type LaboratoryResultsPageData,
} from "@/features/hospital-operations/types/laboratory-result.types"
import {
  parseLaboratoryResultMetadata,
} from "@/features/hospital-operations/utils/laboratory-result.utils"
import {
  createClient,
} from "@/lib/supabase/server"

interface RawServiceRequest {
  id: string
  request_number: string
  visit_id: string
  patient_id: string
  branch_id: string
  service_catalog_item_id: string | null
  priority: string
  status: string
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
}

interface RawQueueEntry {
  service_request_id: string
  queue_number: string
  status: string
}

interface RawPaymentClearance {
  service_request_id: string
  clearance_status: string
  required_amount_centavos: number
  cleared_amount_centavos: number
}

interface RawClinicalDocument {
  id: string
  document_number: string
  service_request_id: string | null
  title: string
  version_number: number
  status: string
  created_by: string
  finalized_by: string | null
  finalized_at: string | null
  updated_at: string
  metadata: unknown
}

interface RawReleaseClearance {
  document_id: string
  release_status: string
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

function readDocumentStatus(
  value: string
): LaboratoryDocumentStatus {
  if (
    !includesValue(
      LABORATORY_DOCUMENT_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported Laboratory document status: ${value}`
    )
  }

  return value
}

function readPaymentStatus(
  value: string
): LaboratoryPaymentStatus {
  if (
    !includesValue(
      LABORATORY_PAYMENT_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported Laboratory payment status: ${value}`
    )
  }

  return value
}

function readReleaseStatus(
  value: string
): LaboratoryReleaseStatus {
  if (
    !includesValue(
      LABORATORY_RELEASE_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported Laboratory release status: ${value}`
    )
  }

  return value
}

export async function getLaboratoryResultsPageData() {
  const context =
    await requireStaffRole([
      "LABORATORY_STAFF",
      "LABORATORY_VERIFIER",
      "SYSTEM_ADMIN",
    ])

  const branchIds =
    context.branches.map(
      (branch) => branch.id
    )

  if (
    branchIds.length === 0
  ) {
    return {
      context,
      data: {
        workItems: [],
      } satisfies LaboratoryResultsPageData,
    }
  }

  const supabase =
    await createClient()

  const {
    data: requestData,
    error: requestError,
  } = await supabase
    .from("service_requests")
    .select(
      "id, request_number, visit_id, patient_id, branch_id, service_catalog_item_id, priority, status, request_notes"
    )
    .in("branch_id", branchIds)
    .eq("service_type", "laboratory")
    .in(
      "status",
      [
        "in_progress",
        "completed",
      ]
    )
    .order("updated_at", {
      ascending: false,
    })
    .limit(500)

  if (requestError) {
    throw new Error(
      "Unable to load Laboratory result work items."
    )
  }

  const requests =
    (requestData ?? []) as
      RawServiceRequest[]

  if (
    requests.length === 0
  ) {
    return {
      context,
      data: {
        workItems: [],
      } satisfies LaboratoryResultsPageData,
    }
  }

  const requestIds =
    requests.map(
      (request) => request.id
    )

  const patientIds =
    Array.from(
      new Set(
        requests.map(
          (request) =>
            request.patient_id
        )
      )
    )

  const visitIds =
    Array.from(
      new Set(
        requests.map(
          (request) =>
            request.visit_id
        )
      )
    )

  const catalogIds =
    Array.from(
      new Set(
        requests
          .map(
            (request) =>
              request.service_catalog_item_id
          )
          .filter(
            (
              value
            ): value is string =>
              value !== null
          )
      )
    )

  const [
    patientResult,
    visitResult,
    catalogResult,
    queueResult,
    paymentResult,
    documentResult,
  ] = await Promise.all([
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

    catalogIds.length > 0
      ? supabase
          .from("service_catalog_items")
          .select("id, code, name")
          .in("id", catalogIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    supabase
      .from("queue_entries")
      .select(
        "service_request_id, queue_number, status"
      )
      .in(
        "service_request_id",
        requestIds
      ),

    supabase
      .from("payment_clearances")
      .select(
        "service_request_id, clearance_status, required_amount_centavos, cleared_amount_centavos"
      )
      .in(
        "service_request_id",
        requestIds
      ),

    supabase
      .from("clinical_documents")
      .select(
        "id, document_number, service_request_id, title, version_number, status, created_by, finalized_by, finalized_at, updated_at, metadata"
      )
      .in(
        "service_request_id",
        requestIds
      )
      .eq(
        "document_type",
        "laboratory_result"
      )
      .not(
        "status",
        "in",
        "(superseded,voided)"
      )
      .order(
        "version_number",
        {
          ascending: false,
        }
      ),
  ])

  if (
    patientResult.error ||
    visitResult.error ||
    catalogResult.error ||
    queueResult.error ||
    paymentResult.error ||
    documentResult.error
  ) {
    throw new Error(
      "Unable to load the complete Laboratory result context."
    )
  }

  const patients =
    (patientResult.data ?? []) as
      RawPatient[]

  const visits =
    (visitResult.data ?? []) as
      RawVisit[]

  const catalogItems =
    (catalogResult.data ?? []) as
      RawCatalogItem[]

  const queueEntries =
    (queueResult.data ?? []) as
      RawQueueEntry[]

  const paymentClearances =
    (paymentResult.data ?? []) as
      RawPaymentClearance[]

  const documents =
    (documentResult.data ?? []) as
      RawClinicalDocument[]

  const documentIds =
    documents.map(
      (document) => document.id
    )

  const releaseResult =
    documentIds.length > 0
      ? await supabase
          .from(
            "document_release_clearances"
          )
          .select(
            "document_id, release_status"
          )
          .in(
            "document_id",
            documentIds
          )
      : {
          data: [],
          error: null,
        }

  if (releaseResult.error) {
    throw new Error(
      "Unable to load Laboratory result release states."
    )
  }

  const releaseClearances =
    (releaseResult.data ?? []) as
      RawReleaseClearance[]

  const patientMap =
    new Map(
      patients.map(
        (patient) => [
          patient.id,
          patient,
        ]
      )
    )

  const visitMap =
    new Map(
      visits.map(
        (visit) => [
          visit.id,
          visit,
        ]
      )
    )

  const catalogMap =
    new Map(
      catalogItems.map(
        (item) => [
          item.id,
          item,
        ]
      )
    )

  const queueMap =
    new Map(
      queueEntries.map(
        (entry) => [
          entry.service_request_id,
          entry,
        ]
      )
    )

  const paymentMap =
    new Map(
      paymentClearances.map(
        (clearance) => [
          clearance.service_request_id,
          clearance,
        ]
      )
    )

  const documentMap =
    new Map<
      string,
      RawClinicalDocument
    >()

  documents.forEach(
    (document) => {
      if (
        document.service_request_id &&
        !documentMap.has(
          document.service_request_id
        )
      ) {
        documentMap.set(
          document.service_request_id,
          document
        )
      }
    }
  )

  const releaseMap =
    new Map(
      releaseClearances.map(
        (clearance) => [
          clearance.document_id,
          clearance,
        ]
      )
    )

  const branchMap =
    new Map(
      context.branches.map(
        (branch) => [
          branch.id,
          branch.name,
        ]
      )
    )

  const workItems =
    requests.map(
      (
        request
      ): LaboratoryResultWorkItem => {
        const patient =
          patientMap.get(
            request.patient_id
          )

        const visit =
          visitMap.get(
            request.visit_id
          )

        if (
          !patient ||
          !visit
        ) {
          throw new Error(
            "A Laboratory result work item has incomplete patient or visit context."
          )
        }

        const catalogItem =
          request.service_catalog_item_id
            ? catalogMap.get(
                request.service_catalog_item_id
              ) ?? null
            : null

        const queueEntry =
          queueMap.get(
            request.id
          ) ?? null

        const payment =
          paymentMap.get(
            request.id
          ) ?? null

        const document =
          documentMap.get(
            request.id
          ) ?? null

        const release =
          document
            ? releaseMap.get(
                document.id
              ) ?? null
            : null

        return {
          serviceRequestId:
            request.id,
          requestNumber:
            request.request_number,
          requestStatus:
            request.status,
          requestNotes:
            request.request_notes,
          priority:
            request.priority,
          branchId:
            request.branch_id,
          branchName:
            branchMap.get(
              request.branch_id
            ) ?? request.branch_id,
          visitId:
            request.visit_id,
          visitNumber:
            visit.visit_number,
          queueNumber:
            queueEntry?.queue_number ??
            null,
          queueStatus:
            queueEntry?.status ??
            null,
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
          serviceCode:
            catalogItem?.code ??
            null,
          serviceName:
            catalogItem?.name ??
            "Laboratory service",
          paymentStatus:
            payment
              ? readPaymentStatus(
                  payment.clearance_status
                )
              : null,
          requiredAmountCentavos:
            payment
              ?.required_amount_centavos ??
            0,
          clearedAmountCentavos:
            payment
              ?.cleared_amount_centavos ??
            0,
          documentId:
            document?.id ?? null,
          documentNumber:
            document
              ?.document_number ??
            null,
          documentStatus:
            document
              ? readDocumentStatus(
                  document.status
                )
              : null,
          documentTitle:
            document?.title ?? null,
          documentVersion:
            document
              ?.version_number ??
            null,
          createdBy:
            document
              ?.created_by ??
            null,
          finalizedBy:
            document
              ?.finalized_by ??
            null,
          finalizedAt:
            document
              ?.finalized_at ??
            null,
          documentUpdatedAt:
            document
              ?.updated_at ??
            null,
          metadata:
            document
              ? parseLaboratoryResultMetadata(
                  document.metadata
                )
              : null,
          releaseStatus:
            release
              ? readReleaseStatus(
                  release.release_status
                )
              : null,
        }
      }
    )

  return {
    context,
    data: {
      workItems,
    } satisfies LaboratoryResultsPageData,
  }
}
