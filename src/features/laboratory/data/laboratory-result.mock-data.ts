import type {
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"

/**
 * All result values, reference limits, flags,
 * staff names, and timestamps are synthetic
 * development data.
 */
export const MOCK_LABORATORY_RESULT_SETS: readonly LaboratoryResultSet[] =
  [
    {
      id:
        "mock-result-set-0002-cbc",

      orderId:
        "mock-lab-order-0002",

      orderItemId:
        "mock-lab-item-0002-cbc",

      patientId:
        "mock-patient-0004",

      testCode: "LAB-CBC",

      testName:
        "Complete Blood Count",

      status: "completed",

      version: 1,

      entries: [
        {
          id:
            "mock-result-entry-0002-hgb",

          resultSetId:
            "mock-result-set-0002-cbc",

          orderId:
            "mock-lab-order-0002",

          orderItemId:
            "mock-lab-item-0002-cbc",

          patientId:
            "mock-patient-0004",

          analyteCode: "CBC-HGB",
          analyteName: "Hemoglobin",

          valueType: "numeric",

          numericValue: 13.8,
          textValue: null,

          unit: "g/dL",

          referenceLow: 12,
          referenceHigh: 18,
          referenceText: null,

          flag: "normal",

          comment: null,

          enteredBy:
            "Synthetic Laboratory Analyst B",

          enteredAt:
            "2026-07-31T10:05:00+08:00",

          updatedBy:
            "Synthetic Laboratory Analyst B",

          updatedAt:
            "2026-07-31T10:05:00+08:00",
        },
        {
          id:
            "mock-result-entry-0002-hct",

          resultSetId:
            "mock-result-set-0002-cbc",

          orderId:
            "mock-lab-order-0002",

          orderItemId:
            "mock-lab-item-0002-cbc",

          patientId:
            "mock-patient-0004",

          analyteCode: "CBC-HCT",
          analyteName: "Hematocrit",

          valueType: "numeric",

          numericValue: 41.2,
          textValue: null,

          unit: "%",

          referenceLow: 36,
          referenceHigh: 54,
          referenceText: null,

          flag: "normal",

          comment: null,

          enteredBy:
            "Synthetic Laboratory Analyst B",

          enteredAt:
            "2026-07-31T10:05:00+08:00",

          updatedBy:
            "Synthetic Laboratory Analyst B",

          updatedAt:
            "2026-07-31T10:05:00+08:00",
        },
        {
          id:
            "mock-result-entry-0002-wbc",

          resultSetId:
            "mock-result-set-0002-cbc",

          orderId:
            "mock-lab-order-0002",

          orderItemId:
            "mock-lab-item-0002-cbc",

          patientId:
            "mock-patient-0004",

          analyteCode: "CBC-WBC",

          analyteName:
            "White Blood Cell Count",

          valueType: "numeric",

          numericValue: 12.4,
          textValue: null,

          unit: "×10⁹/L",

          referenceLow: 4,
          referenceHigh: 11,
          referenceText: null,

          flag: "high",

          comment:
            "Synthetic elevated result for flag-display testing.",

          enteredBy:
            "Synthetic Laboratory Analyst B",

          enteredAt:
            "2026-07-31T10:05:00+08:00",

          updatedBy:
            "Synthetic Laboratory Analyst B",

          updatedAt:
            "2026-07-31T10:05:00+08:00",
        },
        {
          id:
            "mock-result-entry-0002-plt",

          resultSetId:
            "mock-result-set-0002-cbc",

          orderId:
            "mock-lab-order-0002",

          orderItemId:
            "mock-lab-item-0002-cbc",

          patientId:
            "mock-patient-0004",

          analyteCode: "CBC-PLT",
          analyteName: "Platelet Count",

          valueType: "numeric",

          numericValue: 265,
          textValue: null,

          unit: "×10⁹/L",

          referenceLow: 150,
          referenceHigh: 450,
          referenceText: null,

          flag: "normal",

          comment: null,

          enteredBy:
            "Synthetic Laboratory Analyst B",

          enteredAt:
            "2026-07-31T10:05:00+08:00",

          updatedBy:
            "Synthetic Laboratory Analyst B",

          updatedAt:
            "2026-07-31T10:05:00+08:00",
        },
      ],

      performedBy:
        "Synthetic Laboratory Analyst B",

      performedAt:
        "2026-07-31T10:05:00+08:00",

      completedBy:
        "Synthetic Laboratory Analyst B",

      completedAt:
        "2026-07-31T10:20:00+08:00",

      verifiedBy: null,
      verifiedAt: null,
      verificationNote: null,

      releasedBy: null,
      releasedAt: null,
      releaseNote: null,

      createdAt:
        "2026-07-31T10:05:00+08:00",

      updatedAt:
        "2026-07-31T10:20:00+08:00",
    },
    {
      id:
        "mock-result-set-0002-crp",

      orderId:
        "mock-lab-order-0002",

      orderItemId:
        "mock-lab-item-0002-crp",

      patientId:
        "mock-patient-0004",

      testCode: "LAB-CRP",

      testName:
        "C-Reactive Protein",

      status: "completed",

      version: 1,

      entries: [
        {
          id:
            "mock-result-entry-0002-crp",

          resultSetId:
            "mock-result-set-0002-crp",

          orderId:
            "mock-lab-order-0002",

          orderItemId:
            "mock-lab-item-0002-crp",

          patientId:
            "mock-patient-0004",

          analyteCode: "CRP-SERUM",

          analyteName:
            "C-Reactive Protein",

          valueType: "numeric",

          numericValue: 8.5,
          textValue: null,

          unit: "mg/L",

          referenceLow: 0,
          referenceHigh: 5,
          referenceText: null,

          flag: "high",

          comment:
            "Synthetic high result for interface testing.",

          enteredBy:
            "Synthetic Laboratory Analyst B",

          enteredAt:
            "2026-07-31T10:10:00+08:00",

          updatedBy:
            "Synthetic Laboratory Analyst B",

          updatedAt:
            "2026-07-31T10:10:00+08:00",
        },
      ],

      performedBy:
        "Synthetic Laboratory Analyst B",

      performedAt:
        "2026-07-31T10:10:00+08:00",

      completedBy:
        "Synthetic Laboratory Analyst B",

      completedAt:
        "2026-07-31T10:20:00+08:00",

      verifiedBy: null,
      verifiedAt: null,
      verificationNote: null,

      releasedBy: null,
      releasedAt: null,
      releaseNote: null,

      createdAt:
        "2026-07-31T10:10:00+08:00",

      updatedAt:
        "2026-07-31T10:20:00+08:00",
    },
  ]
