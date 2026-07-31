"use client"

import {
  useState,
} from "react"
import {
  CheckCircle2,
  FileSignature,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConsultationFinalizeDialog } from "@/features/consultations/components/consultation-finalize-dialog"
import { ConsultationFinalizationReadinessPanel } from "@/features/consultations/components/consultation-finalization-readiness-panel"
import { ConsultationFinalizationStatusBadge } from "@/features/consultations/components/consultation-finalization-status-badge"
import { ConsultationFollowUpEditor } from "@/features/consultations/components/consultation-follow-up-editor"
import {
  CONSULTATION_SIGNATURE_METHOD_LABELS,
} from "@/features/consultations/constants/consultation-finalization.constants"
import { useConsultationDiagnoses } from "@/features/consultations/providers/consultation-diagnosis-provider"
import { useConsultationEmr } from "@/features/consultations/providers/consultation-emr-provider"
import { useConsultationFinalization } from "@/features/consultations/providers/consultation-finalization-provider"
import { useConsultationPrescriptions } from "@/features/consultations/providers/consultation-prescription-provider"
import type { ConsultationFinalizeFormValues } from "@/features/consultations/schemas/consultation-finalize.schema"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import { buildConsultationFinalizationReadiness } from "@/features/consultations/utils/consultation-finalization.utils"
import { formatPatientDateTime } from "@/features/patients/utils/patient.utils"

interface ConsultationFinalizationWorkspaceProps {
  consultation: ConsultationEncounter
}

export function ConsultationFinalizationWorkspace({
  consultation,
}: ConsultationFinalizationWorkspaceProps) {
  const {
    finalizationRecords,
    finalizeEncounter,
  } = useConsultationFinalization()

  const { soapNotes } =
    useConsultationEmr()

  const { diagnosisRecords } =
    useConsultationDiagnoses()

  const { prescriptionRecords } =
    useConsultationPrescriptions()

  const [
    isFinalizeDialogOpen,
    setIsFinalizeDialogOpen,
  ] = useState(false)

  const finalizationRecord =
    finalizationRecords.find(
      (record) =>
        record.consultationId ===
        consultation.id
    ) ?? null

  const soapNote =
    soapNotes.find(
      (note) =>
        note.consultationId ===
        consultation.id
    ) ?? null

  const readiness =
    buildConsultationFinalizationReadiness(
      {
        consultation,
        finalizationRecord,
        soapNote,
        diagnosisRecords,
        prescriptionRecords,
      }
    )

  const isFinalized =
    finalizationRecord?.status ===
    "finalized"

  async function handleFinalize(
    values:
      ConsultationFinalizeFormValues
  ): Promise<void> {
    const finalizedRecord =
      finalizeEncounter(
        consultation.id,
        values
      )

    toast.success(
      "Consultation finalized",
      {
        description: `${consultation.consultationNumber} was completed and locked at ${formatPatientDateTime(
          finalizedRecord.finalizedAt
        )}.`,
      }
    )
  }

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileSignature
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <h2 className="text-lg font-semibold">
                Follow-up, Signature &amp;
                Finalization
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Complete patient-facing
              instructions, validate encounter
              readiness, and record clinical
              attestation.
            </p>
          </div>

          {finalizationRecord ? (
            <ConsultationFinalizationStatusBadge
              status={
                finalizationRecord.status
              }
            />
          ) : null}
        </div>

        <ConsultationFollowUpEditor
          key={`${finalizationRecord?.id ?? consultation.id}-${finalizationRecord?.version ?? 0}`}
          consultation={consultation}
          record={finalizationRecord}
        />

        {!isFinalized ? (
          <ConsultationFinalizationReadinessPanel
            readiness={readiness}
          />
        ) : null}

        {consultation.status ===
          "in-progress" &&
        !isFinalized ? (
          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
                <FileSignature
                  className="size-4"
                  aria-hidden="true"
                />

                Clinical attestation
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-emerald-800">
                Finalization will lock SOAP,
                diagnosis, prescription, and
                follow-up editing for this
                encounter.
              </p>

              <Button
                type="button"
                disabled={!readiness.ready}
                className="mt-4 bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() =>
                  setIsFinalizeDialogOpen(
                    true
                  )
                }
              >
                <FileSignature
                  aria-hidden="true"
                />
                Review and finalize
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isFinalized &&
        finalizationRecord.signature ? (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2 text-emerald-700">
                <CheckCircle2
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h3 className="font-semibold text-emerald-900">
                  Encounter finalized and locked
                </h3>

                <p className="mt-1 text-sm text-emerald-800">
                  Finalized{" "}
                  {formatPatientDateTime(
                    finalizationRecord.finalizedAt
                  )}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 rounded-xl border border-emerald-200 bg-white p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Signed by
                </dt>

                <dd className="mt-1 text-sm font-medium">
                  {
                    finalizationRecord
                      .signature.signerName
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Signer role
                </dt>

                <dd className="mt-1 text-sm">
                  {
                    finalizationRecord
                      .signature.signerRole
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Professional registration
                </dt>

                <dd className="mt-1 font-mono text-sm">
                  {
                    finalizationRecord
                      .signature
                      .professionalRegistrationNumber
                  }
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Signature method
                </dt>

                <dd className="mt-1 text-sm">
                  {
                    CONSULTATION_SIGNATURE_METHOD_LABELS[
                      finalizationRecord
                        .signature
                        .signatureMethod
                    ]
                  }
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-white p-4 text-xs text-emerald-800">
              <LockKeyhole
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                Clinical editing is locked.
                Production amendments will require
                a separate authorized,
                reason-based workflow.
              </p>
            </div>
          </section>
        ) : null}

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            Signature information in this phase
            is synthetic metadata. Do not use
            real professional registration
            numbers or real clinical records.
          </p>
        </div>
      </section>

      <ConsultationFinalizeDialog
        consultation={consultation}
        readiness={readiness}
        open={isFinalizeDialogOpen}
        onOpenChange={
          setIsFinalizeDialogOpen
        }
        onSubmitFinalization={
          handleFinalize
        }
      />
    </>
  )
}
