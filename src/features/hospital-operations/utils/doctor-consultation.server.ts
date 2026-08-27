import "server-only"

import { z } from "zod"

import {
  requireStaffRole,
} from "@/features/auth/utils/staff-auth.server"
import {
  DOCTOR_CONSULTATION_STATUSES,
  DOCTOR_PRIORITIES,
  DOCTOR_QUEUE_STATUSES,
  DOCTOR_REQUEST_STATUSES,
  type DoctorConsultationWorkspaceData,
  type DoctorQueueRecord,
  type ReceptionDoctorAssignmentPageData,
} from "@/features/hospital-operations/types/doctor-consultation.types"
import {
  createClient,
} from "@/lib/supabase/server"

const nullableString =
  z.string().nullable()

const doctorBranchRawSchema =
  z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    is_primary:
      z.boolean(),
  })

const doctorOptionRawSchema =
  z.object({
    id: z.string().uuid(),
    employee_id:
      nullableString,
    full_name:
      z.string(),
    job_title:
      nullableString,
    branches:
      z.array(
        doctorBranchRawSchema
      ),
  })

const assignmentRequestRawSchema =
  z.object({
    service_request_id:
      z.string().uuid(),
    request_number:
      z.string(),
    patient_id:
      z.string().uuid(),
    patient_name:
      z.string(),
    medical_record_number:
      z.string(),
    visit_number:
      z.string(),
    branch_id:
      z.string(),
    branch_name:
      z.string(),
    priority:
      z.enum(
        DOCTOR_PRIORITIES
      ),
    request_status:
      z.enum(
        DOCTOR_REQUEST_STATUSES
      ),
    queue_number:
      nullableString,
    queue_status:
      z
        .enum(
          DOCTOR_QUEUE_STATUSES
        )
        .nullable(),
    assigned_doctor_id:
      z.string().uuid().nullable(),
    assigned_doctor_name:
      nullableString,
    requested_at:
      z.string(),
  })

const assignmentDataRawSchema =
  z.object({
    doctors:
      z.array(
        doctorOptionRawSchema
      ),
    requests:
      z.array(
        assignmentRequestRawSchema
      ),
  })

const doctorQueueRawSchema =
  z.object({
    service_request_id:
      z.string().uuid(),
    request_number:
      z.string(),
    patient_id:
      z.string().uuid(),
    patient_name:
      z.string(),
    medical_record_number:
      z.string(),
    date_of_birth:
      z.string(),
    biological_sex:
      z.string(),
    visit_number:
      z.string(),
    chief_concern:
      nullableString,
    branch_id:
      z.string(),
    branch_name:
      z.string(),
    priority:
      z.enum(
        DOCTOR_PRIORITIES
      ),
    request_status:
      z.enum(
        DOCTOR_REQUEST_STATUSES
      ),
    queue_id:
      z.string().uuid().nullable(),
    queue_number:
      nullableString,
    queue_status:
      z
        .enum(
          DOCTOR_QUEUE_STATUSES
        )
        .nullable(),
    called_at:
      nullableString,
    service_started_at:
      nullableString,
    consultation_id:
      z.string().uuid().nullable(),
    consultation_number:
      nullableString,
    consultation_status:
      z
        .enum(
          DOCTOR_CONSULTATION_STATUSES
        )
        .nullable(),
    started_at:
      nullableString,
    completed_at:
      nullableString,
    requested_at:
      z.string(),
  })

const requestDetailsRawSchema =
  z.object({
    id: z.string().uuid(),
    request_number:
      z.string(),
    status:
      z.enum(
        DOCTOR_REQUEST_STATUSES
      ),
    priority:
      z.enum(
        DOCTOR_PRIORITIES
      ),
    request_notes:
      nullableString,
    created_at:
      z.string(),
    started_at:
      nullableString,
    completed_at:
      nullableString,
  })

const patientDetailsRawSchema =
  z.object({
    id: z.string().uuid(),
    medical_record_number:
      z.string(),
    first_name:
      z.string(),
    middle_name:
      nullableString,
    last_name:
      z.string(),
    date_of_birth:
      z.string(),
    biological_sex:
      z.string(),
    mobile_number:
      nullableString,
    email_address:
      nullableString,
    address:
      z.string(),
    emergency_contact_name:
      z.string(),
    emergency_contact_number:
      z.string(),
    status:
      z.string(),
  })

const visitDetailsRawSchema =
  z.object({
    id: z.string().uuid(),
    visit_number:
      z.string(),
    arrival_mode:
      z.string(),
    initial_service_type:
      z.string(),
    chief_concern:
      nullableString,
    status:
      z.string(),
    registered_at:
      z.string(),
    checked_in_at:
      nullableString,
  })

const branchRawSchema =
  z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  })

