import {
  REPORT_MODULE_ORDER,
} from "@/features/reports/constants/reports.constants"
import type {
  ReportDateRange,
  ReportDrilldownRow,
  ReportModuleSnapshot,
  ReportsFilters,
  ReportsSnapshot,
} from "@/features/reports/types/reports.types"
import {
  calculateReportAverage,
  calculateReportPercentage,
  createReportMetric,
  differenceInReportMinutes,
  isBranchInReportScope,
  isTimestampInReportRange,
  resolveReportsDateRange,
  sortReportDrilldownRows,
} from "@/features/reports/utils/reports.utils"

type UnknownRecord =
  Record<string, unknown>

export interface BuildReportsSnapshotInput {
  filters: ReportsFilters

  patients:
    readonly unknown[]

  appointments:
    readonly unknown[]

  consultations:
    readonly unknown[]

  laboratoryOrders:
    readonly unknown[]

  laboratoryResultSets:
    readonly unknown[]

  radiologyOrders:
    readonly unknown[]

  radiologyReports:
    readonly unknown[]

  pharmacyPrescriptions:
    readonly unknown[]

  billingStatements:
    readonly unknown[]

  billingPayments:
    readonly unknown[]

  billingRefunds:
    readonly unknown[]
}

function asRecord(
  value: unknown
): UnknownRecord | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null
  }

  return value as UnknownRecord
}

function toRecords(
  values:
    readonly unknown[]
): UnknownRecord[] {
  return values
    .map(asRecord)
    .filter(
      (
        record
      ): record is UnknownRecord =>
        record !== null
    )
}

function readString(
  record: UnknownRecord,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "string"
    ) {
      const normalizedValue =
        value.trim()

      if (normalizedValue) {
        return normalizedValue
      }
    }
  }

  return null
}

function readNumber(
  record: UnknownRecord,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = record[key]

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsedValue =
        Number(value)

      if (
        Number.isFinite(
          parsedValue
        )
      ) {
        return parsedValue
      }
    }
  }

  return null
}

