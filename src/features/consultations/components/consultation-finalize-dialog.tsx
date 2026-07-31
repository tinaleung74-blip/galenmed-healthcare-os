"use client"

import {
  useEffect,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  FileSignature,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CONSULTATION_CLINICAL_ATTESTATION_TEXT,
} from "@/features/consultations/constants/consultation-finalization.constants"
import {
  consultationFinalizeFormSchema,
  type ConsultationFinalizeFormValues,
} from "@/features/consultations/schemas/consultation-finalize.schema"
import type { ConsultationEncounter } from "@/features/consultations/types/consultation.types"
import type { ConsultationFinalizationReadiness } from "@/features/consultations/utils/consultation-finalization.utils"

interface ConsultationFinalizeDialogProps {
  consultation: ConsultationEncounter
  readiness:
    ConsultationFinalizationReadiness
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitFinalization: (
    values:
      ConsultationFinalizeFormValues
  ) => Promise<void>
}

export function ConsultationFinalizeDialog({
  consultation,
  readiness,
  open,
  onOpenChange,
  onSubmitFinalization,
}: ConsultationFinalizeDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<ConsultationFinalizeFormValues>(
      {
        resolver: zodResolver(
          consultationFinalizeFormSchema
        ),
        defaultValues: {
          signerName: "",
          signerRole:
            "Attending Physician",
          professionalRegistrationNumber:
            "",
          attestationAccepted: false,
        },
        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset({
        signerName: "",
        signerRole:
          "Attending Physician",
        professionalRegistrationNumber:
          "",
        attestationAccepted: false,
      })
    }
  }, [open, reset])

  async function submitFinalization(
    values:
      ConsultationFinalizeFormValues
  ) {
    try {
      await onSubmitFinalization(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "The encounter could not be finalized.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FileSignature
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Finalize consultation encounter
          </DialogTitle>

          <DialogDescription>
            This action completes the
            consultation, finalizes the SOAP
            note, activates reviewed prescription
            drafts, and locks clinical editing.
          </DialogDescription>
        </DialogHeader>

        <form
          id="consultation-finalize-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitFinalization
          )}
        >
          <div className="space-y-2 rounded-xl border p-4">
            {readiness.requirements.map(
              (requirement) => (
                <div
                  key={requirement.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className={
                      requirement.met
                        ? "size-2 rounded-full bg-emerald-600"
                        : "size-2 rounded-full bg-rose-600"
                    }
                  />

                  <span>
                    {requirement.label}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalize-signer-name">
              Type signer name
            </Label>

            <Input
              id="finalize-signer-name"
              placeholder={
                consultation.doctorName
              }
              aria-invalid={Boolean(
                errors.signerName
              )}
              {...register("signerName")}
            />

            <p className="text-xs text-muted-foreground">
              Must exactly match{" "}
              <strong>
                {consultation.doctorName}
              </strong>
              .
            </p>

            {errors.signerName
              ?.message ? (
              <p
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {
                  errors.signerName
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="finalize-signer-role">
                Signer role
              </Label>

              <Input
                id="finalize-signer-role"
                aria-invalid={Boolean(
                  errors.signerRole
                )}
                {...register("signerRole")}
              />

              {errors.signerRole
                ?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {
                    errors.signerRole
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalize-registration">
                Professional registration
                number
              </Label>

              <Input
                id="finalize-registration"
                placeholder="SYNTH-PRC-0002"
                className="uppercase"
                aria-invalid={Boolean(
                  errors
                    .professionalRegistrationNumber
                )}
                {...register(
                  "professionalRegistrationNumber"
                )}
              />

              {errors
                .professionalRegistrationNumber
                ?.message ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {
                    errors
                      .professionalRegistrationNumber
                      .message
                  }
                </p>
              ) : null}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-emerald-700"
              {...register(
                "attestationAccepted"
              )}
            />

            <span>
              <span className="block text-sm font-medium text-emerald-900">
                Clinical attestation
              </span>

              <span className="mt-1 block text-xs leading-relaxed text-emerald-800">
                {
                  CONSULTATION_CLINICAL_ATTESTATION_TEXT
                }
              </span>
            </span>
          </label>

          {errors.attestationAccepted
            ?.message ? (
            <p
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {
                errors.attestationAccepted
                  .message
              }
            </p>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              This development signature stores
              typed-name metadata only. It is not
              certificate-based, cryptographically
              signed, or approved for real clinical
              use.
            </p>
          </div>

          {errors.root?.message ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {errors.root.message}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="consultation-finalize-form"
            disabled={
              isSubmitting ||
              !readiness.ready
            }
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Finalizing encounter
              </>
            ) : (
              <>
                <FileSignature
                  aria-hidden="true"
                />
                Finalize and lock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
