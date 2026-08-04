export const LABORATORY_RESULT_VALUE_TYPES = [
  "numeric",
  "text",
  "qualitative",
] as const

export type LaboratoryResultValueType =
  (typeof LABORATORY_RESULT_VALUE_TYPES)[number]

export const LABORATORY_RESULT_FLAGS = [
  "normal",
  "low",
  "high",
  "critical-low",
  "critical-high",
  "abnormal",
  "not-applicable",
] as const

export type LaboratoryResultFlag =
  (typeof LABORATORY_RESULT_FLAGS)[number]

export const LABORATORY_RESULT_STATUSES = [
  "draft",
  "completed",
  "verified",
  "released",
] as const

export type LaboratoryResultStatus =
  (typeof LABORATORY_RESULT_STATUSES)[number]

export interface LaboratoryAnalyteDefinition {
  code: string
  testCode: string

  name: string
  valueType: LaboratoryResultValueType

  unit: string | null

  referenceLow: number | null
  referenceHigh: number | null
  referenceText: string | null

  criticalLow: number | null
  criticalHigh: number | null

  qualitativeOptions:
    readonly string[]

  normalQualitativeValues:
    readonly string[]

  decimalPlaces: number
}

export interface LaboratoryResultEntry {
  id: string

  resultSetId: string
  orderId: string
  orderItemId: string
  patientId: string

  analyteCode: string
  analyteName: string

  valueType: LaboratoryResultValueType

  numericValue: number | null
  textValue: string | null

  unit: string | null

  referenceLow: number | null
  referenceHigh: number | null
  referenceText: string | null

  flag: LaboratoryResultFlag

  comment: string | null

  enteredBy: string
  enteredAt: string

  updatedBy: string
  updatedAt: string
}

export interface LaboratoryResultSet {
  id: string

  orderId: string
  orderItemId: string
  patientId: string

  testCode: string
  testName: string

  status: LaboratoryResultStatus
  version: number

  entries: LaboratoryResultEntry[]

  performedBy: string
  performedAt: string

  completedBy: string | null
  completedAt: string | null

  verifiedBy: string | null
  verifiedAt: string | null
  verificationNote: string | null

  releasedBy: string | null
  releasedAt: string | null
  releaseNote: string | null

  createdAt: string
  updatedAt: string
}
