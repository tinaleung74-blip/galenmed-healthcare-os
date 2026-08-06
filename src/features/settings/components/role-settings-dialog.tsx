"use client"

import {
  useEffect,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
  useWatch,
} from "react-hook-form"
import {
  LoaderCircle,
  Save,
  ShieldCheck,
  UserCog,
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
import { Textarea } from "@/components/ui/textarea"
import {
  SettingsActiveStatusBadge,
  SettingsSystemRoleBadge,
} from "@/features/settings/components/settings-status-badges"
import {
  SETTINGS_PERMISSION_LABELS,
  SETTINGS_SYNTHETIC_NOTICE,
} from "@/features/settings/constants/settings.constants"
import {
  roleSettingsFormSchema,
  type RoleSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import {
  SETTINGS_PERMISSION_KEYS,
  type RoleSettings,
  type SettingsPermissionKey,
} from "@/features/settings/types/settings.types"

interface RoleSettingsDialogProps {
  role:
    | RoleSettings
    | null

  creating: boolean

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitRole: (
    values:
      RoleSettingsFormValues
  ) => Promise<void>
}

interface PermissionGroup {
  id: string
  label: string
  description: string

  permissions:
    readonly SettingsPermissionKey[]
}

const permissionGroups = [
  {
    id: "general",

    label:
      "General and Audit",

    description:
      "Dashboard visibility and audit-history access.",

    permissions: [
      "dashboard.view",
      "audit.view",
    ],
  },
  {
    id: "patients",

    label:
      "Patients",

    description:
      "Patient-record viewing and management.",

    permissions: [
      "patients.view",
      "patients.manage",
    ],
  },
  {
    id: "appointments",

    label:
      "Appointments",

    description:
      "Appointment viewing and operational management.",

    permissions: [
      "appointments.view",
      "appointments.manage",
    ],
  },
  {
    id: "consultations",

    label:
      "Consultations",

    description:
      "Consultation viewing and clinical workflow management.",

    permissions: [
      "consultations.view",
      "consultations.manage",
    ],
  },
  {
    id: "laboratory",

    label:
      "Laboratory",

    description:
      "Laboratory access, processing, and result release.",

    permissions: [
      "laboratory.view",
      "laboratory.manage",
      "laboratory.release",
    ],
  },
  {
    id: "radiology",

    label:
      "Radiology",

    description:
      "Radiology access, imaging operations, and report release.",

    permissions: [
      "radiology.view",
      "radiology.manage",
      "radiology.release",
    ],
  },
  {
    id: "pharmacy",

    label:
      "Pharmacy",

    description:
      "Prescription review, dispensing, and medication release.",

    permissions: [
      "pharmacy.view",
      "pharmacy.manage",
      "pharmacy.release",
    ],
  },
  {
    id: "billing",

    label:
      "Billing",

    description:
      "Billing visibility, financial management, and refund controls.",

    permissions: [
      "billing.view",
      "billing.manage",
      "billing.refund",
    ],
  },
  {
    id: "reports",

    label:
      "Reports",

    description:
      "Read-only reports and CSV export access.",

    permissions: [
      "reports.view",
      "reports.export",
    ],
  },
  {
    id: "settings",

    label:
      "Settings",

    description:
      "Settings visibility and configuration management.",

    permissions: [
      "settings.view",
      "settings.manage",
    ],
  },
] as const satisfies
  readonly PermissionGroup[]

function getDefaultValues({
  role,
  creating,
}: {
  role:
    | RoleSettings
    | null

  creating: boolean
}): RoleSettingsFormValues {
  return {
    id:
      creating
        ? ""
        : role?.id ?? "",

    code:
      creating
        ? ""
        : role?.code ?? "",

    name:
      creating
        ? ""
        : role?.name ?? "",

    description:
      creating
        ? ""
        : role?.description ??
          "",

    permissions:
      creating
        ? ["dashboard.view"]
        : [
            ...(
              role?.permissions ??
              []
            ),
          ],

    systemRole:
      creating
        ? false
        : role?.systemRole ??
          false,

    active:
      creating
        ? true
        : role?.active ??
          true,

    updatedBy: "",
  }
}

export function RoleSettingsDialog({
  role,
  creating,
  open,
  onOpenChange,
  onSubmitRole,
}: RoleSettingsDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<RoleSettingsFormValues>(
      {
        resolver: zodResolver(
          roleSettingsFormSchema
        ),

        defaultValues:
          getDefaultValues({
            role,
            creating,
          }),

        mode: "onTouched",
      }
    )

  const selectedPermissions =
    useWatch({
      control,
      name: "permissions",
    }) ?? []

  const active =
    useWatch({
      control,
      name: "active",
    })

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues({
          role,
          creating,
        })
      )
    }
  }, [
    creating,
    open,
    reset,
    role,
  ])

  const isSuperAdministrator =
    !creating &&
    role?.code ===
      "SUPER_ADMIN"

  function updatePermissions(
    permissions:
      readonly SettingsPermissionKey[]
  ) {
    setValue(
      "permissions",
      SETTINGS_PERMISSION_KEYS.filter(
        (permission) =>
          permissions.includes(
            permission
          )
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  function togglePermission(
    permission:
      SettingsPermissionKey,

    selected: boolean
  ) {
    if (isSuperAdministrator) {
      return
    }

    const nextPermissions =
      selected
        ? Array.from(
            new Set([
              ...selectedPermissions,
              permission,
            ])
          )
        : selectedPermissions.filter(
            (
              selectedPermission
            ) =>
              selectedPermission !==
              permission
          )

    updatePermissions(
      nextPermissions
    )
  }

  function togglePermissionGroup(
    group:
      PermissionGroup,

    selected: boolean
  ) {
    if (isSuperAdministrator) {
      return
    }

    const nextPermissions =
      selected
        ? Array.from(
            new Set([
              ...selectedPermissions,
              ...group.permissions,
            ])
          )
        : selectedPermissions.filter(
            (permission) =>
              !group.permissions.includes(
                permission
              )
          )

    updatePermissions(
      nextPermissions
    )
  }

  async function submitRole(
    values:
      RoleSettingsFormValues
  ) {
    try {
      await onSubmitRole(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The role configuration could not be saved.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <UserCog
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {creating
              ? "Create custom role"
              : "Edit role and permissions"}
          </DialogTitle>

          <DialogDescription>
            Configure the role identity,
            active status, and allowed
            GalenMed system permissions.
          </DialogDescription>

          {!creating && role ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <SettingsSystemRoleBadge
                systemRole={
                  role.systemRole
                }
              />

              <SettingsActiveStatusBadge
                active={active}
              />
            </div>
          ) : null}
        </DialogHeader>

        <form
          id="role-settings-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit(
            submitRole
          )}
        >
          <input
            type="hidden"
            {...register("id")}
          />

          <input
            type="hidden"
            {...register(
              "systemRole"
            )}
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Role identity
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="settings-role-code">
                  Role code
                </Label>

                <Input
                  id="settings-role-code"
                  readOnly={
                    Boolean(
                      role?.systemRole
                    )
                  }
                  {...register("code")}
                />

                {errors.code?.message ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.code.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-role-name">
                  Role name
                </Label>

                <Input
                  id="settings-role-name"
                  {...register("name")}
                />

                {errors.name?.message ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="settings-role-description">
                  Description
                  <span className="ml-1 font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <Textarea
                  id="settings-role-description"
                  rows={4}
                  {...register(
                    "description"
                  )}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <input
                type="checkbox"
                disabled={
                  isSuperAdministrator
                }
                className="mt-1 size-4 accent-violet-700 disabled:opacity-50"
                {...register("active")}
              />

              <span>
                <span className="block text-sm font-medium">
                  Role active
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Inactive roles remain in
                  configuration and audit
                  history.
                </span>
              </span>
            </label>
          </section>

          <section className="space-y-4 border-t pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  System permissions
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedPermissions.length}
                  {" of "}
                  {
                    SETTINGS_PERMISSION_KEYS.length
                  }{" "}
                  permissions selected.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    isSuperAdministrator
                  }
                  onClick={() =>
                    updatePermissions(
                      SETTINGS_PERMISSION_KEYS
                    )
                  }
                >
                  Select all
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={
                    isSuperAdministrator
                  }
                  onClick={() =>
                    updatePermissions([])
                  }
                >
                  Clear all
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {permissionGroups.map(
                (group) => {
                  const selectedCount =
                    group.permissions.filter(
                      (permission) =>
                        selectedPermissions.includes(
                          permission
                        )
                    ).length

                  const groupSelected =
                    selectedCount ===
                    group.permissions.length

                  return (
                    <article
                      key={group.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">
                            {group.label}
                          </h4>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              group.description
                            }
                          </p>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                          <input
                            type="checkbox"
                            checked={
                              groupSelected
                            }
                            disabled={
                              isSuperAdministrator
                            }
                            className="size-4 accent-violet-700 disabled:opacity-50"
                            onChange={(
                              event
                            ) =>
                              togglePermissionGroup(
                                group,
                                event.target
                                  .checked
                              )
                            }
                          />

                          Select group
                        </label>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.permissions.map(
                          (permission) => {
                            const selected =
                              selectedPermissions.includes(
                                permission
                              )

                            return (
                              <label
                                key={
                                  permission
                                }
                                className={
                                  selected
                                    ? "flex cursor-pointer items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3"
                                    : "flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    selected
                                  }
                                  disabled={
                                    isSuperAdministrator
                                  }
                                  className="mt-0.5 size-4 accent-violet-700 disabled:opacity-50"
                                  onChange={(
                                    event
                                  ) =>
                                    togglePermission(
                                      permission,
                                      event.target
                                        .checked
                                    )
                                  }
                                />

                                <span>
                                  <span className="block text-sm font-medium">
                                    {
                                      SETTINGS_PERMISSION_LABELS[
                                        permission
                                      ]
                                    }
                                  </span>

                                  <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                                    {permission}
                                  </span>
                                </span>
                              </label>
                            )
                          }
                        )}
                      </div>
                    </article>
                  )
                }
              )}
            </div>

            {errors.permissions
              ?.message ? (
              <p
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {
                  errors.permissions
                    .message
                }
              </p>
            ) : null}
          </section>

          <section className="space-y-2 border-t pt-5">
            <Label htmlFor="settings-role-updated-by">
              Responsible staff member
            </Label>

            <Input
              id="settings-role-updated-by"
              placeholder="Synthetic Settings Administrator"
              {...register(
                "updatedBy"
              )}
            />

            {errors.updatedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.updatedBy
                    .message
                }
              </p>
            ) : null}
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {SETTINGS_SYNTHETIC_NOTICE}
              Permission changes are retained
              in the append-only Settings
              audit ledger.
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
            form="role-settings-form"
            disabled={isSubmitting}
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving role
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                {creating
                  ? "Create role"
                  : "Save role"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
