import {
  GALENMED_BRANCHES,
  type GalenMedBranchId,
} from "@/features/patients/constants/patient.constants"
import type {
  BiologicalSex,
  Patient,
  PatientStatus,
} from "@/features/patients/types/patient.types"

interface MockPatientSeed {
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: string
  biologicalSex: BiologicalSex
  branchId: GalenMedBranchId
  status: PatientStatus
  lastVisitAt: string | null
  createdAt: string
}

/**
 * All records in this file are synthetic and intended only for UI development.
 * They do not represent real patients or real clinical encounters.
 */
const MOCK_PATIENT_SEEDS: readonly MockPatientSeed[] = [
  {
    firstName: "Amihan",
    middleName: "Sinag",
    lastName: "Luntian",
    dateOfBirth: "1991-04-12",
    biologicalSex: "female",
    branchId: "branch-makati",
    status: "active",
    lastVisitAt: "2026-07-27T08:30:00+08:00",
    createdAt: "2024-02-05T09:15:00+08:00",
  },
  {
    firstName: "Bayani",
    middleName: null,
    lastName: "Mapayapa",
    dateOfBirth: "1984-09-03",
    biologicalSex: "male",
    branchId: "branch-makati",
    status: "active",
    lastVisitAt: "2026-07-08T14:10:00+08:00",
    createdAt: "2024-03-18T11:20:00+08:00",
  },
  {
    firstName: "Cielo",
    middleName: "Mayumi",
    lastName: "Sampaguita",
    dateOfBirth: "1976-02-28",
    biologicalSex: "female",
    branchId: "branch-makati",
    status: "inactive",
    lastVisitAt: "2025-11-18T10:45:00+08:00",
    createdAt: "2023-08-11T15:05:00+08:00",
  },
  {
    firstName: "Dalisay",
    middleName: null,
    lastName: "Sinag",
    dateOfBirth: "2002-11-21",
    biologicalSex: "female",
    branchId: "branch-makati",
    status: "active",
    lastVisitAt: null,
    createdAt: "2026-01-12T13:40:00+08:00",
  },
  {
    firstName: "Elio",
    middleName: "Alon",
    lastName: "Tala",
    dateOfBirth: "1968-06-14",
    biologicalSex: "male",
    branchId: "branch-makati",
    status: "archived",
    lastVisitAt: "2024-04-09T09:25:00+08:00",
    createdAt: "2023-02-22T08:50:00+08:00",
  },
  {
    firstName: "Faye",
    middleName: "Diwa",
    lastName: "Hiraya",
    dateOfBirth: "1998-01-09",
    biologicalSex: "female",
    branchId: "branch-makati",
    status: "active",
    lastVisitAt: "2026-06-30T16:20:00+08:00",
    createdAt: "2025-06-03T10:10:00+08:00",
  },
  {
    firstName: "Gino",
    middleName: null,
    lastName: "Lakbay",
    dateOfBirth: "1955-12-02",
    biologicalSex: "male",
    branchId: "branch-makati",
    status: "inactive",
    lastVisitAt: "2025-08-22T11:35:00+08:00",
    createdAt: "2024-07-19T09:45:00+08:00",
  },
  {
    firstName: "Hana",
    middleName: "Bituin",
    lastName: "Diwa",
    dateOfBirth: "2013-03-17",
    biologicalSex: "female",
    branchId: "branch-makati",
    status: "active",
    lastVisitAt: "2026-07-15T13:15:00+08:00",
    createdAt: "2025-01-24T14:30:00+08:00",
  },
  {
    firstName: "Ivo",
    middleName: "Silay",
    lastName: "Alon",
    dateOfBirth: "1989-07-30",
    biologicalSex: "male",
    branchId: "branch-makati",
    status: "active",
    lastVisitAt: "2026-05-25T10:00:00+08:00",
    createdAt: "2024-12-02T08:20:00+08:00",
  },
  {
    firstName: "Jessa",
    middleName: null,
    lastName: "Liwayway",
    dateOfBirth: "1947-10-05",
    biologicalSex: "female",
    branchId: "branch-makati",
    status: "archived",
    lastVisitAt: null,
    createdAt: "2023-04-17T12:00:00+08:00",
  },
  {
    firstName: "Kian",
    middleName: "Tatag",
    lastName: "Giting",
    dateOfBirth: "1993-05-08",
    biologicalSex: "male",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2026-07-23T15:45:00+08:00",
    createdAt: "2025-01-08T09:10:00+08:00",
  },
  {
    firstName: "Lira",
    middleName: null,
    lastName: "Mayumi",
    dateOfBirth: "2000-08-19",
    biologicalSex: "female",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2026-06-18T08:40:00+08:00",
    createdAt: "2025-09-01T14:05:00+08:00",
  },
  {
    firstName: "Miro",
    middleName: "Dagat",
    lastName: "Silangan",
    dateOfBirth: "1981-01-27",
    biologicalSex: "male",
    branchId: "branch-quezon-city",
    status: "inactive",
    lastVisitAt: "2025-10-12T11:25:00+08:00",
    createdAt: "2023-11-06T13:30:00+08:00",
  },
  {
    firstName: "Naya",
    middleName: "Hiyas",
    lastName: "Sinta",
    dateOfBirth: "2018-12-11",
    biologicalSex: "female",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2026-07-02T09:50:00+08:00",
    createdAt: "2025-03-14T10:35:00+08:00",
  },
  {
    firstName: "Orly",
    middleName: null,
    lastName: "Lakas",
    dateOfBirth: "1971-03-06",
    biologicalSex: "male",
    branchId: "branch-quezon-city",
    status: "archived",
    lastVisitAt: "2023-09-13T16:00:00+08:00",
    createdAt: "2023-01-10T08:15:00+08:00",
  },
  {
    firstName: "Pia",
    middleName: "Gunita",
    lastName: "Marikit",
    dateOfBirth: "1987-11-29",
    biologicalSex: "female",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2026-04-29T14:20:00+08:00",
    createdAt: "2024-05-27T10:50:00+08:00",
  },
  {
    firstName: "Quin",
    middleName: null,
    lastName: "Balangaw",
    dateOfBirth: "1996-06-25",
    biologicalSex: "intersex",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2026-05-10T12:30:00+08:00",
    createdAt: "2025-02-18T11:10:00+08:00",
  },
  {
    firstName: "Rina",
    middleName: "Mutya",
    lastName: "Payapa",
    dateOfBirth: "1962-09-16",
    biologicalSex: "female",
    branchId: "branch-quezon-city",
    status: "inactive",
    lastVisitAt: null,
    createdAt: "2023-07-03T09:30:00+08:00",
  },
  {
    firstName: "Santi",
    middleName: "Bayani",
    lastName: "Baybay",
    dateOfBirth: "2008-02-20",
    biologicalSex: "male",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2026-07-20T10:15:00+08:00",
    createdAt: "2024-09-09T15:25:00+08:00",
  },
  {
    firstName: "Talia",
    middleName: null,
    lastName: "Ligaya",
    dateOfBirth: "1990-10-31",
    biologicalSex: "female",
    branchId: "branch-quezon-city",
    status: "active",
    lastVisitAt: "2025-12-15T13:55:00+08:00",
    createdAt: "2025-04-21T08:45:00+08:00",
  },
  {
    firstName: "Ulan",
    middleName: "Agos",
    lastName: "Marilag",
    dateOfBirth: "1985-04-01",
    biologicalSex: "male",
    branchId: "branch-cebu",
    status: "active",
    lastVisitAt: "2026-07-25T09:05:00+08:00",
    createdAt: "2024-01-29T14:20:00+08:00",
  },
  {
    firstName: "Vina",
    middleName: null,
    lastName: "Luningning",
    dateOfBirth: "1994-07-14",
    biologicalSex: "female",
    branchId: "branch-cebu",
    status: "active",
    lastVisitAt: "2026-06-05T11:45:00+08:00",
    createdAt: "2025-10-06T10:30:00+08:00",
  },
  {
    firstName: "Wilo",
    middleName: "Tala",
    lastName: "Malaya",
    dateOfBirth: "1979-12-24",
    biologicalSex: "male",
    branchId: "branch-cebu",
    status: "inactive",
    lastVisitAt: "2025-06-30T15:10:00+08:00",
    createdAt: "2023-06-19T09:55:00+08:00",
  },
  {
    firstName: "Xandra",
    middleName: "Hiraya",
    lastName: "Bughaw",
    dateOfBirth: "2005-09-09",
    biologicalSex: "female",
    branchId: "branch-cebu",
    status: "active",
    lastVisitAt: null,
    createdAt: "2026-02-02T13:15:00+08:00",
  },
  {
    firstName: "Yani",
    middleName: null,
    lastName: "Dapithapon",
    dateOfBirth: "1959-05-17",
    biologicalSex: "unknown",
    branchId: "branch-cebu",
    status: "archived",
    lastVisitAt: "2022-02-11T10:40:00+08:00",
    createdAt: "2022-01-18T08:30:00+08:00",
  },
  {
    firstName: "Zia",
    middleName: "Sinta",
    lastName: "Hiyas",
    dateOfBirth: "1988-02-13",
    biologicalSex: "female",
    branchId: "branch-cebu",
    status: "active",
    lastVisitAt: "2026-03-22T14:35:00+08:00",
    createdAt: "2024-08-12T12:05:00+08:00",
  },
  {
    firstName: "Arlo",
    middleName: null,
    lastName: "Salinlahi",
    dateOfBirth: "2016-01-26",
    biologicalSex: "male",
    branchId: "branch-cebu",
    status: "active",
    lastVisitAt: "2026-07-11T08:55:00+08:00",
    createdAt: "2025-05-05T11:40:00+08:00",
  },
  {
    firstName: "Bela",
    middleName: "Diwa",
    lastName: "Pagasa",
    dateOfBirth: "1973-08-07",
    biologicalSex: "female",
    branchId: "branch-cebu",
    status: "inactive",
    lastVisitAt: "2025-09-05T16:15:00+08:00",
    createdAt: "2023-09-25T10:25:00+08:00",
  },
  {
    firstName: "Ciro",
    middleName: "Alon",
    lastName: "Tanyag",
    dateOfBirth: "1999-03-30",
    biologicalSex: "male",
    branchId: "branch-cebu",
    status: "active",
    lastVisitAt: "2026-05-31T13:05:00+08:00",
    createdAt: "2025-07-16T09:35:00+08:00",
  },
  {
    firstName: "Dina",
    middleName: null,
    lastName: "Alab",
    dateOfBirth: "1983-06-18",
    biologicalSex: "female",
    branchId: "branch-cebu",
    status: "archived",
    lastVisitAt: null,
    createdAt: "2023-12-04T14:50:00+08:00",
  },
]

