import "server-only"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  RECEPTION_DOCUMENT_STATUSES,
  RECEPTION_DOCUMENT_TYPES,
  RECEPTION_PAYMENT_STATUSES,
  RECEPTION_PRINT_PURPOSES,
  RECEPTION_RELEASE_METHODS,
  RECEPTION_RELEASE_STATUSES,
  type ReceptionDocumentStatus,
  type ReceptionDocumentType,
  type ReceptionPaymentStatus,
  type ReceptionPrintPurpose,
  type ReceptionReleaseCenterPageData,
  type ReceptionReleaseItem,
  type ReceptionReleaseMethod,
  type ReceptionReleaseStatus,
} from "@/features/hospital-operations/types/reception-release.types"
import {
  parseLaboratoryResultMetadata,
} from "@/features/hospital-operations/utils/laboratory-result.utils"
import {
  canPrintReceptionDocument,
} from "@/features/hospital-operations/utils/reception-release.utils"
import {
  createClient,
} from "@/lib/supabase/server"

interface RawClinicalDocument {
  id: string
  document_number: string
  patient_id: string
  visit_id: string
  service_request_id: string | null
  branch_id: string
  document_type: string
  title: string
  source_module: string
  version_number: number
  status: string
  sensitivity: string
  payment_required: boolean
  finalized_at: string | null
  created_at: string
  updated_at: string
  metadata: unknown
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

interface RawServiceRequest {
  id: string
  request_number: string
  service_type: string
  service_catalog_item_id: string | null
}

interface RawCatalogItem {
  id: string
  name: string
}

interface RawPaymentClearance {
  id: string
  service_request_id: string
  clearance_status: string
  required_amount_centavos: number
  cleared_amount_centavos: number
  cleared_at: string | null
  clearance_reason: string | null
}

interface RawReleaseClearance {
  id: string
  document_id: string
  release_status: string
  clinical_ready_at: string | null
  ready_at: string | null
  released_at: string | null
  blocked_reason: string | null
}

interface RawReleaseRecord {
  id: string
  release_number: string
  document_id: string
  release_method: string
  recipient_name: string
  recipient_relationship: string | null
  recipient_identifier_masked: string | null
  copy_number: number
  released_at: string
  notes: string | null
}

interface RawPrintLog {
  id: number
  document_id: string
  release_record_id: string | null
  print_purpose: string
  copy_number: number
  printed_at: string
  print_reason: string | null
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

function readDocumentType(
  value: string
): ReceptionDocumentType {
  if (
    !includesValue(
      RECEPTION_DOCUMENT_TYPES,
      value
    )
  ) {
    return "other"
  }

  return value
}

function readDocumentStatus(
  value: string
): ReceptionDocumentStatus {
  if (
    !includesValue(
      RECEPTION_DOCUMENT_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported releasable document status: ${value}`
    )
  }

  return value
}

function readReleaseStatus(
  value: string
): ReceptionReleaseStatus {
  if (
    !includesValue(
      RECEPTION_RELEASE_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported document release status: ${value}`
    )
  }

  return value
}

function readPaymentStatus(
  value: string
): ReceptionPaymentStatus {
  if (
    !includesValue(
      RECEPTION_PAYMENT_STATUSES,
      value
    )
  ) {
    throw new Error(
      `Unsupported payment-clearance status: ${value}`
    )
  }

  return value
}

function readReleaseMethod(
  value: string
): ReceptionReleaseMethod {
  if (
    !includesValue(
      RECEPTION_RELEASE_METHODS,
      value
    )
  ) {
    return "other"
  }

  return value
}

function readPrintPurpose(
  value: string
): ReceptionPrintPurpose {
  if (
    !includesValue(
      RECEPTION_PRINT_PURPOSES,
      value
    )
  ) {
    return "admin_copy"
  }

  return value
}

function toSafeNumber(
  value: number
): number {
  const candidate = Number(value)

  return Number.isFinite(candidate)
    ? candidate
    : 0
}

async function loadReceptionReleaseItems(
  documentId?: string
): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  data: ReceptionReleaseCenterPageData
}> {
  const context =
    await requireStaffRole([
      "RECEPTIONIST",
      "SYSTEM_ADMIN",
    ])

  const isSystemAdmin =
    context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )

