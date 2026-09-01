"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  UserPlus,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import {
  toast,
} from "sonner"

import {
  Button,
} from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Input,
} from "@/components/ui/input"
import {
  Label,
} from "@/components/ui/label"
import {
  Textarea,
} from "@/components/ui/textarea"
import {
  createPatientPortalAccountAction,
} from "@/features/patient-portal/actions/patient-portal-management.actions"
import {
  createPatientPortalAccountSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import type {
  CreatePatientPortalAccountValues,
  PatientPortalPatientRecord,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  getPatientPortalFullName,
} from "@/features/patient-portal/utils/patient-portal.utils"

interface CreatePatientPortalAccountDialogProps {
  patient:
    PatientPortalPatientRecord
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
}

interface CreatedCredentials {
  loginEmail: string
  temporaryPassword: string
}

const UPPERCASE =
  "ABCDEFGHJKLMNPQRSTUVWXYZ"
const LOWERCASE =
  "abcdefghijkmnopqrstuvwxyz"
const DIGITS =
  "23456789"
const SYMBOLS =
  "@#$%*+-_!"
const ALL_CHARACTERS =
  `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`

function randomCharacter(
  characters: string
): string {
  const randomArray =
    new Uint32Array(1)

  globalThis.crypto.getRandomValues(
    randomArray
  )

  return characters[
    randomArray[0] %
      characters.length
  ]
}

function shuffleCharacters(
  value: string
): string {
  const characters =
    value.split("")

  for (
    let index =
      characters.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomArray =
      new Uint32Array(1)

    globalThis.crypto.getRandomValues(
      randomArray
    )

    const swapIndex =
      randomArray[0] %
      (index + 1)

    ;[
      characters[index],
      characters[swapIndex],
    ] = [
      characters[swapIndex],
      characters[index],
    ]
  }

  return characters.join("")
}

function generateTemporaryPassword(): string {
  const characters = [
    randomCharacter(
      UPPERCASE
    ),
    randomCharacter(
      LOWERCASE
    ),
    randomCharacter(
      DIGITS
    ),
    randomCharacter(
      SYMBOLS
    ),
  ]

  while (
    characters.length < 16
  ) {
    characters.push(
      randomCharacter(
        ALL_CHARACTERS
      )
    )
  }

  return shuffleCharacters(
    characters.join("")
  )
}

function getInitialValues(
  patient:
    PatientPortalPatientRecord
): CreatePatientPortalAccountValues {
  return {
    patientId:
      patient.patientId,
    loginEmail:
      patient.emailAddress ??
      "",
    temporaryPassword:
      "",
    confirmTemporaryPassword:
      "",
    reason:
      "Patient Portal login created after receptionist verification of the patient identity and medical record.",
  }
}

export function CreatePatientPortalAccountDialog({
  patient,
  open,
  onOpenChange,
}: CreatePatientPortalAccountDialogProps) {
  const router =
    useRouter()

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const [
    values,
    setValues,
  ] = useState<
    CreatePatientPortalAccountValues
  >(
    getInitialValues(
      patient
    )
  )

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    createdCredentials,
    setCreatedCredentials,
  ] = useState<
    CreatedCredentials | null
  >(null)

  const [
    copied,
    setCopied,
  ] = useState(false)

  const patientName =
    getPatientPortalFullName(
      patient
    )

  function handleGeneratePassword() {
    const temporaryPassword =
      generateTemporaryPassword()

    setValues(
      (currentValues) => ({
        ...currentValues,
        temporaryPassword,
        confirmTemporaryPassword:
          temporaryPassword,
      })
    )

    setShowPassword(
      true
    )
  }

  async function handleCopyCredentials() {
    if (
      !createdCredentials
    ) {
      return
    }

    await navigator.clipboard.writeText(
      [
        "GalenMed Patient Portal",
        `Patient: ${patientName}`,
        `MRN: ${patient.medicalRecordNumber}`,
        `Email: ${createdCredentials.loginEmail}`,
        `Temporary password: ${createdCredentials.temporaryPassword}`,
        "Required: Change this password at first login.",
      ].join("\n")
    )

    setCopied(
      true
    )

    setTimeout(
      () =>
        setCopied(false),
      1500
    )
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const parsedValues =
      createPatientPortalAccountSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      toast.error(
        parsedValues.error.issues[0]
          ?.message ??
        "The Patient Portal account details are invalid."
      )

      return
    }

    startTransition(
      async () => {
        const result =
          await createPatientPortalAccountAction(
            parsedValues.data
          )

        if (!result.success) {
          toast.error(
            result.message
          )

          return
        }

        setCreatedCredentials({
          loginEmail:
            parsedValues.data
              .loginEmail,
          temporaryPassword:
            parsedValues.data
              .temporaryPassword,
        })

        toast.success(
          result.message
        )

        router.refresh()
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        onOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Create Patient Portal Login
          </DialogTitle>

          <DialogDescription>
            Link one verified patient
            record to one Patient Portal
            Auth identity.
          </DialogDescription>
        </DialogHeader>

        {createdCredentials ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                  <Check
                    className="size-5"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="font-semibold text-emerald-950">
                    Patient login created
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Give these temporary
                    credentials only to the
                    verified patient or an
                    authorized recipient.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border bg-slate-50 p-5 text-sm">
              <div>
                <p className="text-xs text-slate-500">
                  Patient
                </p>

                <p className="mt-1 font-semibold">
                  {patientName}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Medical record number
                </p>

                <p className="mt-1 font-mono font-semibold">
                  {
                    patient.medicalRecordNumber
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Login email
                </p>

                <p className="mt-1 break-all font-semibold">
                  {
                    createdCredentials.loginEmail
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Temporary password
                </p>

                <p className="mt-1 break-all font-mono font-semibold">
                  {
                    createdCredentials.temporaryPassword
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={
                  handleCopyCredentials
                }
              >
                {copied ? (
                  <Check
                    aria-hidden="true"
                  />
                ) : (
                  <Clipboard
                    aria-hidden="true"
                  />
                )}

                {copied
                  ? "Copied"
                  : "Copy credentials"}
              </Button>

              <Button
                type="button"
                onClick={() =>
                  onOpenChange(
                    false
                  )
                }
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={
              handleSubmit
            }
          >
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
              <p className="font-semibold">
                {patientName}
              </p>

              <p className="mt-1 font-mono text-xs text-slate-600">
                {
                  patient.medicalRecordNumber
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {
                  patient.branchName
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="patient-portal-email"
              >
                Patient login email
              </Label>

              <Input
                id="patient-portal-email"
                type="email"
                autoComplete="off"
                value={
                  values.loginEmail
                }
                disabled={
                  isPending
                }
                onChange={(
                  event
                ) =>
                  setValues(
                    (
                      currentValues
                    ) => ({
                      ...currentValues,
                      loginEmail:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="patient-portal-password"
                >
                  Temporary password
                </Label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={
                    isPending
                  }
                  onClick={
                    handleGeneratePassword
                  }
                >
                  <RefreshCw
                    aria-hidden="true"
                  />
                  Generate
                </Button>
              </div>

              <div className="relative">
                <Input
                  id="patient-portal-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={
                    values.temporaryPassword
                  }
                  disabled={
                    isPending
                  }
                  className="pr-12"
                  onChange={(
                    event
                  ) =>
                    setValues(
                      (
                        currentValues
                      ) => ({
                        ...currentValues,
                        temporaryPassword:
                          event.target
                            .value,
                      })
                    )
                  }
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500"
                  disabled={
                    isPending
                  }
                  onClick={() =>
                    setShowPassword(
                      (
                        currentValue
                      ) =>
                        !currentValue
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      className="size-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <Eye
                      className="size-4"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="patient-portal-confirm-password"
              >
                Confirm temporary password
              </Label>

              <Input
                id="patient-portal-confirm-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                value={
                  values.confirmTemporaryPassword
                }
                disabled={
                  isPending
                }
                onChange={(
                  event
                ) =>
                  setValues(
                    (
                      currentValues
                    ) => ({
                      ...currentValues,
                      confirmTemporaryPassword:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="patient-portal-reason"
              >
                Account-linking reason
              </Label>

              <Textarea
                id="patient-portal-reason"
                value={
                  values.reason
                }
                disabled={
                  isPending
                }
                rows={4}
                onChange={(
                  event
                ) =>
                  setValues(
                    (
                      currentValues
                    ) => ({
                      ...currentValues,
                      reason:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <KeyRound
                  className="mt-0.5 size-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />

                <p className="text-xs leading-5 text-amber-900">
                  The patient must change
                  this temporary password at
                  first login.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={
                  isPending
                }
                onClick={() =>
                  onOpenChange(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  isPending
                }
              >
                {isPending ? (
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <UserPlus
                    aria-hidden="true"
                  />
                )}

                {isPending
                  ? "Creating login"
                  : "Create patient login"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
