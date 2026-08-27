"use client"

import {
  ArrowLeft,
  FileCheck2,
  LoaderCircle,
  Pill,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"
import {
  useState,
  useTransition,
  type ChangeEvent,
} from "react"
import { toast } from "sonner"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  StaffContext,
} from "@/features/auth/types/staff-auth.types"
import {
  saveDoctorPrescriptionDraftAction,
  submitDoctorPrescriptionAction,
} from "@/features/hospital-operations/actions/doctor-prescription.actions"
import {
  DoctorPrescriptionStatusBadge,
} from "@/features/hospital-operations/components/doctor-prescription-badges"
import type {
  DoctorPrescriptionItem,
  DoctorPrescriptionStatus,
  DoctorPrescriptionWorkspaceData,
} from "@/features/hospital-operations/types/doctor-prescription.types"
import { cn } from "@/lib/utils"

interface DoctorPrescriptionComposerProps {
  context: StaffContext
  data: DoctorPrescriptionWorkspaceData
}

interface PrescriptionFormItem {
  id: string
  genericName: string
  brandName: string
  dosageForm: string
  strength: string
  dose: string
  route: string
  frequency: string
  duration: string
  quantity: string
  quantityUnit: string
  instructions: string
}

interface ComposerState {
  generalInstructions: string
  items: PrescriptionFormItem[]
}

