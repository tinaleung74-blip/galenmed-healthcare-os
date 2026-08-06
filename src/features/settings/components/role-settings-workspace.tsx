"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  UserCog,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RoleSettingsDialog } from "@/features/settings/components/role-settings-dialog"
import {
  SettingsActiveStatusBadge,
  SettingsSystemRoleBadge,
} from "@/features/settings/components/settings-status-badges"
import {
  SETTINGS_PERMISSION_LABELS,
} from "@/features/settings/constants/settings.constants"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import type {
  RoleSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"

type RoleStatusFilter =
  | "all"
  | "active"
  | "inactive"

type RoleTypeFilter =
  | "all"
  | "system"
  | "custom"

function normalizeSearch(
  ...values: Array<
    string | null | undefined
  >
): string {
  return values
    .filter(
      (
        value
      ): value is string =>
        typeof value ===
        "string"
    )
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase(
      "en-PH"
    )
}

export function RoleSettingsWorkspace() {
  const {
    settings,
    saveRoleSettings,
  } = useSettings()

  const [search, setSearch] =
    useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<RoleStatusFilter>(
      "all"
    )

  const [
    roleTypeFilter,
    setRoleTypeFilter,
  ] =
    useState<RoleTypeFilter>(
      "all"
    )

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    editingRoleId,
    setEditingRoleId,
  ] = useState<string | null>(
    null
  )

  const filteredRoles =
    useMemo(
      () =>
        settings.roles
          .filter((role) => {
            const permissionLabels =
              role.permissions
                .map(
                  (permission) =>
                    SETTINGS_PERMISSION_LABELS[
                      permission
                    ]
                )
                .join(" ")

            const matchesSearch =
              normalizeSearch(
                role.name,
                role.code,
                role.description,
                permissionLabels
              ).includes(
                normalizeSearch(
                  search
                )
              )

            const matchesStatus =
              statusFilter ===
                "all" ||
              (
                statusFilter ===
                  "active" &&
                role.active
              ) ||
              (
                statusFilter ===
                  "inactive" &&
                !role.active
              )

            const matchesType =
              roleTypeFilter ===
                "all" ||
              (
                roleTypeFilter ===
                  "system" &&
                role.systemRole
              ) ||
              (
                roleTypeFilter ===
                  "custom" &&
                !role.systemRole
              )

            return (
              matchesSearch &&
              matchesStatus &&
              matchesType
            )
          })
          .sort(
            (
              firstRole,
              secondRole
            ) =>
              Number(
                secondRole.systemRole
              ) -
                Number(
                  firstRole.systemRole
                ) ||
              firstRole.name.localeCompare(
                secondRole.name,
                "en-PH"
              )
          ),
      [
        roleTypeFilter,
        search,
        settings.roles,
        statusFilter,
      ]
    )

  const editingRole =
    settings.roles.find(
      (role) =>
        role.id ===
        editingRoleId
    ) ?? null

  const activeCount =
    settings.roles.filter(
      (role) =>
        role.active
    ).length

  const systemRoleCount =
    settings.roles.filter(
      (role) =>
        role.systemRole
    ).length

  const customRoleCount =
    settings.roles.length -
    systemRoleCount

  async function handleSubmitRole(
    values:
      RoleSettingsFormValues
  ) {
    const role =
      saveRoleSettings(values)

    toast.success(
      values.id
        ? "Role configuration saved"
        : "Custom role created",
      {
        description: `${role.name} has ${role.permissions.length} assigned permission${
          role.permissions.length ===
          1
            ? ""
            : "s"
        }.`,
      }
    )
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
              <UserCog
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Roles and Permissions
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure system and custom
                roles with module-specific
                access permissions.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="bg-violet-700 text-white hover:bg-violet-800"
            onClick={() =>
              setIsCreateDialogOpen(
                true
              )
            }
          >
            <Plus aria-hidden="true" />
            Create custom role
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Configured roles
              </p>

              <p className="mt-1 text-xl font-semibold">
                {settings.roles.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Active roles
              </p>

              <p className="mt-1 text-xl font-semibold text-emerald-800">
                {activeCount}
              </p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-violet-700">
                System roles
              </p>

              <p className="mt-1 text-xl font-semibold text-violet-800">
                {systemRoleCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Custom roles
              </p>

              <p className="mt-1 text-xl font-semibold">
                {customRoleCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search role, code, description, or permission"
                className="pl-8"
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              value={statusFilter}
              className="h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    RoleStatusFilter
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

            <select
              value={roleTypeFilter}
              className="h-8 min-w-40 rounded-lg border border-input bg-background px-2.5 text-sm"
              onChange={(event) =>
                setRoleTypeFilter(
                  event.target
                    .value as
                    RoleTypeFilter
                )
              }
            >
              <option value="all">
                All role types
              </option>

              <option value="system">
                System roles
              </option>

              <option value="custom">
                Custom roles
              </option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {filteredRoles.length} of{" "}
            {settings.roles.length} roles
          </p>
        </div>

        {filteredRoles.length ===
        0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <UserCog
              className="mx-auto size-7 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="mt-3 font-medium">
              No matching roles
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRoles.map(
              (role) => (
                <article
                  key={role.id}
                  className="min-w-0 rounded-xl border bg-background p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold [overflow-wrap:anywhere]">
                        {role.name}
                      </p>

                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {role.code}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <SettingsSystemRoleBadge
                        systemRole={
                          role.systemRole
                        }
                      />

                      <SettingsActiveStatusBadge
                        active={
                          role.active
                        }
                      />
                    </div>
                  </div>

                  <p className="mt-4 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                    {role.description ??
                      "No role description configured."}
                  </p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned permissions
                      </p>

                      <span className="text-xs font-medium">
                        {
                          role.permissions
                            .length
                        }
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {role.permissions
                        .slice(0, 6)
                        .map(
                          (permission) => (
                            <span
                              key={`${role.id}-${permission}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {
                                SETTINGS_PERMISSION_LABELS[
                                  permission
                                ]
                              }
                            </span>
                          )
                        )}

                      {role.permissions.length >
                      6 ? (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                          +
                          {role.permissions
                            .length - 6}{" "}
                          more
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end border-t pt-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingRoleId(
                          role.id
                        )
                      }
                    >
                      <Settings2
                        aria-hidden="true"
                      />
                      Edit role
                    </Button>
                  </div>
                </article>
              )
            )}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            System roles may be configured,
            but protected identifiers and
            Super Administrator permissions
            cannot be removed.
          </p>
        </div>
      </section>

      <RoleSettingsDialog
        role={null}
        creating
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitRole={
          handleSubmitRole
        }
      />

      <RoleSettingsDialog
        role={editingRole}
        creating={false}
        open={Boolean(
          editingRole
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingRoleId(null)
          }
        }}
        onSubmitRole={
          handleSubmitRole
        }
      />
    </>
  )
}