const queueDetailsRawSchema =
  z.object({
    id: z.string().uuid(),
    queue_number:
      z.string(),
    queue_sequence:
      z.number(),
    priority:
      z.enum(
        DOCTOR_PRIORITIES
      ),
    status:
      z.enum(
        DOCTOR_QUEUE_STATUSES
      ),
    called_at:
      nullableString,
    service_started_at:
      nullableString,
    service_completed_at:
      nullableString,
  })

const consultationDetailsRawSchema =
  z.object({
    id: z.string().uuid(),
    consultation_number:
      z.string(),
    status:
      z.enum(
        DOCTOR_CONSULTATION_STATUSES
      ),
    chief_complaint:
      nullableString,
    history_of_present_illness:
      nullableString,
    physical_examination:
      nullableString,
    assessment:
      nullableString,
    diagnosis_code:
      nullableString,
    diagnosis_text:
      nullableString,
    treatment_plan:
      nullableString,
    clinical_notes:
      nullableString,
    revision_number:
      z.number(),
    started_at:
      z.string(),
    completed_at:
      nullableString,
    summary_document_id:
      z.string().uuid().nullable(),
    updated_at:
      z.string(),
  })

const clinicalDocumentRawSchema =
  z.object({
    id: z.string().uuid(),
    document_number:
      z.string(),
    document_type:
      z.string(),
    title:
      z.string(),
    status:
      z.string(),
    version_number:
      z.number(),
    finalized_at:
      nullableString,
    metadata:
      z
        .record(
          z.string(),
          z.unknown()
        )
        .default({}),
  })

const workspaceRawSchema =
  z.object({
    request:
      requestDetailsRawSchema,
    patient:
      patientDetailsRawSchema,
    visit:
      visitDetailsRawSchema,
    branch:
      branchRawSchema,
    queue:
      queueDetailsRawSchema,
    consultation:
      consultationDetailsRawSchema.nullable(),
    clinical_documents:
      z.array(
        clinicalDocumentRawSchema
      ),
  })

export async function getReceptionDoctorAssignmentPageData(): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  data: ReceptionDoctorAssignmentPageData
}> {
  const context =
    await requireStaffRole([
      "RECEPTIONIST",
      "SYSTEM_ADMIN",
    ])

  if (
    !context.permissions.includes(
      "reception.service_request.create"
    ) &&
    !context.roles.some(
      (role) =>
        role.code ===
        "SYSTEM_ADMIN"
    )
  ) {
    throw new Error(
      "The current staff account cannot manage Doctor assignments."
    )
  }

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_reception_doctor_assignment_data"
  )

  if (error) {
    throw new Error(
      error.message ||
      "Unable to load Doctor assignment data."
    )
  }

  const parsed =
    assignmentDataRawSchema.safeParse(
      data
    )

  if (!parsed.success) {
    throw new Error(
      "The Doctor assignment response is invalid."
    )
  }

  return {
    context,
    data: {
      doctors:
        parsed.data.doctors.map(
          (doctor) => ({
            id: doctor.id,
            employeeId:
              doctor.employee_id,
            fullName:
              doctor.full_name,
            jobTitle:
              doctor.job_title,
            branches:
              doctor.branches.map(
                (branch) => ({
                  id: branch.id,
                  code: branch.code,
                  name: branch.name,
                  isPrimary:
                    branch.is_primary,
                })
              ),
          })
        ),

      requests:
        parsed.data.requests.map(
          (request) => ({
            serviceRequestId:
              request.service_request_id,
            requestNumber:
              request.request_number,
            patientId:
              request.patient_id,
            patientName:
              request.patient_name,
            medicalRecordNumber:
              request.medical_record_number,
            visitNumber:
              request.visit_number,
            branchId:
              request.branch_id,
            branchName:
              request.branch_name,
            priority:
              request.priority,
            requestStatus:
              request.request_status,
            queueNumber:
              request.queue_number,
            queueStatus:
              request.queue_status,
            assignedDoctorId:
              request.assigned_doctor_id,
            assignedDoctorName:
              request.assigned_doctor_name,
            requestedAt:
              request.requested_at,
          })
        ),
    },
  }
}

export async function getDoctorQueuePageData(): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  queue: DoctorQueueRecord[]
}> {
  const context =
    await requireStaffRole([
      "DOCTOR",
    ])

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_doctor_consultation_queue"
  )

  if (error) {
    throw new Error(
      error.message ||
      "Unable to load the assigned Doctor queue."
    )
  }

  const parsed =
    z
      .array(
        doctorQueueRawSchema
      )
      .safeParse(data)

  if (!parsed.success) {
    throw new Error(
      "The assigned Doctor queue response is invalid."
    )
  }

  return {
    context,
    queue:
      parsed.data.map(
        (record) => ({
          serviceRequestId:
            record.service_request_id,
          requestNumber:
            record.request_number,
          patientId:
            record.patient_id,
          patientName:
            record.patient_name,
          medicalRecordNumber:
            record.medical_record_number,
          dateOfBirth:
            record.date_of_birth,
          biologicalSex:
            record.biological_sex,
          visitNumber:
            record.visit_number,
          chiefConcern:
            record.chief_concern,
          branchId:
            record.branch_id,
          branchName:
            record.branch_name,
          priority:
            record.priority,
          requestStatus:
            record.request_status,
          queueId:
            record.queue_id,
          queueNumber:
            record.queue_number,
          queueStatus:
            record.queue_status,
          calledAt:
            record.called_at,
          serviceStartedAt:
            record.service_started_at,
          consultationId:
            record.consultation_id,
          consultationNumber:
            record.consultation_number,
          consultationStatus:
            record.consultation_status,
          startedAt:
            record.started_at,
          completedAt:
            record.completed_at,
          requestedAt:
            record.requested_at,
        })
      ),
  }
}

