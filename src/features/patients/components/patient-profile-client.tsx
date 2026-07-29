"use client"

import { useState } from "react"
import { toast } from "sonner"

import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog"
import { PatientProfileHeader } from "@/features/patients/components/patient-profile-header"
import { PatientProfileNavigation } from "@/features/patients/components/patient-profile-navigation"
import { PatientProfileNotFound } from "@/features/patients/components/patient-profile-not-found"
import { PatientProfileOverview } from "@/features/patients/components/patient-profile-overview"
import { PatientProfileSectionPlaceholder } from "@/features/patients/components/patient-profile-section-placeholder"
import {
  PATIENT_PROFILE_SECTIONS,
  type PatientProfileSection,
} from "@/features/patients/constants/patient-profile.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { PatientFormValues } from "@/features/patients/schemas/patient.schema"
import { getPatientFullName } from "@/features/patients/utils/patient.utils"

interface PatientProfileClientProps {
  patientReference: string
  activeSection: PatientProfileSection
}

export function PatientProfileClient({
  patientReference,
  activeSection,
}: PatientProfileClientProps) {
  const { patients, updatePatient } = usePatients()

  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false)

  const patient =
    patients.find(
      (candidatePatient) =>
        candidatePatient.medicalRecordNumber ===
          patientReference ||
        candidatePatient.id === patientReference
    ) ?? null

  if (!patient) {
    return <PatientProfileNotFound />
  }

  const patientId = patient.id

  const sectionDefinition =
    PATIENT_PROFILE_SECTIONS.find(
      (section) => section.id === activeSection
    ) ?? PATIENT_PROFILE_SECTIONS[0]

  async function handleUpdatePatient(
    values: PatientFormValues
  ): Promise<void> {
    const updatedPatient = updatePatient(
      patientId,
      values
    )

    toast.success("Patient record updated", {
      description: `${getPatientFullName(
        updatedPatient
      )} was updated successfully.`,
    })
  }

  return (
    <>
      <div className="space-y-6">
        <PatientProfileHeader
          patient={patient}
          onEditPatient={() =>
            setIsEditDialogOpen(true)
          }
        />

        <PatientProfileNavigation
          patientReference={
            patient.medicalRecordNumber
          }
          activeSection={activeSection}
        />

        {activeSection === "overview" ? (
          <PatientProfileOverview patient={patient} />
        ) : (
          <PatientProfileSectionPlaceholder
            title={sectionDefinition.label}
            description={sectionDefinition.description}
          />
        )}
      </div>

      <PatientFormDialog
        mode="edit"
        patient={patient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmitPatient={handleUpdatePatient}
      />
    </>
  )
}
