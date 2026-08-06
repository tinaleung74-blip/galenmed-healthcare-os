"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  Blocks,
  Plus,
  Search,
  Settings2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DepartmentSettingsDialog } from "@/features/settings/components/department-settings-dialog"
import {
  SettingsActiveStatusBadge,
} from "@/features/settings/components/settings-status-badges"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import type {
  DepartmentSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"

type DepartmentStatusFilter =
  | "all"
  | "active"
  | "inactive"

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

export function DepartmentSettingsWorkspace() {
  const {
    settings,
    saveDepartmentSettings,
  } = useSettings()

  const [search, setSearch] =
    useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<DepartmentStatusFilter>(
      "all"
    )

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  ] = useState(false)

  const [
    editingDepartmentId,
    setEditingDepartmentId,
  ] = useState<string | null>(
    null
  )

  const filteredDepartments =
    useMemo(
      () =>
        settings.departments
          .filter(
            (department) => {
              const branchNames =
                department.branchIds
                  .map(
                    (branchId) =>
                      settings.branches.find(
                        (branch) =>
                          branch.branchId ===
                          branchId
                      )?.displayName ??
                      branchId
                  )
                  .join(" ")

              const matchesSearch =
                normalizeSearch(
                  department.name,
                  department.code,
                  department.description,
                  branchNames
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
                  department.active
                ) ||
                (
                  statusFilter ===
                    "inactive" &&
                  !department.active
                )

              return (
                matchesSearch &&
                matchesStatus
              )
            }
          )
          .sort(
            (
              firstDepartment,
              secondDepartment
            ) =>
              firstDepartment.name.localeCompare(
                secondDepartment.name,
                "en-PH"
              )
          ),
      [
        search,
        settings.branches,
        settings.departments,
        statusFilter,
      ]
    )

  const editingDepartment =
    settings.departments.find(
      (department) =>
        department.id ===
        editingDepartmentId
    ) ?? null

  const activeCount =
    settings.departments.filter(
      (department) =>
        department.active
    ).length

  async function handleSubmitDepartment(
    values:
      DepartmentSettingsFormValues
  ) {
    const department =
      saveDepartmentSettings(
        values
      )

    toast.success(
      values.id
        ? "Department configuration saved"
        : "Department created",
      {
        description: `${department.name} is now ${
          department.active
            ? "active"
            : "inactive"
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
              <Blocks
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Department Management
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure departments,
                branch assignments, and
                operational status.
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
            Create department
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Departments
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  settings.departments
                    .length
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">
                Active
              </p>

              <p className="mt-1 text-xl font-semibold text-emerald-800">
                {activeCount}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Inactive
              </p>

              <p className="mt-1 text-xl font-semibold">
                {settings.departments.length -
                  activeCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search department, code, description, or branch"
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
                    DepartmentStatusFilter
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
          </div>

          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {filteredDepartments.length} of{" "}
            {settings.departments.length} departments
          </p>
        </div>

        {filteredDepartments.length ===
        0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Blocks
              className="mx-auto size-7 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="mt-3 font-medium">
              No matching departments
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDepartments.map(
              (department) => {
                const assignedBranches =
                  department.branchIds
                    .map(
                      (branchId) =>
                        settings.branches.find(
                          (branch) =>
                            branch.branchId ===
                            branchId
                        )?.displayName ??
                        branchId
                    )

                return (
                  <article
                    key={department.id}
                    className="min-w-0 rounded-xl border bg-background p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold [overflow-wrap:anywhere]">
                          {department.name}
                        </p>

                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {department.code}
                        </p>
                      </div>

                      <SettingsActiveStatusBadge
                        active={
                          department.active
                        }
                      />
                    </div>

                    <p className="mt-4 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                      {department.description ??
                        "No department description configured."}
                    </p>

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assigned branches
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {assignedBranches.map(
                          (branchName) => (
                            <span
                              key={`${department.id}-${branchName}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {branchName}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end border-t pt-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditingDepartmentId(
                            department.id
                          )
                        }
                      >
                        <Settings2
                          aria-hidden="true"
                        />
                        Edit department
                      </Button>
                    </div>
                  </article>
                )
              }
            )}
          </div>
        )}
      </section>

      <DepartmentSettingsDialog
        department={null}
        branches={
          settings.branches
        }
        creating
        open={isCreateDialogOpen}
        onOpenChange={
          setIsCreateDialogOpen
        }
        onSubmitDepartment={
          handleSubmitDepartment
        }
      />

      <DepartmentSettingsDialog
        department={
          editingDepartment
        }
        branches={
          settings.branches
        }
        creating={false}
        open={Boolean(
          editingDepartment
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingDepartmentId(
              null
            )
          }
        }}
        onSubmitDepartment={
          handleSubmitDepartment
        }
      />
    </>
  )
}
