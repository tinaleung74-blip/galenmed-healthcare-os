"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { MOCK_PATIENTS } from "@/features/patients/data/patient.mock-data"
import type { PatientFormValues } from "@/features/patients/schemas/patient.schema"
import type { Patient } from "@/features/patients/types/patient.types"
import { generateMedicalRecordNumber } from "@/features/patients/utils/patient.utils"

interface PatientContextValue {
  patients: Patient[]
  createPatient: (values: PatientFormValues) => Patient
  updatePatient: (
    patientId: string,
    values: PatientFormValues
  ) => Patient
  archivePatient: (patientId: string) => Patient
}

const PatientContext =
  createContext<PatientContextValue | null>(null)

interface PatientProviderProps {
  children: ReactNode
}

function createTemporaryPatientId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `patient-${globalThis.crypto.randomUUID()}`
  }

  return `patient-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function getBranchOrThrow(branchId: string) {
  const branch = GALENMED_BRANCHES.find(
    (candidateBranch) =>
      candidateBranch.id === branchId
  )

  if (!branch) {
    throw new Error("Unknown GalenMed branch.")
  }

  return branch
}

export function PatientProvider({
  children,
}: PatientProviderProps) {
  const [patients, setPatients] = useState<Patient[]>(
    () => [...MOCK_PATIENTS]
  )

  const patientsRef = useRef<Patient[]>(patients)

  const createPatient = useCallback(
    (values: PatientFormValues): Patient => {
      const branch = getBranchOrThrow(values.branchId)
      const currentPatients = patientsRef.current
      const now = new Date().toISOString()

      const newPatient: Patient = {
        id: createTemporaryPatientId(),
        medicalRecordNumber:
          generateMedicalRecordNumber(currentPatients),
        firstName: values.firstName.trim(),
        middleName: values.middleName?.trim() || null,
        lastName: values.lastName.trim(),
        dateOfBirth: values.dateOfBirth,
        biologicalSex: values.biologicalSex,
        mobileNumber: values.mobileNumber.trim(),
        emailAddress: values.emailAddress.trim() || null,
        branchId: branch.id,
        branchName: branch.name,
        address: values.address.trim(),
        emergencyContactName:
          values.emergencyContactName.trim(),
        emergencyContactNumber:
          values.emergencyContactNumber.trim(),
        status: "active",
        lastVisitAt: null,
        createdAt: now,
        updatedAt: now,
      }

      const nextPatients = [
        newPatient,
        ...currentPatients,
      ]

      patientsRef.current = nextPatients
      setPatients(nextPatients)

      return newPatient
    },
    []
  )

  const updatePatient = useCallback(
    (
      patientId: string,
      values: PatientFormValues
    ): Patient => {
      const branch = getBranchOrThrow(values.branchId)
      const currentPatients = patientsRef.current

      const patientIndex = currentPatients.findIndex(
        (patient) => patient.id === patientId
      )

      if (patientIndex === -1) {
        throw new Error("Patient record was not found.")
      }

      const existingPatient =
        currentPatients[patientIndex]

      const updatedPatient: Patient = {
        ...existingPatient,
        firstName: values.firstName.trim(),
        middleName: values.middleName?.trim() || null,
        lastName: values.lastName.trim(),
        dateOfBirth: values.dateOfBirth,
        biologicalSex: values.biologicalSex,
        mobileNumber: values.mobileNumber.trim(),
        emailAddress: values.emailAddress.trim() || null,
        branchId: branch.id,
        branchName: branch.name,
        address: values.address.trim(),
        emergencyContactName:
          values.emergencyContactName.trim(),
        emergencyContactNumber:
          values.emergencyContactNumber.trim(),
        updatedAt: new Date().toISOString(),
      }

      const nextPatients = currentPatients.map(
        (patient) =>
          patient.id === patientId
            ? updatedPatient
            : patient
      )

      patientsRef.current = nextPatients
      setPatients(nextPatients)

      return updatedPatient
    },
    []
  )

  const archivePatient = useCallback(
    (patientId: string): Patient => {
      const currentPatients = patientsRef.current

      const existingPatient = currentPatients.find(
        (patient) => patient.id === patientId
      )

      if (!existingPatient) {
        throw new Error("Patient record was not found.")
      }

      if (existingPatient.status === "archived") {
        return existingPatient
      }

      const archivedPatient: Patient = {
        ...existingPatient,
        status: "archived",
        updatedAt: new Date().toISOString(),
      }

      const nextPatients = currentPatients.map(
        (patient) =>
          patient.id === patientId
            ? archivedPatient
            : patient
      )

      patientsRef.current = nextPatients
      setPatients(nextPatients)

      return archivedPatient
    },
    []
  )

  const contextValue = useMemo<PatientContextValue>(
    () => ({
      patients,
      createPatient,
      updatePatient,
      archivePatient,
    }),
    [
      patients,
      createPatient,
      updatePatient,
      archivePatient,
    ]
  )

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatients(): PatientContextValue {
  const context = useContext(PatientContext)

  if (!context) {
    throw new Error(
      "usePatients must be used inside PatientProvider."
    )
  }

  return context
}