  if (
    !isSystemAdmin &&
    !context.permissions.includes(
      "reception.release.view"
    )
  ) {
    throw new Error(
      "The current staff account cannot view the Reception release center."
    )
  }

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
        items: [],
      },
    }
  }

  const supabase =
    await createClient()

  let documentQuery =
    supabase
      .from("clinical_documents")
      .select(
        "id, document_number, patient_id, visit_id, service_request_id, branch_id, document_type, title, source_module, version_number, status, sensitivity, payment_required, finalized_at, created_at, updated_at, metadata"
      )
      .in("branch_id", branchIds)
      .in(
        "status",
        [
          "finalized",
          "corrected",
        ]
      )
      .order("updated_at", {
        ascending: false,
      })
      .limit(500)

  if (documentId) {
    documentQuery =
      documentQuery.eq(
        "id",
        documentId
      )
  }

  const {
    data: documentData,
    error: documentError,
  } = await documentQuery

  if (documentError) {
    throw new Error(
      "Unable to load finalized clinical documents for Reception."
    )
  }

  const documents =
    (documentData ?? []) as
      RawClinicalDocument[]

  if (
    documents.length === 0
  ) {
    return {
      context,
      data: {
        items: [],
      },
    }
  }

  const documentIds =
    documents.map(
      (document) =>
        document.id
    )

  const patientIds =
    Array.from(
      new Set(
        documents.map(
          (document) =>
            document.patient_id
        )
      )
    )

  const visitIds =
    Array.from(
      new Set(
        documents.map(
          (document) =>
            document.visit_id
        )
      )
    )

  const requestIds =
    Array.from(
      new Set(
        documents
          .map(
            (document) =>
              document.service_request_id
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
    releaseClearanceResult,
    releaseRecordResult,
    printLogResult,
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

    supabase
      .from(
        "document_release_clearances"
      )
      .select(
        "id, document_id, release_status, clinical_ready_at, ready_at, released_at, blocked_reason"
      )
      .in("document_id", documentIds),

    supabase
      .from("document_release_records")
      .select(
        "id, release_number, document_id, release_method, recipient_name, recipient_relationship, recipient_identifier_masked, copy_number, released_at, notes"
      )
      .in("document_id", documentIds)
      .order("released_at", {
        ascending: false,
      }),

    supabase
      .from("document_print_logs")
      .select(
        "id, document_id, release_record_id, print_purpose, copy_number, printed_at, print_reason"
      )
      .in("document_id", documentIds)
      .order("printed_at", {
        ascending: false,
      }),
  ])

  if (
    patientResult.error ||
    visitResult.error ||
    releaseClearanceResult.error ||
    releaseRecordResult.error ||
    printLogResult.error
  ) {
    throw new Error(
      "Unable to load Reception release-center supporting records."
    )
  }

  const patients =
    (patientResult.data ?? []) as
      RawPatient[]

  const visits =
    (visitResult.data ?? []) as
      RawVisit[]

  const releaseClearances =
    (releaseClearanceResult.data ?? []) as
      RawReleaseClearance[]

  const releaseRecords =
    (releaseRecordResult.data ?? []) as
      RawReleaseRecord[]

  const printLogs =
    (printLogResult.data ?? []) as
      RawPrintLog[]

  let serviceRequests:
    RawServiceRequest[] = []

  let paymentClearances:
    RawPaymentClearance[] = []

  if (
    requestIds.length > 0
  ) {
    const [
      requestResult,
      paymentResult,
    ] = await Promise.all([
      supabase
        .from("service_requests")
        .select(
          "id, request_number, service_type, service_catalog_item_id"
        )
        .in("id", requestIds),

      supabase
        .from("payment_clearances")
        .select(
          "id, service_request_id, clearance_status, required_amount_centavos, cleared_amount_centavos, cleared_at, clearance_reason"
        )
        .in(
          "service_request_id",
          requestIds
        ),
    ])

    if (
      requestResult.error ||
      paymentResult.error
    ) {
      throw new Error(
        "Unable to load service and payment-clearance details."
      )
    }

    serviceRequests =
      (requestResult.data ?? []) as
        RawServiceRequest[]

    paymentClearances =
      (paymentResult.data ?? []) as
        RawPaymentClearance[]
  }

  const catalogIds =
    Array.from(
      new Set(
        serviceRequests
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

  let catalogItems:
    RawCatalogItem[] = []

  if (
    catalogIds.length > 0
  ) {
    const {
      data: catalogData,
      error: catalogError,
    } = await supabase
      .from("service_catalog_items")
      .select("id, name")
      .in("id", catalogIds)

    if (catalogError) {
      throw new Error(
        "Unable to load service names for the release center."
      )
    }

    catalogItems =
      (catalogData ?? []) as
        RawCatalogItem[]
  }

  const patientById =
    new Map(
      patients.map(
        (patient) => [
          patient.id,
          patient,
        ]
      )
    )

  const visitById =
    new Map(
      visits.map(
        (visit) => [
          visit.id,
          visit,
        ]
      )
    )

  const requestById =
    new Map(
      serviceRequests.map(
        (request) => [
          request.id,
          request,
        ]
      )
    )

  const catalogById =
    new Map(
      catalogItems.map(
        (catalogItem) => [
          catalogItem.id,
          catalogItem,
        ]
      )
    )

  const paymentByRequestId =
    new Map(
      paymentClearances.map(
        (clearance) => [
          clearance.service_request_id,
          clearance,
        ]
      )
    )

  const releaseByDocumentId =
    new Map(
      releaseClearances.map(
        (clearance) => [
          clearance.document_id,
          clearance,
        ]
      )
    )

  const releaseRecordsByDocumentId =
    new Map<string, RawReleaseRecord[]>()

  releaseRecords.forEach(
    (record) => {
      const currentRecords =
        releaseRecordsByDocumentId.get(
          record.document_id
        ) ?? []

      currentRecords.push(record)

      releaseRecordsByDocumentId.set(
        record.document_id,
        currentRecords
      )
    }
  )

  const printLogsByDocumentId =
    new Map<string, RawPrintLog[]>()

  printLogs.forEach(
    (record) => {
      const currentRecords =
        printLogsByDocumentId.get(
          record.document_id
        ) ?? []

      currentRecords.push(record)

      printLogsByDocumentId.set(
        record.document_id,
        currentRecords
      )
    }
  )

  const branchById =
    new Map(
      context.branches.map(
        (branch) => [
          branch.id,
          branch,
        ]
      )
    )

  const items:
    ReceptionReleaseItem[] = []

  documents.forEach(
    (document) => {
      const patient =
        patientById.get(
          document.patient_id
        )

      const visit =
        visitById.get(
          document.visit_id
        )

      const branch =
        branchById.get(
          document.branch_id
        )

      if (
        !patient ||
        !visit ||
        !branch
      ) {
        return
      }

      const request =
        document.service_request_id
          ? requestById.get(
              document.service_request_id
            ) ?? null
          : null

      const catalogItem =
        request
          ?.service_catalog_item_id
          ? catalogById.get(
              request.service_catalog_item_id
            ) ?? null
          : null

      const payment =
        document.service_request_id
          ? paymentByRequestId.get(
              document.service_request_id
            ) ?? null
          : null

      const releaseClearance =
        releaseByDocumentId.get(
          document.id
        ) ?? null

      const releaseStatus =
        releaseClearance
          ? readReleaseStatus(
              releaseClearance.release_status
            )
          : "not_ready"

      const documentType =
        readDocumentType(
          document.document_type
        )

      items.push({
        documentId:
          document.id,
        documentNumber:
          document.document_number,
        documentType,
        title:
          document.title,
        sourceModule:
          document.source_module,
        versionNumber:
          document.version_number,
        documentStatus:
          readDocumentStatus(
            document.status
          ),
        sensitivity:
          document.sensitivity,
        paymentRequired:
          document.payment_required,
        finalizedAt:
          document.finalized_at,
        createdAt:
          document.created_at,
        updatedAt:
          document.updated_at,

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

        visitId:
          document.visit_id,
        visitNumber:
          visit.visit_number,
        branchId:
          document.branch_id,
        branchName:
          branch.name,

        serviceRequestId:
          document.service_request_id,
        requestNumber:
          request?.request_number ??
          null,
        serviceType:
          request?.service_type ??
          null,
        serviceName:
          catalogItem?.name ??
          null,

        paymentClearanceId:
          payment?.id ?? null,
        paymentStatus:
          payment
            ? readPaymentStatus(
                payment.clearance_status
              )
            : null,
        requiredAmountCentavos:
          toSafeNumber(
            payment
              ?.required_amount_centavos ??
            0
          ),
        clearedAmountCentavos:
          toSafeNumber(
            payment
              ?.cleared_amount_centavos ??
            0
          ),
        paymentClearedAt:
          payment?.cleared_at ??
          null,
        paymentReason:
          payment
            ?.clearance_reason ??
          null,

        releaseClearanceId:
          releaseClearance?.id ??
          null,
        releaseStatus,
        clinicalReadyAt:
          releaseClearance
            ?.clinical_ready_at ??
          null,
        readyAt:
          releaseClearance
            ?.ready_at ?? null,
        releasedAt:
          releaseClearance
            ?.released_at ??
          null,
        blockedReason:
          releaseClearance
            ?.blocked_reason ??
          null,

        laboratoryResult:
          documentType ===
          "laboratory_result"
            ? parseLaboratoryResultMetadata(
                document.metadata
              )
            : null,
        rawMetadata:
          document.metadata,

        releaseRecords:
          (
            releaseRecordsByDocumentId.get(
              document.id
            ) ?? []
          ).map(
            (record) => ({
              id: record.id,
              releaseNumber:
                record.release_number,
              releaseMethod:
                readReleaseMethod(
                  record.release_method
                ),
              recipientName:
                record.recipient_name,
              recipientRelationship:
                record.recipient_relationship,
              recipientIdentifierMasked:
                record.recipient_identifier_masked,
              copyNumber:
                record.copy_number,
              releasedAt:
                record.released_at,
              notes:
                record.notes,
            })
          ),

        printLogs:
          (
            printLogsByDocumentId.get(
              document.id
            ) ?? []
          ).map(
            (record) => ({
              id: record.id,
              releaseRecordId:
                record.release_record_id,
              printPurpose:
                readPrintPurpose(
                  record.print_purpose
                ),
              copyNumber:
                record.copy_number,
              printedAt:
                record.printed_at,
              printReason:
                record.print_reason,
            })
          ),
      })
    }
  )

  return {
    context,
    data: {
      items,
    },
  }
}

export async function getReceptionReleaseCenterPageData() {
  return loadReceptionReleaseItems()
}

export async function getReceptionReleasePrintPageData(
  documentId: string
) {
  const result =
    await loadReceptionReleaseItems(
      documentId
    )

  const item =
    result.data.items[0] ??
    null

  if (!item) {
    throw new Error(
      "The requested clinical document was not found or is not finalized."
    )
  }

  if (
    !canPrintReceptionDocument(
      item
    )
  ) {
    throw new Error(
      "This clinical document is still locked and cannot be printed for the patient."
    )
  }

  return {
    context:
      result.context,
    data: item,
  }
}
