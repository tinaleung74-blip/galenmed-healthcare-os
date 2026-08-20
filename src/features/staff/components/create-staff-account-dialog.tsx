"use client"

import {
  useMemo,
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
  ShieldAlert,
  UserPlus,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"
import {
  createOperationalStaffAccountAction,
} from "@/features/staff/actions/staff-management.actions"
import {
  createStaffAccountSchema,
  REQUIRED_DEPARTMENT_BY_ROLE,
} from "@/features/staff/schemas/staff-management.schema"
import type {
  CreateStaffAccountValues,
  OperationalStaffRoleCode,
  StaffManagementBranch,
  StaffManagementDepartment,
  StaffManagementRole,
} from "@/features/staff/types/staff-management.types"

interface CreateStaffAccountDialogProps {
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  roles: Array<
    StaffManagementRole & {
      code: OperationalStaffRoleCode
    }
  >
  branches:
    StaffManagementBranch[]
  departments:
    StaffManagementDepartment[]
}

interface CreatedCredentials {
  fullName: string
  workEmail: string
  temporaryPassword: string
}

const UPPERCASE =
  "ABCDEFGHJKLMNPQRSTUVWXYZ"
const LOWERCASE =
  "abcdefghijkmnopqrstuvwxyz"
const DIGITS = "23456789"
const SYMBOLS = "@#$%*+-_!"
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
  const requiredCharacters = [
    randomCharacter(UPPERCASE),
    randomCharacter(LOWERCASE),
    randomCharacter(DIGITS),
    randomCharacter(SYMBOLS),
  ]

  while (
    requiredCharacters.length < 16
  ) {
    requiredCharacters.push(
      randomCharacter(
        ALL_CHARACTERS
      )
    )
  }

  return shuffleCharacters(
    requiredCharacters.join("")
  )
}

function getInitialValues({
  roles,
  branches,
}: Pick<
  CreateStaffAccountDialogProps,
  "roles" | "branches"
>): CreateStaffAccountValues {
  const roleCode =
    roles[0]?.code ??
    "RECEPTIONIST"

  const branchId =
    branches[0]?.id ?? ""

  return {
    employeeId: "",
    fullName: "",
    workEmail: "",
    mobileNumber: "",
    jobTitle: "",
    roleCode,
    branchIds:
      branchId
        ? [branchId]
        : [],
    primaryBranchId:
      branchId,
    departmentCodes: [
      REQUIRED_DEPARTMENT_BY_ROLE[
        roleCode
      ],
    ],
    temporaryPassword: "",
    confirmTemporaryPassword:
      "",
    reason:
      "Operational staff account created by the GalenMed System Administrator.",
  }
}

