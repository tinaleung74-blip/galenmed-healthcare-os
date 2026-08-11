import {
  DEFAULT_PHILHEALTH_MODULE_SETTINGS,
} from "@/features/philhealth/constants/philhealth.constants"
import type {
  PhilHealthState,
} from "@/features/philhealth/types/philhealth.types"

export const INITIAL_PHILHEALTH_STATE:
  PhilHealthState = {
  schemaVersion: 1,
  revision: 1,

  profiles: [],
  claims: [],
  auditRecords: [],

  settings: {
    ...DEFAULT_PHILHEALTH_MODULE_SETTINGS,
  },

  updatedAt:
    "2026-08-10T08:00:00+08:00",

  updatedBy:
    "GalenMed System",
}
