import "server-only"

import {
  patientPortalBillingDataSchema,
  patientPortalReleasedDocumentSchema,
  patientPortalReleasedDocumentsDataSchema,
} from "@/features/patient-portal/schemas/patient-portal-records.schema"
import type {
  PatientPortalDashboardData,
  PatientPortalDocumentType,
} from "@/features/patient-portal/types/patient-portal-records.types"
import {
  requirePatientPortal,
} from "@/features/patient-portal/utils/patient-auth.server"
import {
  createClient,
} from "@/lib/supabase/server"

export async function getPatientPortalDashboardPageData() {
  const context =
    await requirePatientPortal()

  const supabase =
    await createClient()

  const [
    documentsResult,
    billingResult,
  ] = await Promise.all([
    supabase.rpc(
      "get_patient_portal_released_documents",
      {
        p_document_type:
          null,
      }
    ),

    supabase.rpc(
      "get_patient_portal_billing_data"
    ),
  ])

  if (
    documentsResult.error ||
    billingResult.error
  ) {
    throw new Error(
      "Unable to load the Patient Portal dashboard."
    )
  }

  const parsedDocuments =
    patientPortalReleasedDocumentsDataSchema.safeParse(
      documentsResult.data
    )

  const parsedBilling =
    patientPortalBillingDataSchema.safeParse(
      billingResult.data
    )

  if (
    !parsedDocuments.success ||
    !parsedBilling.success
  ) {
    throw new Error(
      "The Patient Portal dashboard response is invalid."
    )
  }

  const documents =
    parsedDocuments.data.documents

  const billing =
    parsedBilling.data

  const data:
    PatientPortalDashboardData = {
      releasedPrescriptionsCount:
        documents.filter(
          (document) =>
            document.documentType ===
            "prescription"
        ).length,

      releasedLaboratoryResultsCount:
        documents.filter(
          (document) =>
            document.documentType ===
            "laboratory_result"
        ).length,

      outstandingBalanceCentavos:
        billing.totalOutstandingCentavos,

      openBillingAccountsCount:
        billing.accounts.filter(
          (account) =>
            (
              account.status ===
                "open" ||
              account.status ===
                "partially_paid"
            ) &&
            account.balanceAmountCentavos >
              0
        ).length,

      recentDocuments:
        documents.slice(
          0,
          5
        ),
    }

  return {
    context,
    data,
  }
}

export async function getPatientPortalReleasedDocumentsPageData(
  documentType:
    PatientPortalDocumentType
) {
  const context =
    await requirePatientPortal()

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_patient_portal_released_documents",
    {
      p_document_type:
        documentType,
    }
  )

  if (error) {
    throw new Error(
      "Unable to load released Patient Portal documents."
    )
  }

  const parsedData =
    patientPortalReleasedDocumentsDataSchema.safeParse(
      data
    )

  if (!parsedData.success) {
    throw new Error(
      "The released-document response is invalid."
    )
  }

  return {
    context,
    data:
      parsedData.data,
  }
}

export async function getPatientPortalBillingPageData() {
  const context =
    await requirePatientPortal()

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_patient_portal_billing_data"
  )

  if (error) {
    throw new Error(
      "Unable to load Patient Portal billing data."
    )
  }

  const parsedData =
    patientPortalBillingDataSchema.safeParse(
      data
    )

  if (!parsedData.success) {
    throw new Error(
      "The Patient Portal billing response is invalid."
    )
  }

  return {
    context,
    data:
      parsedData.data,
  }
}

export async function getPatientPortalReleasedDocumentPageData(
  documentId: string
) {
  const context =
    await requirePatientPortal()

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "open_patient_portal_released_document",
    {
      p_document_id:
        documentId,
    }
  )

  if (error) {
    throw new Error(
      "The released document is not available to this Patient Portal account."
    )
  }

  const parsedDocument =
    patientPortalReleasedDocumentSchema.safeParse(
      data
    )

  if (
    !parsedDocument.success
  ) {
    throw new Error(
      "The released document response is invalid."
    )
  }

  return {
    context,
    document:
      parsedDocument.data,
  }
}