export function CreateStaffAccountDialog({
  open,
  onOpenChange,
  roles,
  branches,
  departments,
}: CreateStaffAccountDialogProps) {
  const router = useRouter()

  const [
    isPending,
    startTransition,
  ] = useTransition()

  const [
    values,
    setValues,
  ] = useState<
    CreateStaffAccountValues
  >(
    getInitialValues({
      roles,
      branches,
    })
  )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
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

  const selectedBranches =
    useMemo(
      () =>
        branches.filter(
          (branch) =>
            values.branchIds.includes(
              branch.id
            )
        ),
      [branches, values.branchIds]
    )

  const requiredDepartmentCode =
    REQUIRED_DEPARTMENT_BY_ROLE[
      values.roleCode
    ]

  function updateValue<
    Key extends keyof CreateStaffAccountValues,
  >(
    key: Key,
    value:
      CreateStaffAccountValues[Key]
  ) {
    setValues(
      (currentValues) => ({
        ...currentValues,
        [key]: value,
      })
    )
  }

  function handleRoleChange(
    roleCode:
      OperationalStaffRoleCode
  ) {
    const requiredDepartment =
      REQUIRED_DEPARTMENT_BY_ROLE[
        roleCode
      ]

    setValues(
      (currentValues) => ({
        ...currentValues,
        roleCode,
        departmentCodes:
          currentValues.departmentCodes.includes(
            requiredDepartment
          )
            ? currentValues.departmentCodes
            : [
                ...currentValues.departmentCodes,
                requiredDepartment,
              ],
      })
    )
  }

  function toggleBranch(
    branchId: string,
    checked: boolean
  ) {
    setValues(
      (currentValues) => {
        const branchIds = checked
          ? Array.from(
              new Set([
                ...currentValues.branchIds,
                branchId,
              ])
            )
          : currentValues.branchIds.filter(
              (id) => id !== branchId
            )

        const primaryBranchId =
          branchIds.includes(
            currentValues.primaryBranchId
          )
            ? currentValues.primaryBranchId
            : branchIds[0] ?? ""

        return {
          ...currentValues,
          branchIds,
          primaryBranchId,
        }
      }
    )
  }

  function toggleDepartment(
    departmentCode: string,
    checked: boolean
  ) {
    if (
      departmentCode ===
        requiredDepartmentCode &&
      !checked
    ) {
      return
    }

    setValues(
      (currentValues) => ({
        ...currentValues,
        departmentCodes: checked
          ? Array.from(
              new Set([
                ...currentValues.departmentCodes,
                departmentCode,
              ])
            )
          : currentValues.departmentCodes.filter(
              (code) =>
                code !==
                departmentCode
            ),
      })
    )
  }

  function generatePassword() {
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

    setShowPassword(true)
  }

  async function copyCredentials() {
    if (!createdCredentials) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        [
          `GalenMed staff account`,
          `Name: ${createdCredentials.fullName}`,
          `Email: ${createdCredentials.workEmail}`,
          `Temporary password: ${createdCredentials.temporaryPassword}`,
          `Login: /staff/login`,
        ].join("\n")
      )

      toast.success(
        "Temporary credentials copied"
      )
    } catch {
      toast.error(
        "Credentials could not be copied."
      )
    }
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      createStaffAccountSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The staff account details are invalid."
      )

      return
    }

    startTransition(async () => {
      const result =
        await createOperationalStaffAccountAction(
          parsedValues.data
        )

      if (!result.success) {
        setErrorMessage(
          result.message
        )

        return
      }

      setCreatedCredentials({
        fullName:
          parsedValues.data.fullName,
        workEmail:
          parsedValues.data.workEmail,
        temporaryPassword:
          parsedValues.data
            .temporaryPassword,
      })

      toast.success(
        "Staff account created"
      )

      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <UserPlus
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Create operational staff account
          </DialogTitle>

          <DialogDescription>
            Create the Supabase Auth identity,
            assign one operational role, and
            configure branch and department
            access.
          </DialogDescription>
        </DialogHeader>

        {createdCredentials ? (
          <section className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check
                    className="size-5"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-emerald-950">
                    Staff account activated
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Copy the temporary credentials
                    now. The password is not stored
                    in the GalenMed staff profile.
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid gap-4 rounded-xl border border-emerald-200 bg-white p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">
                    Work email
                  </dt>

                  <dd className="mt-1 break-all font-medium">
                    {createdCredentials.workEmail}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">
                    Temporary password
                  </dt>

                  <dd className="mt-1 break-all font-mono font-semibold">
                    {createdCredentials.temporaryPassword}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={copyCredentials}
              >
                <Clipboard
                  aria-hidden="true"
                />
                Copy credentials
              </Button>

              <Button
                type="button"
                onClick={() =>
                  onOpenChange(false)
                }
              >
                Close
              </Button>
            </div>
          </section>
        ) : (
          <form
            id="create-staff-account-form"
            noValidate
            className="space-y-7"
            onSubmit={handleSubmit}
          >
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">
                Staff identity
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="staff-employee-id">
                    Employee ID
                  </Label>

                  <Input
                    id="staff-employee-id"
                    value={values.employeeId}
                    disabled={isPending}
                    placeholder="GM-DOC-001"
                    onChange={(event) =>
                      updateValue(
                        "employeeId",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="staff-full-name">
                    Full name
                  </Label>

                  <Input
                    id="staff-full-name"
                    value={values.fullName}
                    disabled={isPending}
                    placeholder="Dr. Maria Santos"
                    onChange={(event) =>
                      updateValue(
                        "fullName",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="staff-work-email">
                    Work email
                  </Label>

                  <Input
                    id="staff-work-email"
                    type="email"
                    value={values.workEmail}
                    disabled={isPending}
                    placeholder="staff@hospital.com"
                    onChange={(event) =>
                      updateValue(
                        "workEmail",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-mobile-number">
                    Mobile number
                    <span className="ml-1 font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>

                  <Input
                    id="staff-mobile-number"
                    value={values.mobileNumber}
                    disabled={isPending}
                    onChange={(event) =>
                      updateValue(
                        "mobileNumber",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="staff-job-title">
                    Job title
                    <span className="ml-1 font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>

                  <Input
                    id="staff-job-title"
                    value={values.jobTitle}
                    disabled={isPending}
                    placeholder="Attending Physician, Front Desk Officer, Cashier"
                    onChange={(event) =>
                      updateValue(
                        "jobTitle",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold">
                Role and access assignments
              </h3>

              <div className="space-y-2">
                <Label htmlFor="staff-role-code">
                  Operational role
                </Label>

                <select
                  id="staff-role-code"
                  value={values.roleCode}
                  disabled={isPending}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  onChange={(event) =>
                    handleRoleChange(
                      event.target.value as
                        OperationalStaffRoleCode
                    )
                  }
                >
                  {roles.map((role) => (
                    <option
                      key={role.code}
                      value={role.code}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Hospital branches
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Assign one or more branches.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {branches.map((branch) => {
                      const checked =
                        values.branchIds.includes(
                          branch.id
                        )

                      return (
                        <label
                          key={branch.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isPending}
                            className="mt-0.5 size-4 accent-teal-700"
                            onChange={(event) =>
                              toggleBranch(
                                branch.id,
                                event.target.checked
                              )
                            }
                          />

                          <span>
                            <span className="block text-sm font-medium">
                              {branch.name}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {branch.code}
                              {branch.city
                                ? ` · ${branch.city}`
                                : ""}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-primary-branch">
                      Primary branch
                    </Label>

                    <select
                      id="staff-primary-branch"
                      value={values.primaryBranchId}
                      disabled={
                        isPending ||
                        selectedBranches.length === 0
                      }
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      onChange={(event) =>
                        updateValue(
                          "primaryBranchId",
                          event.target.value
                        )
                      }
                    >
                      {selectedBranches.map(
                        (branch) => (
                          <option
                            key={branch.id}
                            value={branch.id}
                          >
                            {branch.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Departments
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      The role-required department
                      cannot be removed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {departments.map(
                      (department) => {
                        const checked =
                          values.departmentCodes.includes(
                            department.code
                          )

                        const required =
                          department.code ===
                          requiredDepartmentCode

                        return (
                          <label
                            key={department.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={
                                isPending || required
                              }
                              className="mt-0.5 size-4 accent-teal-700"
                              onChange={(event) =>
                                toggleDepartment(
                                  department.code,
                                  event.target.checked
                                )
                              }
                            />

                            <span>
                              <span className="block text-sm font-medium">
                                {department.name}
                                {required ? (
                                  <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] text-teal-700">
                                    Required
                                  </span>
                                ) : null}
                              </span>

                              <span className="mt-1 block text-xs text-muted-foreground">
                                {department.code}
                              </span>
                            </span>
                          </label>
                        )
                      }
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    Temporary login credentials
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Give the temporary password to
                    the staff member through a secure
                    channel.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={generatePassword}
                >
                  <RefreshCw
                    aria-hidden="true"
                  />
                  Generate password
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staff-temporary-password">
                    Temporary password
                  </Label>

                  <div className="relative">
                    <Input
                      id="staff-temporary-password"
                      type={showPassword ? "text" : "password"}
                      value={values.temporaryPassword}
                      disabled={isPending}
                      className="pr-11"
                      onChange={(event) =>
                        updateValue(
                          "temporaryPassword",
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                      aria-label={
                        showPassword
                          ? "Hide temporary password"
                          : "Show temporary password"
                      }
                      onClick={() =>
                        setShowPassword(
                          (currentValue) =>
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
                  <Label htmlFor="staff-confirm-password">
                    Confirm temporary password
                  </Label>

                  <Input
                    id="staff-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={values.confirmTemporaryPassword}
                    disabled={isPending}
                    onChange={(event) =>
                      updateValue(
                        "confirmTemporaryPassword",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-provisioning-reason">
                  Provisioning reason
                </Label>

                <Textarea
                  id="staff-provisioning-reason"
                  rows={3}
                  value={values.reason}
                  disabled={isPending}
                  onChange={(event) =>
                    updateValue(
                      "reason",
                      event.target.value
                    )
                  }
                />
              </div>
            </section>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
              <ShieldAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                This action creates a real Supabase
                Auth user. Do not use personal email
                addresses or share temporary
                passwords through public channels.
              </p>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              >
                {errorMessage}
              </div>
            ) : null}
          </form>
        )}

        {!createdCredentials ? (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                onOpenChange(false)
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="create-staff-account-form"
              disabled={isPending}
              className="bg-teal-700 text-white hover:bg-teal-800"
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Creating account
                </>
              ) : (
                <>
                  <KeyRound
                    aria-hidden="true"
                  />
                  Create staff account
                </>
              )}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