const branchById = new Map(
  GALENMED_BRANCHES.map((branch) => [branch.id, branch])
)

const missingMobileIndexes = new Set([2, 9, 17, 24, 29])

function getBranch(branchId: GalenMedBranchId) {
  const branch = branchById.get(branchId)

  if (!branch) {
    throw new Error(`Unknown mock GalenMed branch: ${branchId}`)
  }

  return branch
}

function createMockPatient(
  seed: MockPatientSeed,
  index: number
): Patient {
  const recordNumber = index + 1
  const shortSequence = String(recordNumber).padStart(4, "0")
  const mrnSequence = String(recordNumber).padStart(6, "0")
  const branch = getBranch(seed.branchId)

  const mobileNumber = missingMobileIndexes.has(index)
    ? null
    : `0917${String(recordNumber).padStart(7, "0")}`

  const emailAddress =
    index % 4 === 0
      ? null
      : `patient.${shortSequence}@example.test`

  return {
    id: `mock-patient-${shortSequence}`,
    medicalRecordNumber: `GM-2026-${mrnSequence}`,
    firstName: seed.firstName,
    middleName: seed.middleName,
    lastName: seed.lastName,
    dateOfBirth: seed.dateOfBirth,
    biologicalSex: seed.biologicalSex,
    mobileNumber,
    emailAddress,
    branchId: branch.id,
    branchName: branch.name,
    address: `Mock Residence ${shortSequence}, ${branch.city}`,
    emergencyContactName: `Sample Contact ${shortSequence}`,
    emergencyContactNumber: `0918${String(
      recordNumber + 100
    ).padStart(7, "0")}`,
    status: seed.status,
    lastVisitAt: seed.lastVisitAt,
    createdAt: seed.createdAt,
    updatedAt: seed.lastVisitAt ?? seed.createdAt,
  }
}

export const MOCK_PATIENTS: readonly Patient[] =
  MOCK_PATIENT_SEEDS.map(createMockPatient)