function createTemporaryItemId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `prescription-item-${globalThis.crypto.randomUUID()}`
  }

  return `prescription-item-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function createEmptyPrescriptionItem(): PrescriptionFormItem {
  return {
    id: createTemporaryItemId(),
    genericName: "",
    brandName: "",
    dosageForm: "",
    strength: "",
    dose: "",
    route: "",
    frequency: "",
    duration: "",
    quantity: "",
    quantityUnit: "",
    instructions: "",
  }
}

function toPrescriptionFormItem(
  item: DoctorPrescriptionItem
): PrescriptionFormItem {
  return {
    id: item.id,
    genericName: item.genericName,
    brandName: item.brandName ?? "",
    dosageForm: item.dosageForm,
    strength: item.strength,
    dose: item.dose,
    route: item.route,
    frequency: item.frequency,
    duration: item.duration,
    quantity: String(item.quantity),
    quantityUnit: item.quantityUnit,
    instructions: item.instructions ?? "",
  }
}

function getPatientName(
  patient: DoctorPrescriptionWorkspaceData["patient"]
): string {
  return [
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(
      (namePart): namePart is string =>
        Boolean(namePart?.trim())
    )
    .join(" ")
}

function getInitialState(
  data: DoctorPrescriptionWorkspaceData
): ComposerState {
  return {
    generalInstructions:
      data.prescription
        ?.generalInstructions ??
      "",
    items:
      data.prescription?.items.length
        ? data.prescription.items.map(
            toPrescriptionFormItem
          )
        : [
            createEmptyPrescriptionItem(),
          ],
  }
}

export function DoctorPrescriptionComposer({
  context,
  data,
}: DoctorPrescriptionComposerProps) {
  const router = useRouter()

  const [values, setValues] =
    useState<ComposerState>(
      () => getInitialState(data)
    )

  const [prescriptionId, setPrescriptionId] =
    useState(
      data.prescription?.id ?? ""
    )

  const [prescriptionNumber, setPrescriptionNumber] =
    useState<string | null>(
      data.prescription
        ?.prescriptionNumber ?? null
    )

  const [status, setStatus] =
    useState<DoctorPrescriptionStatus>(
      data.prescription?.status ??
        "draft"
    )

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [isPending, startTransition] =
    useTransition()

  const isReadOnly =
    status === "submitted" ||
    status === "finalized" ||
    status === "voided" ||
    data.consultation.status ===
      "cancelled"

  const patientName =
    getPatientName(data.patient)

  function updateItem(
    itemId: string,
    key: Exclude<
      keyof PrescriptionFormItem,
      "id"
    >,
    value: string
  ) {
    setValues(
      (currentValues) => ({
        ...currentValues,
        items:
          currentValues.items.map(
            (item) =>
              item.id === itemId
                ? {
                    ...item,
                    [key]: value,
                  }
                : item
          ),
      })
    )
  }

  function addMedicine() {
    setValues(
      (currentValues) => ({
        ...currentValues,
        items: [
          ...currentValues.items,
          createEmptyPrescriptionItem(),
        ],
      })
    )
  }

  function removeMedicine(
    itemId: string
  ) {
    setValues(
      (currentValues) => {
        const remainingItems =
          currentValues.items.filter(
            (item) =>
              item.id !== itemId
          )

        return {
          ...currentValues,
          items:
            remainingItems.length > 0
              ? remainingItems
              : [
                  createEmptyPrescriptionItem(),
                ],
        }
      }
    )
  }

  function saveDraft() {
    setErrorMessage(null)

    startTransition(() => {
      void (async () => {
        const result =
          await saveDoctorPrescriptionDraftAction(
            {
              consultationId:
                data.consultation.id,
              prescriptionId,
              generalInstructions:
                values.generalInstructions,
              items: values.items,
            }
          )

        if (
          !result.success ||
          !result.data
        ) {
          setErrorMessage(
            result.message
          )
          return
        }

        setPrescriptionId(
          result.data.prescriptionId
        )
        setPrescriptionNumber(
          result.data
            .prescriptionNumber
        )
        setStatus(result.data.status)

        toast.success(
          result.message,
          {
            description:
              result.data
                .prescriptionNumber,
          }
        )

        router.refresh()
      })()
    })
  }

  function submitForReview() {
    if (!prescriptionId) {
      setErrorMessage(
        "Save the prescription draft before submitting it for review."
      )
      return
    }

    setErrorMessage(null)

    startTransition(() => {
      void (async () => {
        const result =
          await submitDoctorPrescriptionAction(
            {
              prescriptionId,
            }
          )

        if (
          !result.success ||
          !result.data
        ) {
          setErrorMessage(
            result.message
          )
          return
        }

        setStatus(result.data.status)

        toast.success(
          result.message
        )

        router.refresh()
      })()
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <GalenMedLogo
              size="md"
              priority
              className="rounded-xl bg-white p-1 ring-1 ring-slate-200"
            />

            <div>
              <p className="font-semibold tracking-tight">
                GalenMed
              </p>

              <p className="text-xs text-muted-foreground">
                Doctor Prescription Composer
              </p>
            </div>
          </div>

          <Link
            href="/doctor/prescriptions"
            className={cn(
              buttonVariants({
                variant: "outline",
              })
            )}
          >
            <ArrowLeft aria-hidden="true" />
            Prescriptions
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Assigned consultation
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {patientName}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {data.patient.medicalRecordNumber}
              {" · "}
              {data.consultation.consultationNumber}
              {" · "}
              {data.visit.visitNumber}
            </p>
          </div>

          <DoctorPrescriptionStatusBadge
            status={status}
          />
        </section>

        {data.prescription?.returnReason ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">
              Returned for correction
            </p>
            <p className="mt-1 whitespace-pre-wrap">
              {data.prescription.returnReason}
            </p>
          </div>
        ) : null}

        {data.prescription?.approvalNotes ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">
              Reception approval note
            </p>
            <p className="mt-1 whitespace-pre-wrap">
              {data.prescription.approvalNotes}
            </p>
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Consultation
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {data.consultation.consultationNumber}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Prescription reference
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {prescriptionNumber ??
                  "Not created"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Prescribing Doctor
              </p>
              <p className="mt-1 font-semibold">
                {context.fullName}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Branch
              </p>
              <p className="mt-1 font-semibold">
                {data.branch.name}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-5 rounded-xl border bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Clinical context
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Diagnosis comes from the assigned consultation and cannot be changed from the prescription composer.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Diagnosis code
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {data.consultation
                  .diagnosisCode ??
                  "Not recorded"}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Diagnosis
              </p>
              <p className="mt-1 font-medium">
                {data.consultation
                  .diagnosisText ??
                  "Not recorded"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription-general-instructions">
              General prescription instructions
            </Label>
            <Textarea
              id="prescription-general-instructions"
              rows={3}
              value={
                values.generalInstructions
              }
              disabled={
                isPending || isReadOnly
              }
              onChange={(
                event: ChangeEvent<HTMLTextAreaElement>
              ) =>
                setValues(
                  (currentValues) => ({
                    ...currentValues,
                    generalInstructions:
                      event.target.value,
                  })
                )
              }
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Rx medicine items
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Record dose, route, frequency, duration, quantity, and patient instructions.
              </p>
            </div>

            {!isReadOnly ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={addMedicine}
              >
                <Plus aria-hidden="true" />
                Add medicine
              </Button>
            ) : null}
          </div>

          {values.items.map(
            (item, index) => (
              <Card
                key={item.id}
                className="shadow-none"
              >
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Pill
                        className="size-5 text-teal-700"
                        aria-hidden="true"
                      />
                      <h3 className="font-semibold">
                        Medicine {index + 1}
                      </h3>
                    </div>

                    {!isReadOnly &&
                    values.items.length > 1 ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          removeMedicine(
                            item.id
                          )
                        }
                      >
                        <Trash2 aria-hidden="true" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2 xl:col-span-2">
                      <Label>
                        Generic medicine name
                      </Label>
                      <Input
                        value={item.genericName}
                        disabled={
                          isPending || isReadOnly
                        }
                        onChange={(
                          event: ChangeEvent<HTMLInputElement>
                        ) =>
                          updateItem(
                            item.id,
                            "genericName",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <Label>
                        Brand name
                        <span className="ml-1 font-normal text-muted-foreground">
                          Optional
                        </span>
                      </Label>
                      <Input
                        value={item.brandName}
                        disabled={
                          isPending || isReadOnly
                        }
                        onChange={(
                          event: ChangeEvent<HTMLInputElement>
                        ) =>
                          updateItem(
                            item.id,
                            "brandName",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    {(
                      [
                        ["dosageForm", "Dosage form"],
                        ["strength", "Strength"],
                        ["dose", "Dose"],
                        ["route", "Route"],
                        ["frequency", "Frequency"],
                        ["duration", "Duration"],
                      ] as const
                    ).map(
                      ([key, label]) => (
                        <div
                          key={key}
                          className="space-y-2"
                        >
                          <Label>{label}</Label>
                          <Input
                            value={item[key]}
                            disabled={
                              isPending ||
                              isReadOnly
                            }
                            onChange={(
                              event: ChangeEvent<HTMLInputElement>
                            ) =>
                              updateItem(
                                item.id,
                                key,
                                event.target.value
                              )
                            }
                          />
                        </div>
                      )
                    )}

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        disabled={
                          isPending || isReadOnly
                        }
                        onChange={(
                          event: ChangeEvent<HTMLInputElement>
                        ) =>
                          updateItem(
                            item.id,
                            "quantity",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Quantity unit
                      </Label>
                      <Input
                        value={item.quantityUnit}
                        disabled={
                          isPending || isReadOnly
                        }
                        onChange={(
                          event: ChangeEvent<HTMLInputElement>
                        ) =>
                          updateItem(
                            item.id,
                            "quantityUnit",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 xl:col-span-4">
                      <Label>
                        Special instructions
                      </Label>
                      <Textarea
                        rows={2}
                        value={item.instructions}
                        disabled={
                          isPending || isReadOnly
                        }
                        onChange={(
                          event: ChangeEvent<HTMLTextAreaElement>
                        ) =>
                          updateItem(
                            item.id,
                            "instructions",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </section>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {errorMessage}
          </div>
        ) : null}

        {isReadOnly ? (
          <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <FileCheck2
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <p>
              This prescription is locked while under review, after approval, or when voided. Reception can only approve or return submitted medicine content.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={saveDraft}
            >
              {isPending ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save aria-hidden="true" />
              )}
              Save draft
            </Button>

            <Button
              type="button"
              disabled={
                isPending ||
                !prescriptionId
              }
              className="bg-teal-700 text-white hover:bg-teal-800"
              onClick={submitForReview}
            >
              {isPending ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Send aria-hidden="true" />
              )}
              Submit to Reception
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
