"use client"

import {
  useState,
  useTransition,
} from "react"
import {
  ArrowLeft,
  FileCheck2,
  LoaderCircle,
  Printer,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  recordReceptionDocumentPrintAction,
} from "@/features/hospital-operations/actions/reception-release.actions"
import type {
  ReceptionReleaseItem,
} from "@/features/hospital-operations/types/reception-release.types"
import {
  parseDoctorPrescriptionMetadata,
} from "@/features/hospital-operations/utils/doctor-prescription.utils"
import {
  LABORATORY_RESULT_FLAG_LABELS,
} from "@/features/hospital-operations/utils/laboratory-result.utils"
import {
  createReceptionReleaseIdempotencyKey,
  formatReceptionDate,
  formatReceptionDateTime,
  getReceptionPatientFullName,
  RECEPTION_DOCUMENT_TYPE_LABELS,
} from "@/features/hospital-operations/utils/reception-release.utils"
import { cn } from "@/lib/utils"

interface ReceptionReleaseDocumentProps {
  data: ReceptionReleaseItem
}

export function ReceptionReleaseDocument({
  data,
}: ReceptionReleaseDocumentProps) {
  const router = useRouter()

  const [
    reprintReason,
    setReprintReason,
  ] = useState("")

  const [
    idempotencyKey,
    setIdempotencyKey,
  ] = useState(() =>
    createReceptionReleaseIdempotencyKey(
      "clinical-document-print"
    )
  )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const isReprint =
    data.printLogs.length > 0

  const printPurpose =
    isReprint
      ? "reprint"
      : "patient_original"

  const latestReleaseRecord =
    data.releaseRecords[0] ??
    null

  const prescription =
    data.documentType === "prescription"
      ? parseDoctorPrescriptionMetadata(
          data.rawMetadata
        )
      : null

  const nextCopyNumber =
    data.printLogs.length + 1

  function handlePrint() {
    setErrorMessage(null)

    if (
      isReprint &&
      reprintReason.trim().length < 3
    ) {
      setErrorMessage(
        "Enter a reason before reprinting this clinical document."
      )
      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await recordReceptionDocumentPrintAction(
            {
              documentId:
                data.documentId,
              releaseRecordId:
                latestReleaseRecord?.id ??
                "",
              printPurpose,
              printReason:
                reprintReason,
              idempotencyKey,
            }
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message,
          {
            description:
              `Copy ${result.data?.copyNumber ?? nextCopyNumber}`,
          }
        )

        setIdempotencyKey(
          createReceptionReleaseIdempotencyKey(
            "clinical-document-print"
          )
        )

        window.setTimeout(() => {
          window.print()
          router.refresh()
        }, 150)
      })()
    })
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm print:hidden lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/reception/releases"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <ArrowLeft
                aria-hidden="true"
              />
              Back to release center
            </Link>

            <p className="mt-4 text-sm font-semibold">
              {isReprint
                ? "Clinical document reprint"
                : "Patient original print"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              The print action is written to
              the append-only clinical document
              print audit.
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-lg">
            {isReprint ? (
              <>
                <Label htmlFor="clinical-document-reprint-reason">
                  Reprint reason
                </Label>

                <Input
                  id="clinical-document-reprint-reason"
                  value={reprintReason}
                  disabled={isPending}
                  placeholder="Example: Patient requested a replacement copy"
                  onChange={(event) =>
                    setReprintReason(
                      event.target.value
                    )
                  }
                />
              </>
            ) : null}

            {errorMessage ? (
              <p
                role="alert"
                className="text-sm text-rose-700"
              >
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="button"
              disabled={isPending}
              className="bg-teal-700 text-white hover:bg-teal-800"
              onClick={handlePrint}
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Recording print
                </>
              ) : (
                <>
                  <Printer
                    aria-hidden="true"
                  />
                  {isReprint
                    ? "Record and reprint"
                    : "Record and print"}
                </>
              )}
            </Button>
          </div>
        </div>

        <article className="rounded-2xl border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-8 print:shadow-none sm:p-12">
          <header className="flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <GalenMedLogo
                size="lg"
                priority
                className="rounded-2xl bg-white p-1 ring-1 ring-slate-200"
              />

              <div>
                <p className="text-xl font-semibold tracking-tight">
                  GalenMed Healthcare OS
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.branchName}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <FileCheck2
                className="size-6 text-teal-700 sm:ml-auto"
                aria-hidden="true"
              />

              <h1 className="mt-2 text-xl font-semibold">
                {
                  RECEPTION_DOCUMENT_TYPE_LABELS[
                    data.documentType
                  ]
                }
              </h1>

              <p className="mt-1 font-mono text-sm">
                {data.documentNumber}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Version {data.versionNumber}
              </p>
            </div>
          </header>

          <section className="grid gap-6 border-b py-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Patient
              </p>
              <p className="mt-1 font-semibold">
                {getReceptionPatientFullName(
                  data
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Medical record number
              </p>
              <p className="mt-1 font-mono text-sm">
                {
                  data.patient
                    .medicalRecordNumber
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Date of birth
              </p>
              <p className="mt-1">
                {formatReceptionDate(
                  data.patient.dateOfBirth
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Visit number
              </p>
              <p className="mt-1 font-mono text-sm">
                {data.visitNumber}
              </p>
            </div>
          </section>

          <section className="border-b py-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Document title
                </p>
                <p className="mt-1 font-medium">
                  {data.title}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Service
                </p>
                <p className="mt-1">
                  {data.serviceName ??
                    data.serviceType ??
                    "Not linked"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Request number
                </p>
                <p className="mt-1 font-mono text-sm">
                  {data.requestNumber ??
                    "Not linked"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Finalized
                </p>
                <p className="mt-1">
                  {formatReceptionDateTime(
                    data.finalizedAt
                  )}
                </p>
              </div>
            </div>
          </section>

          {prescription ? (
            <section className="space-y-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Diagnosis</p>
                  <p className="mt-1 font-medium">{prescription.diagnosisText}</p>
                  {prescription.diagnosisCode ? <p className="mt-1 font-mono text-xs text-muted-foreground">{prescription.diagnosisCode}</p> : null}
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Prescribing Doctor</p>
                  <p className="mt-1 font-medium">{prescription.doctor.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{prescription.doctor.jobTitle ?? "Doctor"}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader><TableRow><TableHead>Generic Medicine</TableHead><TableHead>Strength / Form</TableHead><TableHead>Directions</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {prescription.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><p className="font-semibold">{item.genericName}</p>{item.brandName ? <p className="mt-1 text-xs text-muted-foreground">Brand: {item.brandName}</p> : null}</TableCell>
                        <TableCell>{item.strength} · {item.dosageForm}</TableCell>
                        <TableCell><p>{item.dose} · {item.route} · {item.frequency}</p><p className="mt-1 text-xs text-muted-foreground">For {item.duration}</p>{item.instructions ? <p className="mt-1 text-xs">{item.instructions}</p> : null}</TableCell>
                        <TableCell>{item.quantity} {item.quantityUnit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {prescription.generalInstructions ? <div><p className="text-xs uppercase tracking-wide text-muted-foreground">General Instructions</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{prescription.generalInstructions}</p></div> : null}
            </section>
          ) : data.laboratoryResult ? (
            <section className="space-y-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Specimen type
                  </p>
                  <p className="mt-1 font-medium">
                    {
                      data.laboratoryResult
                        .specimenType
                    }
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Collection reference
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    {data.laboratoryResult
                      .collectionReference ??
                      "Not recorded"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Test
                      </TableHead>
                      <TableHead>
                        Result
                      </TableHead>
                      <TableHead>
                        Unit
                      </TableHead>
                      <TableHead>
                        Reference range
                      </TableHead>
                      <TableHead>
                        Flag
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.laboratoryResult.resultItems.map(
                      (resultItem) => (
                        <TableRow
                          key={resultItem.id}
                        >
                          <TableCell className="font-medium">
                            {resultItem.testName}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {resultItem.resultValue}
                          </TableCell>
                          <TableCell>
                            {resultItem.unit ||
                              "—"}
                          </TableCell>
                          <TableCell>
                            {resultItem.referenceRange ||
                              "—"}
                          </TableCell>
                          <TableCell>
                            {
                              LABORATORY_RESULT_FLAG_LABELS[
                                resultItem.flag
                              ]
                            }
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>

              {data.laboratoryResult
                .interpretation ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Interpretation
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {
                      data.laboratoryResult
                        .interpretation
                    }
                  </p>
                </div>
              ) : null}

              {data.laboratoryResult.notes ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {data.laboratoryResult.notes}
                  </p>
                </div>
              ) : null}
            </section>
          ) : (
            <section className="py-8">
              <p className="text-sm leading-6 text-muted-foreground">
                The finalized clinical content
                is retained in the source
                module. This print page records
                the patient-facing copy and
                identifies the verified document
                reference.
              </p>
            </section>
          )}

          <footer className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Release status
              </p>
              <p className="mt-1 font-medium capitalize">
                {data.releaseStatus.replace(
                  /_/g,
                  " "
                )}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Printed copy
              </p>
              <p className="mt-1 font-medium">
                Copy {nextCopyNumber}
              </p>
            </div>
          </footer>

          <div className="mt-8 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-800 print:border-slate-300 print:bg-white">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              This copy was generated from a
              finalized GalenMed clinical
              document after payment-release
              controls were satisfied. Confirm
              patient identity before handoff.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
