"use client"

import {
  useCallback,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PatientArchiveDialog } from "@/features/patients/components/patient-archive-dialog"
import { PatientDetailsSheet } from "@/features/patients/components/patient-details-sheet"
import { PatientFormDialog } from "@/features/patients/components/patient-form-dialog"
import { PatientTable } from "@/features/patients/components/patient-table"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { PatientFormValues } from "@/features/patients/schemas/patient.schema"
import type { Patient } from "@/features/patients/types/patient.types"
import { getPatientFullName } from "@/features/patients/utils/patient.utils"

interface PatientRegistryProps {
  initialSearch?: string
}

const patientCountFormatter =
  new Intl.NumberFormat("en-PH")

export function PatientRegistry({
  initialSearch = "",
}: PatientRegistryProps) {
  const router = useRouter()

  const {
    patients,
    createPatient,
    updatePatient,
    archivePatient,
  } = usePatients()

  const [
    isNewPatientDialogOpen,
    setIsNewPatientDialogOpen,
  ] = useState(false)

  const [
    viewedPatientId,
    setViewedPatientId,
  ] = useState<string | null>(null)

  const [
    editingPatientId,
    setEditingPatientId,
  ] = useState<string | null>(null)

  const [
    archivingPatientId,
    setArchivingPatientId,
  ] = useState<string | null>(null)

  const viewedPatient =
    patients.find(
      (patient) =>
        patient.id === viewedPatientId
    ) ?? null

  const editingPatient =
    patients.find(
      (patient) =>
        patient.id === editingPatientId
    ) ?? null

  const archivingPatient =
    patients.find(
      (patient) =>
        patient.id === archivingPatientId
    ) ?? null

  const handleViewPatient = useCallback(
    (patient: Patient) => {
      setViewedPatientId(patient.id)
    },
    []
  )

  const handleOpenPatientProfile = useCallback(
    (patient: Patient) => {
      setViewedPatientId(null)

      router.push(
        `/patients/${encodeURIComponent(
          patient.medicalRecordNumber
        )}`
      )
    },
    [router]
  )

  const handleEditPatient = useCallback(
    (patient: Patient) => {
      setEditingPatientId(patient.id)
    },
    []
  )

  const handleArchiveRequest = useCallback(
    (patient: Patient) => {
      if (patient.status !== "archived") {
        setArchivingPatientId(patient.id)
      }
    },
    []
  )

  async function handleCreatePatient(
    values: PatientFormValues
  ): Promise<void> {
    const newPatient = createPatient(values)

    toast.success("Patient registered", {
      description: `${getPatientFullName(
        newPatient
      )} was assigned ${
        newPatient.medicalRecordNumber
      }.`,
    })
  }

  async function handleUpdatePatient(
    values: PatientFormValues
  ): Promise<void> {
    if (!editingPatient) {
      throw new Error(
        "No patient was selected for editing."
      )
    }

    const updatedPatient = updatePatient(
      editingPatient.id,
      values
    )

    toast.success("Patient record updated", {
      description: `${getPatientFullName(
        updatedPatient
      )} was updated successfully.`,
    })
  }

  function handleConfirmArchive() {
    if (!archivingPatient) {
      return
    }

    try {
      const archivedPatient = archivePatient(
        archivingPatient.id
      )

      toast.success("Patient archived", {
        description: `${getPatientFullName(
          archivedPatient
        )} remains available for historical reference.`,
      })

      setArchivingPatientId(null)
    } catch {
      toast.error("Unable to archive patient", {
        description:
          "The patient record could not be archived.",
      })
    }
  }

  function editPatientFromDetails(
    patient: Patient
  ) {
    setViewedPatientId(null)
    setEditingPatientId(patient.id)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                <Users
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Patients
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Search and manage patient demographic
                  records across GalenMed branches.
                </p>

                <p className="mt-2 text-xs font-medium text-teal-700">
                  {patientCountFormatter.format(
                    patients.length
                  )}{" "}
                  registered patients
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:items-start">
            <div className="inline-flex max-w-md items-start gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-800">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                This UI currently uses synthetic development
                records. No production patient database is
                connected.
              </p>
            </div>

            <Button
              type="button"
              className="bg-teal-700 text-white hover:bg-teal-800"
              onClick={() =>
                setIsNewPatientDialogOpen(true)
              }
            >
              <Plus aria-hidden="true" />
              New patient
            </Button>
          </div>
        </div>

        <PatientTable
          key={initialSearch || "all-patients"}
          patients={patients}
          initialSearch={initialSearch}
          onViewPatient={handleViewPatient}
          onOpenPatientProfile={
            handleOpenPatientProfile
          }
          onEditPatient={handleEditPatient}
          onArchivePatient={
            handleArchiveRequest
          }
        />
      </div>

      <PatientFormDialog
        mode="create"
        open={isNewPatientDialogOpen}
        onOpenChange={
          setIsNewPatientDialogOpen
        }
        onSubmitPatient={handleCreatePatient}
      />

      <PatientFormDialog
        mode="edit"
        patient={editingPatient}
        open={Boolean(editingPatient)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingPatientId(null)
          }
        }}
        onSubmitPatient={handleUpdatePatient}
      />

      <PatientDetailsSheet
        patient={viewedPatient}
        open={Boolean(viewedPatient)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewedPatientId(null)
          }
        }}
        onOpenFullProfile={
          handleOpenPatientProfile
        }
        onEditPatient={editPatientFromDetails}
      />

      <PatientArchiveDialog
        patient={archivingPatient}
        open={Boolean(archivingPatient)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setArchivingPatientId(null)
          }
        }}
        onConfirmArchive={
          handleConfirmArchive
        }
      />
    </>
  )
}
