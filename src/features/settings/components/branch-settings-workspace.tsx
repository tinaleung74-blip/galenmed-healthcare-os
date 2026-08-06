"use client"

import {
  useMemo,
  useState,
} from "react"
import {
  MapPin,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BranchSettingsDialog } from "@/features/settings/components/branch-settings-dialog"
import {
  SettingsActiveStatusBadge,
} from "@/features/settings/components/settings-status-badges"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import type {
  BranchSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"

type BranchStatusFilter =
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

export function BranchSettingsWorkspace() {
  const {
    settings,
    updateBranchSettings,
  } = useSettings()

  const [search, setSearch] =
    useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<BranchStatusFilter>(
      "all"
    )

  const [
    editingBranchId,
    setEditingBranchId,
  ] = useState<string | null>(
    null
  )

  const filteredBranches =
    useMemo(
      () =>
        settings.branches
          .filter((branch) => {
            const matchesSearch =
              normalizeSearch(
                branch.displayName,
                branch.code,
                branch.address,
                branch.phoneNumber,
                branch.emailAddress,
                branch.timezone
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
                branch.active
              ) ||
              (
                statusFilter ===
                  "inactive" &&
                !branch.active
              )

            return (
              matchesSearch &&
              matchesStatus
            )
          })
          .sort(
            (
              firstBranch,
              secondBranch
            ) =>
              firstBranch.displayName.localeCompare(
                secondBranch.displayName,
                "en-PH"
              )
          ),
      [
        search,
        settings.branches,
        statusFilter,
      ]
    )

  const editingBranch =
    settings.branches.find(
      (branch) =>
        branch.branchId ===
        editingBranchId
    ) ?? null

  const activeCount =
    settings.branches.filter(
      (branch) =>
        branch.active
    ).length

  const inactiveCount =
    settings.branches.length -
    activeCount

  async function handleSubmitBranch(
    values:
      BranchSettingsFormValues
  ) {
    const updatedBranch =
      updateBranchSettings(
        values
      )

    toast.success(
      "Branch configuration saved",
      {
        description: `${updatedBranch.displayName} is now ${
          updatedBranch.active
            ? "active"
            : "inactive"
        }.`,
      }
    )
  }

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
            <MapPin
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Branch Configuration
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure branch names,
              codes, contact information,
              timezone, and active status.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Configured branches
              </p>

              <p className="mt-1 text-xl font-semibold">
                {settings.branches.length}
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
                {inactiveCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 rounded-xl border bg-background p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={search}
                placeholder="Search branch name, code, address, or contact"
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
                    BranchStatusFilter
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
            {filteredBranches.length} of{" "}
            {settings.branches.length} branch
            configurations
          </p>
        </div>

        {filteredBranches.length ===
        0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <MapPin
              className="mx-auto size-7 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="mt-3 font-medium">
              No matching branches
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredBranches.map(
              (branch) => (
                <article
                  key={branch.branchId}
                  className="min-w-0 rounded-xl border bg-background p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold [overflow-wrap:anywhere]">
                        {
                          branch.displayName
                        }
                      </p>

                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {branch.code}
                      </p>
                    </div>

                    <SettingsActiveStatusBadge
                      active={
                        branch.active
                      }
                    />
                  </div>

                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        Address
                      </dt>

                      <dd className="mt-1 break-words [overflow-wrap:anywhere]">
                        {branch.address ||
                          "Not configured"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Timezone
                      </dt>

                      <dd className="mt-1">
                        {branch.timezone}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        Phone
                      </dt>

                      <dd className="mt-1 break-words [overflow-wrap:anywhere]">
                        {branch.phoneNumber ??
                          "Not configured"}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        Email
                      </dt>

                      <dd className="mt-1 break-words [overflow-wrap:anywhere]">
                        {branch.emailAddress ??
                          "Not configured"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex justify-end border-t pt-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingBranchId(
                          branch.branchId
                        )
                      }
                    >
                      <Settings2
                        aria-hidden="true"
                      />
                      Edit branch
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
            Branches originate from the
            canonical GalenMed branch
            registry. This page edits their
            configuration but does not
            delete canonical branch
            identities.
          </p>
        </div>
      </section>

      <BranchSettingsDialog
        branch={editingBranch}
        open={Boolean(
          editingBranch
        )}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingBranchId(
              null
            )
          }
        }}
        onSubmitBranch={
          handleSubmitBranch
        }
      />
    </>
  )
}
