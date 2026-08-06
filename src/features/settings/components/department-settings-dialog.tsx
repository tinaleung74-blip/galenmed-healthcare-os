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
  Blocks,
  LoaderCircle,
  Save,
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
import { Textarea } from "@/components/ui/textarea"
import {
  departmentSettingsFormSchema,
  type DepartmentSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import type {
  BranchSettings,
  DepartmentSettings,
} from "@/features/settings/types/settings.types"

interface DepartmentSettingsDialogProps {
  department:
    | DepartmentSettings
    | null

  branches:
    readonly BranchSettings[]

  creating: boolean

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitDepartment: (
    values:
      DepartmentSettingsFormValues
  ) => Promise<void>
}

function getDefaultValues({
  department,
  branches,
  creating,
}: {
  department:
    | DepartmentSettings
    | null

  branches:
    readonly BranchSettings[]

  creating: boolean
}): DepartmentSettingsFormValues {
  return {
    id:
      creating
        ? ""
        : department?.id ??
          "",

    code:
      creating
        ? ""
        : department?.code ??
          "",

    name:
      creating
        ? ""
        : department?.name ??
          "",

    description:
      creating
        ? ""
        : department?.description ??
          "",

    branchIds:
      creating
        ? branches
            .filter(
              (branch) =>
                branch.active
            )
            .map(
              (branch) =>
                branch.branchId
            )
        : [
            ...(
              department?.branchIds ??
              []
            ),
          ],

    active:
      creating
        ? true
        : department?.active ??
          true,

    updatedBy: "",
  }
}

export function DepartmentSettingsDialog({
  department,
  branches,
  creating,
  open,
  onOpenChange,
  onSubmitDepartment,
}: DepartmentSettingsDialogProps) {
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
    useForm<DepartmentSettingsFormValues>(
      {
        resolver: zodResolver(
          departmentSettingsFormSchema
        ),

        defaultValues:
          getDefaultValues({
            department,
            branches,
            creating,
          }),

        mode: "onTouched",
      }
    )

  const selectedBranchIds =
    useWatch({
      control,
      name: "branchIds",
    }) ?? []

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues({
          department,
          branches,
          creating,
        })
      )
    }
  }, [
    branches,
    creating,
    department,
    open,
    reset,
  ])

  function toggleBranch(
    branchId: string,
    selected: boolean
  ) {
    const nextBranchIds =
      selected
        ? Array.from(
            new Set([
              ...selectedBranchIds,
              branchId,
            ])
          )
        : selectedBranchIds.filter(
            (selectedBranchId) =>
              selectedBranchId !==
              branchId
          )

    setValue(
      "branchIds",
      nextBranchIds,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    )
  }

  async function submitDepartment(
    values:
      DepartmentSettingsFormValues
  ) {
    try {
      await onSubmitDepartment(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The department configuration could not be saved.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Blocks
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {creating
              ? "Create department"
              : "Edit department"}
          </DialogTitle>

          <DialogDescription>
            Configure the department name,
            code, assigned branches, and
            active status.
          </DialogDescription>
        </DialogHeader>

        <form
          id="department-settings-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitDepartment
          )}
        >
          <input
            type="hidden"
            {...register("id")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department-code">
                Department code
              </Label>

              <Input
                id="department-code"
                {...register("code")}
              />

              {errors.code?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.code.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-name">
                Department name
              </Label>

              <Input
                id="department-name"
                {...register("name")}
              />

              {errors.name?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="department-description">
                Description
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="department-description"
                rows={4}
                {...register(
                  "description"
                )}
              />
            </div>
          </div>

          <section className="space-y-3 border-t pt-5">
            <div>
              <h3 className="text-sm font-semibold">
                Assigned branches
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Select at least one branch
                for this department.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {branches.map(
                (branch) => {
                  const selected =
                    selectedBranchIds.includes(
                      branch.branchId
                    )

                  return (
                    <label
                      key={branch.branchId}
                      className={
                        selected
                          ? "flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4"
                          : "flex cursor-pointer items-start gap-3 rounded-xl border p-4"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        className="mt-1 size-4 accent-violet-700"
                        onChange={(
                          event
                        ) =>
                          toggleBranch(
                            branch.branchId,
                            event.target
                              .checked
                          )
                        }
                      />

                      <span>
                        <span className="block text-sm font-medium">
                          {
                            branch.displayName
                          }
                        </span>

                        <span className="mt-1 block font-mono text-xs text-muted-foreground">
                          {branch.code}
                        </span>
                      </span>
                    </label>
                  )
                }
              )}
            </div>

            {errors.branchIds
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.branchIds
                    .message
                }
              </p>
            ) : null}
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-violet-700"
              {...register("active")}
            />

            <span>
              <span className="block text-sm font-medium">
                Department active
              </span>

              <span className="mt-1 block text-xs text-muted-foreground">
                Inactive departments remain
                in configuration and audit
                history.
              </span>
            </span>
          </label>

          <div className="space-y-2">
            <Label htmlFor="department-updated-by">
              Responsible staff member
            </Label>

            <Input
              id="department-updated-by"
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
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Department changes are
              retained in the Settings
              audit ledger. Records are
              deactivated rather than
              deleted.
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
            form="department-settings-form"
            disabled={isSubmitting}
            className="bg-violet-700 text-white hover:bg-violet-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving department
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                {creating
                  ? "Create department"
                  : "Save department"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