function readArray(
  record: UnknownRecord,
  ...keys: string[]
): readonly unknown[] {
  for (const key of keys) {
    const value = record[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

function readTimestamp(
  record: UnknownRecord,
  ...keys: string[]
): string | null {
  const value =
    readString(
      record,
      ...keys
    )

  if (!value) {
    return null
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return `${value}T12:00:00`
  }

  const timestamp =
    new Date(value).getTime()

  return Number.isNaN(timestamp)
    ? null
    : value
}

function normalizeToken(
  value:
    string | null
): string {
  return (
    value
      ?.trim()
      .toLocaleLowerCase(
        "en-PH"
      )
      .replace(
        /[_\s]+/g,
        "-"
      ) ?? ""
  )
}

function readStatus(
  record: UnknownRecord
): string {
  return normalizeToken(
    readString(
      record,
      "status",
      "recordStatus",
      "record_status"
    )
  )
}

function statusIs(
  status: string,
  ...expectedStatuses:
    string[]
): boolean {
  return expectedStatuses.some(
    (expectedStatus) =>
      status ===
      normalizeToken(
        expectedStatus
      )
  )
}

function statusContains(
  status: string,
  ...tokens: string[]
): boolean {
  return tokens.some(
    (token) =>
      status.includes(
        normalizeToken(token)
      )
  )
}

function getRecordId(
  record: UnknownRecord,
  fallbackPrefix: string,
  index: number
): string {
  return (
    readString(
      record,
      "id",
      "recordId",
      "record_id"
    ) ??
    `${fallbackPrefix}-${index + 1}`
  )
}

function getPatientId(
  record: UnknownRecord
): string | null {
  return readString(
    record,
    "patientId",
    "patient_id"
  )
}

function getBranchId(
  record: UnknownRecord
): string | null {
  return readString(
    record,
    "branchId",
    "branch_id"
  )
}

function getBranchName(
  record: UnknownRecord
): string | null {
  return readString(
    record,
    "branchName",
    "branch_name"
  )
}

function getPatientDisplayName(
  record: UnknownRecord
): string {
  const explicitName =
    readString(
      record,
      "patientName",
      "patient_name",
      "fullName",
      "full_name",
      "name"
    )

  if (explicitName) {
    return explicitName
  }

  const nameParts = [
    readString(
      record,
      "firstName",
      "first_name"
    ),
    readString(
      record,
      "middleName",
      "middle_name"
    ),
    readString(
      record,
      "lastName",
      "last_name"
    ),
  ].filter(
    (
      value
    ): value is string =>
      Boolean(value)
  )

  return (
    nameParts.join(" ") ||
    readString(
      record,
      "medicalRecordNumber",
      "medical_record_number"
    ) ||
    "Patient record"
  )
}

function getRecordReference(
  record: UnknownRecord,
  ...preferredKeys:
    string[]
): string | null {
  return readString(
    record,
    ...preferredKeys,
    "reference",
    "recordNumber",
    "record_number",
    "number"
  )
}

function recordMatchesBranch(
  record: UnknownRecord,
  filters: ReportsFilters
): boolean {
  return isBranchInReportScope(
    getBranchId(record),
    filters.branchId
  )
}

function recordMatchesDateRange(
  record: UnknownRecord,
  dateRange:
    ReportDateRange,
  dateKeys:
    readonly string[]
): boolean {
  const timestamp =
    readTimestamp(
      record,
      ...dateKeys
    )

  return isTimestampInReportRange(
    timestamp,
    dateRange
  )
}

function getScopedRecords(
  records:
    readonly unknown[],
  filters: ReportsFilters,
  dateRange:
    ReportDateRange,
  dateKeys:
    readonly string[]
): UnknownRecord[] {
  return toRecords(records).filter(
    (record) =>
      recordMatchesBranch(
        record,
        filters
      ) &&
      recordMatchesDateRange(
        record,
        dateRange,
        dateKeys
      )
  )
}

function getBranchScopedRecords(
  records:
    readonly unknown[],
  filters: ReportsFilters
): UnknownRecord[] {
  return toRecords(records).filter(
    (record) =>
      recordMatchesBranch(
        record,
        filters
      )
  )
}

function sumRecordValues(
  records:
    readonly UnknownRecord[],
  ...keys: string[]
): number {
  return records.reduce(
    (
      total,
      record
    ) =>
      total +
      (
        readNumber(
          record,
          ...keys
        ) ?? 0
      ),
    0
  )
}

function getFirstTimestampFromRecords(
  records:
    readonly UnknownRecord[],
  ...keys: string[]
): string | null {
  for (const record of records) {
    const value =
      readTimestamp(
        record,
        ...keys
      )

    if (value) {
      return value
    }
  }

  return null
}

function getRelatedRecords(
  sourceRecord:
    UnknownRecord,
  candidateRecords:
    readonly UnknownRecord[],
  sourceIdKeys:
    readonly string[],
  candidateLinkKeys:
    readonly string[]
): UnknownRecord[] {
  const sourceId =
    readString(
      sourceRecord,
      ...sourceIdKeys
    )

  if (!sourceId) {
    return []
  }

  return candidateRecords.filter(
    (candidateRecord) =>
      readString(
        candidateRecord,
        ...candidateLinkKeys
      ) === sourceId
  )
}

function createPatientSnapshot({
  filters,
  dateRange,
  patients,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  patients:
    readonly unknown[]
}): ReportModuleSnapshot {
  const branchPatients =
    getBranchScopedRecords(
      patients,
      filters
    )

  const periodPatients =
    getScopedRecords(
      patients,
      filters,
      dateRange,
      [
        "createdAt",
        "created_at",
        "registeredAt",
        "registered_at",
      ]
    )

  const activeCount =
    branchPatients.filter(
      (patient) =>
        statusIs(
          readStatus(patient),
          "active"
        )
    ).length

  const inactiveCount =
    branchPatients.filter(
      (patient) =>
        statusIs(
          readStatus(patient),
          "inactive"
        )
    ).length

  const archivedCount =
    branchPatients.filter(
      (patient) =>
        statusIs(
          readStatus(patient),
          "archived"
        )
    ).length

  const drilldownRows =
    periodPatients.flatMap<
      ReportDrilldownRow
    >(
      (
        patient,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            patient,
            "createdAt",
            "created_at",
            "registeredAt",
            "registered_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(patient)

        const medicalRecordNumber =
          readString(
            patient,
            "medicalRecordNumber",
            "medical_record_number"
          )

        return [
          {
            id:
              `report-patient-${getRecordId(
                patient,
                "patient",
                index
              )}`,

            module: "patients",

            occurredAt,

            patientId:
              readString(
                patient,
                "id"
              ),

            branchId:
              getBranchId(patient),

            title:
              getPatientDisplayName(
                patient
              ),

            subtitle:
              getBranchName(
                patient
              ),

            reference:
              medicalRecordNumber,

            status:
              status || null,

            severity:
              status === "archived"
                ? "warning"
                : status ===
                    "active"
                  ? "success"
                  : "neutral",

            amountCentavos:
              null,

            metadata: {
              branch:
                getBranchName(
                  patient
                ),

              medicalRecordNumber,

              status:
                status || null,
            },
          },
        ]
      }
    )

  return {
    module: "patients",

    metrics: [
      createReportMetric({
        id:
          "patients-total-records",

        label:
          "Patient Records",

        description:
          "All patient records in the selected branch scope.",

        value:
          branchPatients.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "patients-registered-period",

        label:
          "New Registrations",

        description:
          "Patient records created within the selected reporting period.",

        value:
          periodPatients.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "patients-active",

        label:
          "Active Records",

        value:
          activeCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "patients-inactive",

        label:
          "Inactive Records",

        value:
          inactiveCount,

        tone:
          inactiveCount > 0
            ? "warning"
            : "neutral",
      }),

      createReportMetric({
        id:
          "patients-archived",

        label:
          "Archived Records",

        value:
          archivedCount,

        tone:
          archivedCount > 0
            ? "warning"
            : "neutral",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows(
        drilldownRows
      ),
  }
}

function createAppointmentSnapshot({
  filters,
  dateRange,
  appointments,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  appointments:
    readonly unknown[]
}): ReportModuleSnapshot {
  const scopedAppointments =
    getScopedRecords(
      appointments,
      filters,
      dateRange,
      [
        "scheduledStartAt",
        "scheduled_start_at",
        "scheduledAt",
        "scheduled_at",
        "appointmentDate",
        "appointment_date",
        "createdAt",
        "created_at",
      ]
    )

  const arrivedCount =
    scopedAppointments.filter(
      (appointment) =>
        statusIs(
          readStatus(
            appointment
          ),
          "checked-in",
          "completed"
        )
    ).length

  const confirmedCount =
    scopedAppointments.filter(
      (appointment) =>
        statusIs(
          readStatus(
            appointment
          ),
          "confirmed"
        )
    ).length

  const cancelledCount =
    scopedAppointments.filter(
      (appointment) =>
        statusIs(
          readStatus(
            appointment
          ),
          "cancelled"
        )
    ).length

  const noShowCount =
    scopedAppointments.filter(
      (appointment) =>
        statusIs(
          readStatus(
            appointment
          ),
          "no-show"
        )
    ).length

  const arrivalDenominator =
    Math.max(
      0,
      scopedAppointments.length -
        cancelledCount
    )

  const drilldownRows =
    scopedAppointments.flatMap<
      ReportDrilldownRow
    >(
      (
        appointment,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            appointment,
            "scheduledStartAt",
            "scheduled_start_at",
            "scheduledAt",
            "scheduled_at",
            "appointmentDate",
            "appointment_date",
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(
            appointment
          )

        const reference =
          getRecordReference(
            appointment,
            "appointmentNumber",
            "appointment_number"
          )

        const doctorName =
          readString(
            appointment,
            "doctorName",
            "doctor_name"
          )

        const departmentName =
          readString(
            appointment,
            "departmentName",
            "department_name"
          )

        return [
          {
            id:
              `report-appointment-${getRecordId(
                appointment,
                "appointment",
                index
              )}`,

            module:
              "appointments",

            occurredAt,

            patientId:
              getPatientId(
                appointment
              ),

            branchId:
              getBranchId(
                appointment
              ),

            title:
              reference ??
              doctorName ??
              "Appointment",

            subtitle:
              [
                doctorName,
                departmentName,
              ]
                .filter(Boolean)
                .join(" · ") ||
              null,

            reference,

            status:
              status || null,

            severity:
              status ===
                "no-show"
                ? "danger"
                : status ===
                    "cancelled"
                  ? "warning"
                  : status ===
                      "checked-in" ||
                      status ===
                        "completed"
                    ? "success"
                    : "information",

            amountCentavos:
              null,

            metadata: {
              doctor:
                doctorName,

              department:
                departmentName,

              appointmentMode:
                readString(
                  appointment,
                  "mode"
                ),

              visitType:
                readString(
                  appointment,
                  "visitType",
                  "visit_type"
                ),
            },
          },
        ]
      }
    )

  return {
    module:
      "appointments",

    metrics: [
      createReportMetric({
        id:
          "appointments-total",

        label:
          "Appointments",

        value:
          scopedAppointments.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "appointments-confirmed",

        label:
          "Confirmed",

        value:
          confirmedCount,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "appointments-arrived",

        label:
          "Checked In / Arrived",

        value:
          arrivedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "appointments-arrival-rate",

        label:
          "Arrival Rate",

        description:
          "Checked-in or completed appointments divided by non-cancelled appointments.",

        value:
          calculateReportPercentage(
            arrivedCount,
            arrivalDenominator
          ),

        format:
          "percentage",

        tone:
          arrivedCount > 0
            ? "success"
            : "neutral",

        precision: 1,
      }),

      createReportMetric({
        id:
          "appointments-no-show",

        label:
          "No-shows",

        value:
          noShowCount,

        tone:
          noShowCount > 0
            ? "danger"
            : "success",
      }),

      createReportMetric({
        id:
          "appointments-no-show-rate",

        label:
          "No-show Rate",

        value:
          calculateReportPercentage(
            noShowCount,
            scopedAppointments.length
          ),

        format:
          "percentage",

        tone:
          noShowCount > 0
            ? "warning"
            : "success",

        precision: 1,
      }),

      createReportMetric({
        id:
          "appointments-cancelled",

        label:
          "Cancelled",

        value:
          cancelledCount,

        tone:
          cancelledCount > 0
            ? "warning"
            : "neutral",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows(
        drilldownRows
      ),
  }
}

function createConsultationSnapshot({
  filters,
  dateRange,
  consultations,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  consultations:
    readonly unknown[]
}): ReportModuleSnapshot {
  const scopedConsultations =
    getScopedRecords(
      consultations,
      filters,
      dateRange,
      [
        "queuedAt",
        "queued_at",
        "scheduledAt",
        "scheduled_at",
        "createdAt",
        "created_at",
      ]
    )

  const completedCount =
    scopedConsultations.filter(
      (consultation) =>
        statusIs(
          readStatus(
            consultation
          ),
          "completed"
        )
    ).length

  const waitingCount =
    scopedConsultations.filter(
      (consultation) =>
        statusIs(
          readStatus(
            consultation
          ),
          "waiting"
        )
    ).length

  const inProgressCount =
    scopedConsultations.filter(
      (consultation) =>
        statusIs(
          readStatus(
            consultation
          ),
          "in-progress"
        )
    ).length

  const noShowCount =
    scopedConsultations.filter(
      (consultation) =>
        statusIs(
          readStatus(
            consultation
          ),
          "no-show"
        )
    ).length

  const waitingDurations =
    scopedConsultations.flatMap(
      (consultation) => {
        const duration =
          differenceInReportMinutes(
            readTimestamp(
              consultation,
              "queuedAt",
              "queued_at",
              "checkedInAt",
              "checked_in_at",
              "createdAt",
              "created_at"
            ),

            readTimestamp(
              consultation,
              "startedAt",
              "started_at"
            )
          )

        return duration === null
          ? []
          : [duration]
      }
    )

  const consultationDurations =
    scopedConsultations.flatMap(
      (consultation) => {
        const duration =
          differenceInReportMinutes(
            readTimestamp(
              consultation,
              "startedAt",
              "started_at"
            ),

            readTimestamp(
              consultation,
              "completedAt",
              "completed_at"
            )
          )

        return duration === null
          ? []
          : [duration]
      }
    )

  const drilldownRows =
    scopedConsultations.flatMap<
      ReportDrilldownRow
    >(
      (
        consultation,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            consultation,
            "queuedAt",
            "queued_at",
            "scheduledAt",
            "scheduled_at",
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(
            consultation
          )

        const reference =
          getRecordReference(
            consultation,
            "consultationNumber",
            "consultation_number"
          )

        const doctorName =
          readString(
            consultation,
            "doctorName",
            "doctor_name"
          )

        return [
          {
            id:
              `report-consultation-${getRecordId(
                consultation,
                "consultation",
                index
              )}`,

            module:
              "consultations",

            occurredAt,

            patientId:
              getPatientId(
                consultation
              ),

            branchId:
              getBranchId(
                consultation
              ),

            title:
              reference ??
              "Consultation",

            subtitle:
              doctorName,

            reference,

            status:
              status || null,

            severity:
              status ===
                "completed"
                ? "success"
                : status ===
                    "no-show" ||
                    status ===
                      "cancelled"
                  ? "danger"
                  : status ===
                      "in-progress"
                    ? "information"
                    : "warning",

            amountCentavos:
              null,

            metadata: {
              doctor:
                doctorName,

              startedAt:
                readTimestamp(
                  consultation,
                  "startedAt",
                  "started_at"
                ),

              completedAt:
                readTimestamp(
                  consultation,
                  "completedAt",
                  "completed_at"
                ),
            },
          },
        ]
      }
    )

  return {
    module:
      "consultations",

    metrics: [
      createReportMetric({
        id:
          "consultations-total",

        label:
          "Consultations",

        value:
          scopedConsultations.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "consultations-completed",

        label:
          "Completed",

        value:
          completedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "consultations-completion-rate",

        label:
          "Completion Rate",

        value:
          calculateReportPercentage(
            completedCount,
            scopedConsultations.length
          ),

        format:
          "percentage",

        tone:
          completedCount > 0
            ? "success"
            : "neutral",

        precision: 1,
      }),

      createReportMetric({
        id:
          "consultations-waiting",

        label:
          "Waiting",

        value:
          waitingCount,

        tone:
          waitingCount > 0
            ? "warning"
            : "neutral",
      }),

      createReportMetric({
        id:
          "consultations-in-progress",

        label:
          "In Progress",

        value:
          inProgressCount,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "consultations-average-wait",

        label:
          "Average Wait",

        value:
          calculateReportAverage(
            waitingDurations
          ),

        format:
          "duration-minutes",

        tone:
          waitingDurations.length >
          0
            ? "information"
            : "neutral",
      }),

      createReportMetric({
        id:
          "consultations-average-duration",

        label:
          "Average Consultation Duration",

        value:
          calculateReportAverage(
            consultationDurations
          ),

        format:
          "duration-minutes",

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "consultations-no-show",

        label:
          "No-shows",

        value:
          noShowCount,

        tone:
          noShowCount > 0
            ? "danger"
            : "success",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows(
        drilldownRows
      ),
  }
}

function createLaboratorySnapshot({
  filters,
  dateRange,
  laboratoryOrders,
  laboratoryResultSets,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  laboratoryOrders:
    readonly unknown[]
  laboratoryResultSets:
    readonly unknown[]
}): ReportModuleSnapshot {
  const scopedOrders =
    getScopedRecords(
      laboratoryOrders,
      filters,
      dateRange,
      [
        "orderedAt",
        "ordered_at",
        "createdAt",
        "created_at",
        "scheduledAt",
        "scheduled_at",
      ]
    )

  const resultRecords =
    toRecords(
      laboratoryResultSets
    )

  function getOrderResults(
    order: UnknownRecord
  ): UnknownRecord[] {
    return getRelatedRecords(
      order,
      resultRecords,
      ["id"],
      [
        "orderId",
        "order_id",
        "laboratoryOrderId",
        "laboratory_order_id",
      ]
    )
  }

  function getReleasedAt(
    order: UnknownRecord
  ): string | null {
    const relatedResults =
      getOrderResults(order)

    return (
      getFirstTimestampFromRecords(
        relatedResults,
        "releasedAt",
        "released_at",
        "resultReleasedAt",
        "result_released_at"
      ) ??
      readTimestamp(
        order,
        "releasedAt",
        "released_at",
        "resultReleasedAt",
        "result_released_at"
      )
    )
  }

  const collectedCount =
    scopedOrders.filter(
      (order) => {
        const status =
          readStatus(order)

        return Boolean(
          readTimestamp(
            order,
            "collectedAt",
            "collected_at",
            "specimenCollectedAt",
            "specimen_collected_at"
          )
        ) ||
          statusContains(
            status,
            "collected",
            "processing",
            "completed",
            "released"
          )
      }
    ).length

  const rejectedCount =
    scopedOrders.filter(
      (order) =>
        Boolean(
          readTimestamp(
            order,
            "rejectedAt",
            "rejected_at",
            "specimenRejectedAt",
            "specimen_rejected_at"
          )
        ) ||
        statusContains(
          readStatus(order),
          "rejected"
        )
    ).length

  const releasedCount =
    scopedOrders.filter(
      (order) =>
        Boolean(
          getReleasedAt(order)
        ) ||
        statusContains(
          readStatus(order),
          "released"
        )
    ).length

  const turnaroundDurations =
    scopedOrders.flatMap(
      (order) => {
        const duration =
          differenceInReportMinutes(
            readTimestamp(
              order,
              "orderedAt",
              "ordered_at",
              "createdAt",
              "created_at"
            ),

            getReleasedAt(order)
          )

        return duration === null
          ? []
          : [duration]
      }
    )

  const drilldownRows =
    scopedOrders.flatMap<
      ReportDrilldownRow
    >(
      (
        order,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            order,
            "orderedAt",
            "ordered_at",
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(order)

        const reference =
          getRecordReference(
            order,
            "orderNumber",
            "order_number",
            "laboratoryOrderNumber",
            "laboratory_order_number"
          )

        const title =
          readString(
            order,
            "panelName",
            "panel_name",
            "testName",
            "test_name",
            "procedureName",
            "procedure_name"
          ) ??
          reference ??
          "Laboratory Order"

        return [
          {
            id:
              `report-laboratory-${getRecordId(
                order,
                "laboratory-order",
                index
              )}`,

            module:
              "laboratory",

            occurredAt,

            patientId:
              getPatientId(order),

            branchId:
              getBranchId(order),

            title,

            subtitle:
              getBranchName(order),

            reference,

            status:
              status || null,

            severity:
              rejectedCount > 0 &&
              statusContains(
                status,
                "rejected"
              )
                ? "danger"
                : getReleasedAt(
                      order
                    )
                  ? "success"
                  : statusContains(
                        status,
                        "processing"
                      )
                    ? "information"
                    : "warning",

            amountCentavos:
              null,

            metadata: {
              releasedAt:
                getReleasedAt(
                  order
                ),

              specimenCollectedAt:
                readTimestamp(
                  order,
                  "collectedAt",
                  "collected_at",
                  "specimenCollectedAt",
                  "specimen_collected_at"
                ),

              testCount:
                readArray(
                  order,
                  "tests",
                  "items"
                ).length,
            },
          },
        ]
      }
    )

  return {
    module: "laboratory",

    metrics: [
      createReportMetric({
        id:
          "laboratory-orders",

        label:
          "Laboratory Orders",

        value:
          scopedOrders.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "laboratory-collected",

        label:
          "Specimens Collected",

        value:
          collectedCount,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "laboratory-released",

        label:
          "Results Released",

        value:
          releasedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "laboratory-release-rate",

        label:
          "Release Rate",

        value:
          calculateReportPercentage(
            releasedCount,
            scopedOrders.length
          ),

        format:
          "percentage",

        tone:
          releasedCount > 0
            ? "success"
            : "neutral",

        precision: 1,
      }),

      createReportMetric({
        id:
          "laboratory-rejected",

        label:
          "Rejected Specimens",

        value:
          rejectedCount,

        tone:
          rejectedCount > 0
            ? "danger"
            : "success",
      }),

      createReportMetric({
        id:
          "laboratory-turnaround",

        label:
          "Average Release Turnaround",

        value:
          calculateReportAverage(
            turnaroundDurations
          ),

        format:
          "duration-minutes",

        tone:
          "information",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows(
        drilldownRows
      ),
  }
}

function createRadiologySnapshot({
  filters,
  dateRange,
  radiologyOrders,
  radiologyReports,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  radiologyOrders:
    readonly unknown[]
  radiologyReports:
    readonly unknown[]
}): ReportModuleSnapshot {
  const scopedOrders =
    getScopedRecords(
      radiologyOrders,
      filters,
      dateRange,
      [
        "orderedAt",
        "ordered_at",
        "createdAt",
        "created_at",
        "scheduledStartAt",
        "scheduled_start_at",
      ]
    )

  const reportRecords =
    toRecords(
      radiologyReports
    )

  function getOrderReports(
    order: UnknownRecord
  ): UnknownRecord[] {
    return getRelatedRecords(
      order,
      reportRecords,
      ["id"],
      [
        "orderId",
        "order_id",
        "radiologyOrderId",
        "radiology_order_id",
      ]
    )
  }

  function getReleasedAt(
    order: UnknownRecord
  ): string | null {
    return (
      getFirstTimestampFromRecords(
        getOrderReports(order),
        "releasedAt",
        "released_at"
      ) ??
      readTimestamp(
        order,
        "releasedAt",
        "released_at"
      )
    )
  }

  const startedCount =
    scopedOrders.filter(
      (order) =>
        Boolean(
          readTimestamp(
            order,
            "imagingStartedAt",
            "imaging_started_at"
          )
        ) ||
        statusContains(
          readStatus(order),
          "imaging",
          "images-acquired",
          "technically-completed",
          "report-draft",
          "verified",
          "released"
        )
    ).length

  const technicallyCompletedCount =
    scopedOrders.filter(
      (order) =>
        Boolean(
          readTimestamp(
            order,
            "technicalCompletedAt",
            "technical_completed_at"
          )
        ) ||
        statusContains(
          readStatus(order),
          "technically-completed",
          "report-draft",
          "verified",
          "released"
        )
    ).length

  const releasedCount =
    scopedOrders.filter(
      (order) =>
        Boolean(
          getReleasedAt(order)
        ) ||
        statusContains(
          readStatus(order),
          "released"
        )
    ).length

  const turnaroundDurations =
    scopedOrders.flatMap(
      (order) => {
        const duration =
          differenceInReportMinutes(
            readTimestamp(
              order,
              "orderedAt",
              "ordered_at",
              "createdAt",
              "created_at"
            ),

            getReleasedAt(order)
          )

        return duration === null
          ? []
          : [duration]
      }
    )

  const drilldownRows =
    scopedOrders.flatMap<
      ReportDrilldownRow
    >(
      (
        order,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            order,
            "orderedAt",
            "ordered_at",
            "createdAt",
            "created_at",
            "scheduledStartAt",
            "scheduled_start_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(order)

        const reference =
          getRecordReference(
            order,
            "orderNumber",
            "order_number"
          )

        const procedureName =
          readString(
            order,
            "procedureName",
            "procedure_name"
          )

        return [
          {
            id:
              `report-radiology-${getRecordId(
                order,
                "radiology-order",
                index
              )}`,

            module:
              "radiology",

            occurredAt,

            patientId:
              getPatientId(order),

            branchId:
              getBranchId(order),

            title:
              procedureName ??
              reference ??
              "Radiology Order",

            subtitle:
              readString(
                order,
                "modality"
              ),

            reference,

            status:
              status || null,

            severity:
              getReleasedAt(order)
                ? "success"
                : statusContains(
                      status,
                      "cancelled",
                      "no-show"
                    )
                  ? "danger"
                  : statusContains(
                        status,
                        "technically-completed",
                        "verified"
                      )
                    ? "information"
                    : "warning",

            amountCentavos:
              null,

            metadata: {
              modality:
                readString(
                  order,
                  "modality"
                ),

              bodyRegion:
                readString(
                  order,
                  "bodyRegion",
                  "body_region"
                ),

              releasedAt:
                getReleasedAt(
                  order
                ),

              room:
                readString(
                  order,
                  "roomName",
                  "room_name"
                ),
            },
          },
        ]
      }
    )

  return {
    module: "radiology",

    metrics: [
      createReportMetric({
        id:
          "radiology-orders",

        label:
          "Imaging Orders",

        value:
          scopedOrders.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "radiology-started",

        label:
          "Imaging Started",

        value:
          startedCount,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "radiology-technically-completed",

        label:
          "Technically Completed",

        value:
          technicallyCompletedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "radiology-released",

        label:
          "Reports Released",

        value:
          releasedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "radiology-release-rate",

        label:
          "Report Release Rate",

        value:
          calculateReportPercentage(
            releasedCount,
            scopedOrders.length
          ),

        format:
          "percentage",

        tone:
          releasedCount > 0
            ? "success"
            : "neutral",

        precision: 1,
      }),

      createReportMetric({
        id:
          "radiology-turnaround",

        label:
          "Average Report Turnaround",

        value:
          calculateReportAverage(
            turnaroundDurations
          ),

        format:
          "duration-minutes",

        tone:
          "information",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows(
        drilldownRows
      ),
  }
}

function createPharmacySnapshot({
  filters,
  dateRange,
  pharmacyPrescriptions,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  pharmacyPrescriptions:
    readonly unknown[]
}): ReportModuleSnapshot {
  const scopedPrescriptions =
    getScopedRecords(
      pharmacyPrescriptions,
      filters,
      dateRange,
      [
        "createdAt",
        "created_at",
        "receivedAt",
        "received_at",
      ]
    )

  const pendingReviewCount =
    scopedPrescriptions.filter(
      (prescription) =>
        statusIs(
          readStatus(
            prescription
          ),
          "received",
          "pending-review"
        )
    ).length

  const onHoldCount =
    scopedPrescriptions.filter(
      (prescription) =>
        statusIs(
          readStatus(
            prescription
          ),
          "on-hold"
        )
    ).length

  const fullyDispensedCount =
    scopedPrescriptions.filter(
      (prescription) =>
        statusIs(
          readStatus(
            prescription
          ),
          "dispensed"
        )
    ).length

  const releasedCount =
    scopedPrescriptions.filter(
      (prescription) =>
        Boolean(
          readTimestamp(
            prescription,
            "releasedAt",
            "released_at"
          )
        )
    ).length

  const releaseDurations =
    scopedPrescriptions.flatMap(
      (prescription) => {
        const duration =
          differenceInReportMinutes(
            readTimestamp(
              prescription,
              "createdAt",
              "created_at"
            ),

            readTimestamp(
              prescription,
              "releasedAt",
              "released_at"
            )
          )

        return duration === null
          ? []
          : [duration]
      }
    )

  const medicationItemCount =
    scopedPrescriptions.reduce(
      (
        total,
        prescription
      ) =>
        total +
        readArray(
          prescription,
          "items"
        ).length,
      0
    )

  const drilldownRows =
    scopedPrescriptions.flatMap<
      ReportDrilldownRow
    >(
      (
        prescription,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            prescription,
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(
            prescription
          )

        const reference =
          getRecordReference(
            prescription,
            "prescriptionNumber",
            "prescription_number"
          )

        const medicationNames =
          readArray(
            prescription,
            "items"
          )
            .map(asRecord)
            .filter(
              (
                item
              ): item is UnknownRecord =>
                item !== null
            )
            .map(
              (item) =>
                [
                  readString(
                    item,
                    "genericName",
                    "generic_name"
                  ),
                  readString(
                    item,
                    "strength"
                  ),
                ]
                  .filter(Boolean)
                  .join(" ")
            )
            .filter(Boolean)
            .join(", ")

        return [
          {
            id:
              `report-pharmacy-${getRecordId(
                prescription,
                "pharmacy-prescription",
                index
              )}`,

            module:
              "pharmacy",

            occurredAt,

            patientId:
              getPatientId(
                prescription
              ),

            branchId:
              getBranchId(
                prescription
              ),

            title:
              reference ??
              "Pharmacy Prescription",

            subtitle:
              medicationNames ||
              null,

            reference,

            status:
              status || null,

            severity:
              Boolean(
                readTimestamp(
                  prescription,
                  "releasedAt",
                  "released_at"
                )
              )
                ? "success"
                : status ===
                    "on-hold"
                  ? "danger"
                  : status ===
                      "dispensed"
                    ? "information"
                    : "warning",

            amountCentavos:
              null,

            metadata: {
              medicationItemCount:
                readArray(
                  prescription,
                  "items"
                ).length,

              allergyReview:
                readString(
                  prescription,
                  "allergyReviewStatus",
                  "allergy_review_status"
                ),

              interactionReview:
                readString(
                  prescription,
                  "interactionReviewStatus",
                  "interaction_review_status"
                ),

              releasedAt:
                readTimestamp(
                  prescription,
                  "releasedAt",
                  "released_at"
                ),
            },
          },
        ]
      }
    )

  return {
    module: "pharmacy",

    metrics: [
      createReportMetric({
        id:
          "pharmacy-prescriptions",

        label:
          "Prescriptions",

        value:
          scopedPrescriptions.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "pharmacy-medication-items",

        label:
          "Medication Items",

        value:
          medicationItemCount,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "pharmacy-pending-review",

        label:
          "Pending Safety Review",

        value:
          pendingReviewCount,

        tone:
          pendingReviewCount > 0
            ? "warning"
            : "success",
      }),

      createReportMetric({
        id:
          "pharmacy-on-hold",

        label:
          "On Hold",

        value:
          onHoldCount,

        tone:
          onHoldCount > 0
            ? "danger"
            : "success",
      }),

      createReportMetric({
        id:
          "pharmacy-dispensed",

        label:
          "Fully Dispensed",

        value:
          fullyDispensedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "pharmacy-released",

        label:
          "Released",

        value:
          releasedCount,

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "pharmacy-release-rate",

        label:
          "Release Rate",

        value:
          calculateReportPercentage(
            releasedCount,
            scopedPrescriptions.length
          ),

        format:
          "percentage",

        tone:
          releasedCount > 0
            ? "success"
            : "neutral",

        precision: 1,
      }),

      createReportMetric({
        id:
          "pharmacy-release-turnaround",

        label:
          "Average Release Turnaround",

        value:
          calculateReportAverage(
            releaseDurations
          ),

        format:
          "duration-minutes",

        tone:
          "information",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows(
        drilldownRows
      ),
  }
}

function createBillingSnapshot({
  filters,
  dateRange,
  billingStatements,
  billingPayments,
  billingRefunds,
}: {
  filters: ReportsFilters
  dateRange:
    ReportDateRange
  billingStatements:
    readonly unknown[]
  billingPayments:
    readonly unknown[]
  billingRefunds:
    readonly unknown[]
}): ReportModuleSnapshot {
  const branchStatements =
    getBranchScopedRecords(
      billingStatements,
      filters
    )

  const scopedStatements =
    branchStatements.filter(
      (statement) =>
        recordMatchesDateRange(
          statement,
          dateRange,
          [
            "issuedAt",
            "issued_at",
            "createdAt",
            "created_at",
          ]
        )
    )

  const branchStatementIds =
    new Set(
      branchStatements
        .map(
          (statement) =>
            readString(
              statement,
              "id"
            )
        )
        .filter(
          (
            statementId
          ): statementId is string =>
            Boolean(statementId)
        )
    )

  const scopedPayments =
    toRecords(
      billingPayments
    ).filter(
      (payment) =>
        branchStatementIds.has(
          readString(
            payment,
            "statementId",
            "statement_id"
          ) ?? ""
        ) &&
        recordMatchesDateRange(
          payment,
          dateRange,
          [
            "postedAt",
            "posted_at",
            "createdAt",
            "created_at",
          ]
        )
    )

  const scopedRefunds =
    toRecords(
      billingRefunds
    ).filter(
      (refund) =>
        branchStatementIds.has(
          readString(
            refund,
            "statementId",
            "statement_id"
          ) ?? ""
        ) &&
        recordMatchesDateRange(
          refund,
          dateRange,
          [
            "postedAt",
            "posted_at",
            "createdAt",
            "created_at",
          ]
        )
    )

  const draftCount =
    scopedStatements.filter(
      (statement) =>
        statusIs(
          readStatus(
            statement
          ),
          "draft"
        )
    ).length

  const issuedCount =
    scopedStatements.filter(
      (statement) =>
        Boolean(
          readTimestamp(
            statement,
            "issuedAt",
            "issued_at"
          )
        )
    ).length

  const patientResponsibility =
    sumRecordValues(
      scopedStatements,
      "patientResponsibilityCentavos",
      "patient_responsibility_centavos"
    )

  const paymentsPosted =
    scopedPayments
      .filter(
        (payment) =>
          statusIs(
            readStatus(payment),
            "posted"
          )
      )
      .reduce(
        (
          total,
          payment
        ) =>
          total +
          (
            readNumber(
              payment,
              "amountCentavos",
              "amount_centavos"
            ) ?? 0
          ),
        0
      )

  const refundsPosted =
    scopedRefunds
      .filter(
        (refund) =>
          statusIs(
            readStatus(refund),
            "posted"
          )
      )
      .reduce(
        (
          total,
          refund
        ) =>
          total +
          (
            readNumber(
              refund,
              "amountCentavos",
              "amount_centavos"
            ) ?? 0
          ),
        0
      )

  const openBalanceTotal =
    scopedStatements
      .filter(
        (statement) =>
          !statusIs(
            readStatus(
              statement
            ),
            "voided"
          )
      )
      .reduce(
        (
          total,
          statement
        ) =>
          total +
          (
            readNumber(
              statement,
              "balanceDueCentavos",
              "balance_due_centavos"
            ) ?? 0
          ),
        0
      )

  const creditBalanceTotal =
    scopedStatements.reduce(
      (
        total,
        statement
      ) =>
        total +
        (
          readNumber(
            statement,
            "creditBalanceCentavos",
            "credit_balance_centavos"
          ) ?? 0
        ),
      0
    )

  const statementRows =
    scopedStatements.flatMap<
      ReportDrilldownRow
    >(
      (
        statement,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            statement,
            "issuedAt",
            "issued_at",
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(statement)

        const balanceDue =
          readNumber(
            statement,
            "balanceDueCentavos",
            "balance_due_centavos"
          ) ?? 0

        const creditBalance =
          readNumber(
            statement,
            "creditBalanceCentavos",
            "credit_balance_centavos"
          ) ?? 0

        const reference =
          getRecordReference(
            statement,
            "statementNumber",
            "statement_number"
          )

        return [
          {
            id:
              `report-billing-statement-${getRecordId(
                statement,
                "billing-statement",
                index
              )}`,

            module: "billing",

            occurredAt,

            patientId:
              getPatientId(
                statement
              ),

            branchId:
              getBranchId(
                statement
              ),

            title:
              reference ??
              "Billing Statement",

            subtitle:
              getBranchName(
                statement
              ),

            reference,

            status:
              status || null,

            severity:
              status === "voided"
                ? "neutral"
                : balanceDue > 0
                  ? "warning"
                  : creditBalance > 0
                    ? "information"
                    : "success",

            amountCentavos:
              balanceDue,

            metadata: {
              patientResponsibilityCentavos:
                readNumber(
                  statement,
                  "patientResponsibilityCentavos",
                  "patient_responsibility_centavos"
                ),

              balanceDueCentavos:
                balanceDue,

              creditBalanceCentavos:
                creditBalance,

              issuedBy:
                readString(
                  statement,
                  "issuedBy",
                  "issued_by"
                ),
            },
          },
        ]
      }
    )

  const paymentRows =
    scopedPayments.flatMap<
      ReportDrilldownRow
    >(
      (
        payment,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            payment,
            "postedAt",
            "posted_at",
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(payment)

        const reference =
          getRecordReference(
            payment,
            "officialReceiptNumber",
            "official_receipt_number",
            "paymentNumber",
            "payment_number"
          )

        return [
          {
            id:
              `report-billing-payment-${getRecordId(
                payment,
                "billing-payment",
                index
              )}`,

            module: "billing",

            occurredAt,

            patientId:
              getPatientId(
                payment
              ),

            branchId:
              null,

            title:
              reference ??
              "Billing Payment",

            subtitle:
              readString(
                payment,
                "method"
              ),

            reference,

            status:
              status || null,

            severity:
              status ===
                "reversed"
                ? "warning"
                : "success",

            amountCentavos:
              readNumber(
                payment,
                "amountCentavos",
                "amount_centavos"
              ),

            metadata: {
              paymentNumber:
                readString(
                  payment,
                  "paymentNumber",
                  "payment_number"
                ),

              officialReceipt:
                readString(
                  payment,
                  "officialReceiptNumber",
                  "official_receipt_number"
                ),

              method:
                readString(
                  payment,
                  "method"
                ),

              postedBy:
                readString(
                  payment,
                  "postedBy",
                  "posted_by"
                ),
            },
          },
        ]
      }
    )

  const refundRows =
    scopedRefunds.flatMap<
      ReportDrilldownRow
    >(
      (
        refund,
        index
      ) => {
        const occurredAt =
          readTimestamp(
            refund,
            "postedAt",
            "posted_at",
            "createdAt",
            "created_at"
          )

        if (!occurredAt) {
          return []
        }

        const status =
          readStatus(refund)

        const amount =
          readNumber(
            refund,
            "amountCentavos",
            "amount_centavos"
          ) ?? 0

        const reference =
          getRecordReference(
            refund,
            "refundNumber",
            "refund_number"
          )

        return [
          {
            id:
              `report-billing-refund-${getRecordId(
                refund,
                "billing-refund",
                index
              )}`,

            module: "billing",

            occurredAt,

            patientId:
              getPatientId(
                refund
              ),

            branchId:
              null,

            title:
              reference ??
              "Billing Refund",

            subtitle:
              "Refund",

            reference,

            status:
              status || null,

            severity:
              status ===
                "reversed"
                ? "neutral"
                : "warning",

            amountCentavos:
              -Math.abs(amount),

            metadata: {
              reason:
                readString(
                  refund,
                  "reason"
                ),

              postedBy:
                readString(
                  refund,
                  "postedBy",
                  "posted_by"
                ),

              paymentId:
                readString(
                  refund,
                  "paymentId",
                  "payment_id"
                ),
            },
          },
        ]
      }
    )

  return {
    module: "billing",

    metrics: [
      createReportMetric({
        id:
          "billing-statements",

        label:
          "Statements",

        value:
          scopedStatements.length,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "billing-drafts",

        label:
          "Draft Statements",

        value:
          draftCount,

        tone:
          draftCount > 0
            ? "warning"
            : "neutral",
      }),

      createReportMetric({
        id:
          "billing-issued",

        label:
          "Issued Statements",

        value:
          issuedCount,

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "billing-patient-responsibility",

        label:
          "Patient Responsibility",

        value:
          patientResponsibility,

        format:
          "currency-centavos",

        tone:
          "information",
      }),

      createReportMetric({
        id:
          "billing-payments",

        label:
          "Payments Posted",

        value:
          paymentsPosted,

        format:
          "currency-centavos",

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "billing-refunds",

        label:
          "Refunds Posted",

        value:
          refundsPosted,

        format:
          "currency-centavos",

        tone:
          refundsPosted > 0
            ? "warning"
            : "neutral",
      }),

      createReportMetric({
        id:
          "billing-net-collections",

        label:
          "Net Collections",

        value:
          Math.max(
            0,
            paymentsPosted -
              refundsPosted
          ),

        format:
          "currency-centavos",

        tone:
          "success",
      }),

      createReportMetric({
        id:
          "billing-collection-rate",

        label:
          "Collection Rate",

        value:
          calculateReportPercentage(
            Math.max(
              0,
              paymentsPosted -
                refundsPosted
            ),
            patientResponsibility
          ),

        format:
          "percentage",

        tone:
          "information",

        precision: 1,
      }),

      createReportMetric({
        id:
          "billing-open-balance",

        label:
          "Open Balance",

        value:
          openBalanceTotal,

        format:
          "currency-centavos",

        tone:
          openBalanceTotal > 0
            ? "warning"
            : "success",
      }),

      createReportMetric({
        id:
          "billing-credit-balance",

        label:
          "Credit Balance",

        value:
          creditBalanceTotal,

        format:
          "currency-centavos",

        tone:
          creditBalanceTotal > 0
            ? "information"
            : "neutral",
      }),
    ],

    drilldownRows:
      sortReportDrilldownRows([
        ...statementRows,
        ...paymentRows,
        ...refundRows,
      ]),
  }
}

export function buildReportsSnapshot({
  filters,
  patients,
  appointments,
  consultations,
  laboratoryOrders,
  laboratoryResultSets,
  radiologyOrders,
  radiologyReports,
  pharmacyPrescriptions,
  billingStatements,
  billingPayments,
  billingRefunds,
}: BuildReportsSnapshotInput): ReportsSnapshot {
  const dateRange =
    resolveReportsDateRange(
      filters
    )

  const snapshots:
    ReportModuleSnapshot[] = [
    createPatientSnapshot({
      filters,
      dateRange,
      patients,
    }),

    createAppointmentSnapshot({
      filters,
      dateRange,
      appointments,
    }),

    createConsultationSnapshot({
      filters,
      dateRange,
      consultations,
    }),

    createLaboratorySnapshot({
      filters,
      dateRange,
      laboratoryOrders,
      laboratoryResultSets,
    }),

    createRadiologySnapshot({
      filters,
      dateRange,
      radiologyOrders,
      radiologyReports,
    }),

    createPharmacySnapshot({
      filters,
      dateRange,
      pharmacyPrescriptions,
    }),

    createBillingSnapshot({
      filters,
      dateRange,
      billingStatements,
      billingPayments,
      billingRefunds,
    }),
  ]

  const orderedSnapshots =
    REPORT_MODULE_ORDER.flatMap(
      (module) => {
        const snapshot =
          snapshots.find(
            (
              candidateSnapshot
            ) =>
              candidateSnapshot.module ===
              module
          )

        return snapshot
          ? [snapshot]
          : []
      }
    )

  return {
    generatedAt:
      new Date().toISOString(),

    filters: {
      ...filters,
    },

    dateRange,

    modules:
      orderedSnapshots,
  }
}
