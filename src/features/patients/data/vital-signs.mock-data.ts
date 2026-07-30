import type { VitalSignsRecord } from "@/features/patients/types/vital-signs.types"
import {
  buildNotEvaluatedVitalSignInterpretations,
  calculateBmi,
} from "@/features/patients/utils/vital-signs.utils"

type MockVitalSignsSeed = Omit<
  VitalSignsRecord,
  "bmi" | "interpretations"
>

/**
 * All vital-sign records in this file are synthetic.
 * They do not represent real patients or clinical encounters.
 */
const MOCK_VITAL_SIGNS_SEEDS: readonly MockVitalSignsSeed[] =
  [
    {
      id: "mock-vitals-0001",
      patientId: "mock-patient-0001",
      measuredAt: "2026-07-27T08:25:00+08:00",
      context: "triage",
      systolicBloodPressureMmHg: 128,
      diastolicBloodPressureMmHg: 82,
      bloodPressurePosition: "sitting",
      heartRateBpm: 76,
      respiratoryRatePerMinute: 18,
      temperatureCelsius: 36.7,
      temperatureSite: "oral",
      oxygenSaturationPercent: 98,
      oxygenSupport: "room-air",
      supplementalOxygenLitersPerMinute: null,
      heightCm: 160,
      weightKg: 62,
      painScore: 2,
      notes:
        "Synthetic triage measurement set for UI testing.",
      recordStatus: "current",
      recordedBy: "Dr. Maria Santos",
      recordedAt: "2026-07-27T08:27:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2026-07-27T08:27:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-vitals-0002",
      patientId: "mock-patient-0001",
      measuredAt: "2026-06-20T10:55:00+08:00",
      context: "routine",
      systolicBloodPressureMmHg: 124,
      diastolicBloodPressureMmHg: 80,
      bloodPressurePosition: "sitting",
      heartRateBpm: 72,
      respiratoryRatePerMinute: 17,
      temperatureCelsius: 36.6,
      temperatureSite: "temporal",
      oxygenSaturationPercent: 99,
      oxygenSupport: "room-air",
      supplementalOxygenLitersPerMinute: null,
      heightCm: 160,
      weightKg: 61.5,
      painScore: 0,
      notes:
        "Synthetic routine measurement set.",
      recordStatus: "current",
      recordedBy: "Dr. Maria Santos",
      recordedAt: "2026-06-20T10:57:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2026-06-20T10:57:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-vitals-0003",
      patientId: "mock-patient-0001",
      measuredAt: "2026-04-02T09:10:00+08:00",
      context: "follow-up",
      systolicBloodPressureMmHg: 126,
      diastolicBloodPressureMmHg: 81,
      bloodPressurePosition: "sitting",
      heartRateBpm: 75,
      respiratoryRatePerMinute: 18,
      temperatureCelsius: null,
      temperatureSite: "not-recorded",
      oxygenSaturationPercent: 98,
      oxygenSupport: "room-air",
      supplementalOxygenLitersPerMinute: null,
      heightCm: null,
      weightKg: null,
      painScore: 1,
      notes:
        "Archived synthetic duplicate measurement set.",
      recordStatus: "archived",
      recordedBy: "Dr. Maria Santos",
      recordedAt: "2026-04-02T09:12:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2026-04-02T09:30:00+08:00",
      archivedAt: "2026-04-02T09:30:00+08:00",
      archivedBy: "Dr. Maria Santos",
      archiveReason:
        "Duplicate synthetic measurement entry.",
    },
    {
      id: "mock-vitals-0004",
      patientId: "mock-patient-0002",
      measuredAt: "2026-07-08T14:05:00+08:00",
      context: "triage",
      systolicBloodPressureMmHg: 132,
      diastolicBloodPressureMmHg: 84,
      bloodPressurePosition: "sitting",
      heartRateBpm: 80,
      respiratoryRatePerMinute: 19,
      temperatureCelsius: 36.8,
      temperatureSite: "oral",
      oxygenSaturationPercent: 97,
      oxygenSupport: "room-air",
      supplementalOxygenLitersPerMinute: null,
      heightCm: 171,
      weightKg: 76,
      painScore: 3,
      notes:
        "Synthetic multi-patient vital-sign test record.",
      recordStatus: "current",
      recordedBy: "Dr. Maria Santos",
      recordedAt: "2026-07-08T14:07:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2026-07-08T14:07:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-vitals-0005",
      patientId: "mock-patient-0003",
      measuredAt: "2025-11-18T10:40:00+08:00",
      context: "follow-up",
      systolicBloodPressureMmHg: 118,
      diastolicBloodPressureMmHg: 76,
      bloodPressurePosition: "sitting",
      heartRateBpm: 70,
      respiratoryRatePerMinute: 16,
      temperatureCelsius: 36.5,
      temperatureSite: "temporal",
      oxygenSaturationPercent: 99,
      oxygenSupport: "room-air",
      supplementalOxygenLitersPerMinute: null,
      heightCm: 155,
      weightKg: 54,
      painScore: 0,
      notes:
        "Synthetic follow-up measurement set.",
      recordStatus: "current",
      recordedBy: "Dr. Maria Santos",
      recordedAt: "2025-11-18T10:43:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2025-11-18T10:43:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
    {
      id: "mock-vitals-0006",
      patientId: "mock-patient-0011",
      measuredAt: "2026-07-23T15:40:00+08:00",
      context: "triage",
      systolicBloodPressureMmHg: 121,
      diastolicBloodPressureMmHg: 79,
      bloodPressurePosition: "sitting",
      heartRateBpm: 78,
      respiratoryRatePerMinute: 18,
      temperatureCelsius: 36.9,
      temperatureSite: "tympanic",
      oxygenSaturationPercent: 98,
      oxygenSupport: "room-air",
      supplementalOxygenLitersPerMinute: null,
      heightCm: 168,
      weightKg: 68,
      painScore: 1,
      notes:
        "Synthetic vital-sign record for another patient.",
      recordStatus: "current",
      recordedBy: "Dr. Maria Santos",
      recordedAt: "2026-07-23T15:42:00+08:00",
      updatedBy: "Dr. Maria Santos",
      updatedAt: "2026-07-23T15:42:00+08:00",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
  ]

export const MOCK_VITAL_SIGNS_RECORDS: readonly VitalSignsRecord[] =
  MOCK_VITAL_SIGNS_SEEDS.map((seed) => {
    const bmi = calculateBmi(
      seed.heightCm,
      seed.weightKg
    )

    const recordWithBmi = {
      ...seed,
      bmi,
    }

    return {
      ...recordWithBmi,
      interpretations:
        buildNotEvaluatedVitalSignInterpretations(
          recordWithBmi
        ),
    }
  })