export async function getDoctorConsultationPageData(
  serviceRequestId: string
): Promise<{
  context: Awaited<
    ReturnType<
      typeof requireStaffRole
    >
  >
  data: DoctorConsultationWorkspaceData
}> {
  const context =
    await requireStaffRole([
      "DOCTOR",
    ])

  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_doctor_consultation_workspace",
    {
      p_service_request_id:
        serviceRequestId,
    }
  )

  if (error) {
    throw new Error(
      error.message ||
      "Unable to load the assigned Doctor consultation."
    )
  }

  const parsed =
    workspaceRawSchema.safeParse(
      data
    )

  if (!parsed.success) {
    throw new Error(
      "The Doctor consultation workspace response is invalid."
    )
  }

  const raw =
    parsed.data

  return {
    context,
    data: {
      request: {
        id: raw.request.id,
        requestNumber:
          raw.request.request_number,
        status:
          raw.request.status,
        priority:
          raw.request.priority,
        requestNotes:
          raw.request.request_notes,
        createdAt:
          raw.request.created_at,
        startedAt:
          raw.request.started_at,
        completedAt:
          raw.request.completed_at,
      },

      patient: {
        id: raw.patient.id,
        medicalRecordNumber:
          raw.patient.medical_record_number,
        firstName:
          raw.patient.first_name,
        middleName:
          raw.patient.middle_name,
        lastName:
          raw.patient.last_name,
        dateOfBirth:
          raw.patient.date_of_birth,
        biologicalSex:
          raw.patient.biological_sex,
        mobileNumber:
          raw.patient.mobile_number,
        emailAddress:
          raw.patient.email_address,
        address:
          raw.patient.address,
        emergencyContactName:
          raw.patient.emergency_contact_name,
        emergencyContactNumber:
          raw.patient.emergency_contact_number,
        status:
          raw.patient.status,
      },

      visit: {
        id: raw.visit.id,
        visitNumber:
          raw.visit.visit_number,
        arrivalMode:
          raw.visit.arrival_mode,
        initialServiceType:
          raw.visit.initial_service_type,
        chiefConcern:
          raw.visit.chief_concern,
        status:
          raw.visit.status,
        registeredAt:
          raw.visit.registered_at,
        checkedInAt:
          raw.visit.checked_in_at,
      },

      branch: raw.branch,

      queue: {
        id: raw.queue.id,
        queueNumber:
          raw.queue.queue_number,
        queueSequence:
          raw.queue.queue_sequence,
        priority:
          raw.queue.priority,
        status:
          raw.queue.status,
        calledAt:
          raw.queue.called_at,
        serviceStartedAt:
          raw.queue.service_started_at,
        serviceCompletedAt:
          raw.queue.service_completed_at,
      },

      consultation:
        raw.consultation
          ? {
              id:
                raw.consultation.id,
              consultationNumber:
                raw.consultation.consultation_number,
              status:
                raw.consultation.status,
              chiefComplaint:
                raw.consultation.chief_complaint,
              historyOfPresentIllness:
                raw.consultation.history_of_present_illness,
              physicalExamination:
                raw.consultation.physical_examination,
              assessment:
                raw.consultation.assessment,
              diagnosisCode:
                raw.consultation.diagnosis_code,
              diagnosisText:
                raw.consultation.diagnosis_text,
              treatmentPlan:
                raw.consultation.treatment_plan,
              clinicalNotes:
                raw.consultation.clinical_notes,
              revisionNumber:
                raw.consultation.revision_number,
              startedAt:
                raw.consultation.started_at,
              completedAt:
                raw.consultation.completed_at,
              summaryDocumentId:
                raw.consultation.summary_document_id,
              updatedAt:
                raw.consultation.updated_at,
            }
          : null,

      clinicalDocuments:
        raw.clinical_documents.map(
          (document) => ({
            id: document.id,
            documentNumber:
              document.document_number,
            documentType:
              document.document_type,
            title:
              document.title,
            status:
              document.status,
            versionNumber:
              document.version_number,
            finalizedAt:
              document.finalized_at,
            metadata:
              document.metadata,
          })
        ),
    },
  }
}
