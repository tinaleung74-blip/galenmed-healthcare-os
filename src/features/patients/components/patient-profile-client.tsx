"use client"

import { useState } from "react"
import { toast } from "sonner"

import { MedicalHistoryWorkspace } from "@/features/patients/components/medical-history-workspace"
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

  const currentPatient = patient
  const patientId = currentPatient.id

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

  function renderActiveSection() {
    if (activeSection === "overview") {
      return (
        <PatientProfileOverview
          patient={currentPatient}
        />
      )
    }

    if (activeSection === "medical-history") {
      return (
        <MedicalHistoryWorkspace
          patient={currentPatient}
        />
      )
    }

    return (
      <PatientProfileSectionPlaceholder
        title={sectionDefinition.label}
        description={sectionDefinition.description}
      />
    )
  }

  return (
    <>
      <div className="space-y-6">
        <PatientProfileHeader
          patient={currentPatient}
          onEditPatient={() =>
            setIsEditDialogOpen(true)
          }
        />

        <PatientProfileNavigation
          patientReference={
            currentPatient.medicalRecordNumber
          }
          activeSection={activeSection}
        />

        {renderActiveSection()}
      </div>

      <PatientFormDialog
        mode="edit"
        patient={currentPatient}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmitPatient={handleUpdatePatient}
      />
    </>
  )
}
