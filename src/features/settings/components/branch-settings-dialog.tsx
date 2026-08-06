"use client"

import {
  useEffect,
} from "react"
import {
  zodResolver,
} from "@hookform/resolvers/zod"
import {
  useForm,
} from "react-hook-form"
import {
  LoaderCircle,
  MapPin,
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
  SettingsActiveStatusBadge,
} from "@/features/settings/components/settings-status-badges"
import {
  branchSettingsFormSchema,
  type BranchSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import type {
  BranchSettings,
} from "@/features/settings/types/settings.types"

interface BranchSettingsDialogProps {
  branch:
    | BranchSettings
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitBranch: (
    values:
      BranchSettingsFormValues
  ) => Promise<void>
}

function getDefaultValues(
  branch:
    BranchSettings | null
): BranchSettingsFormValues {
  return {
    branchId:
      branch?.branchId ?? "",

    displayName:
      branch?.displayName ?? "",

    code:
      branch?.code ?? "",

    address:
      branch?.address ?? "",

    phoneNumber:
      branch?.phoneNumber ??
      "",

    emailAddress:
      branch?.emailAddress ??
      "",

    timezone:
      branch?.timezone ??
      "Asia/Manila",

    active:
      branch?.active ??
      true,

    updatedBy: "",
  }
}

export function BranchSettingsDialog({
  branch,
  open,
  onOpenChange,
  onSubmitBranch,
}: BranchSettingsDialogProps) {
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
    useForm<BranchSettingsFormValues>(
      {
        resolver: zodResolver(
          branchSettingsFormSchema
        ),

        defaultValues:
          getDefaultValues(
            branch
          ),

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        getDefaultValues(
          branch
        )
      )
    }
  }, [
    branch,
    open,
    reset,
  ])

  if (!branch) {
    return null
  }

  async function submitBranch(
    values:
      BranchSettingsFormValues
  ) {
    try {
      await onSubmitBranch(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The branch configuration could not be saved.",
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
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <MapPin
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Edit branch configuration
          </DialogTitle>

          <DialogDescription>
            Update the configuration for{" "}
            {branch.displayName}.
          </DialogDescription>

          <div className="pt-2">
            <SettingsActiveStatusBadge
              active={branch.active}
            />
          </div>
        </DialogHeader>

        <form
          id="branch-settings-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitBranch
          )}
        >
          <input
            type="hidden"
            {...register(
              "branchId"
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branch-display-name">
                Branch display name
              </Label>

              <Input
                id="branch-display-name"
                {...register(
                  "displayName"
                )}
              />

              {errors.displayName
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.displayName
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-code">
                Branch code
              </Label>

              <Input
                id="branch-code"
                {...register("code")}
              />

              {errors.code?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.code.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-phone">
                Phone number
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="branch-phone"
                {...register(
                  "phoneNumber"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-email">
                Email address
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Input
                id="branch-email"
                type="email"
                {...register(
                  "emailAddress"
                )}
              />

              {errors.emailAddress
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.emailAddress
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="branch-address">
                Branch address
              </Label>

              <Textarea
                id="branch-address"
                rows={4}
                {...register(
                  "address"
                )}
              />

              {errors.address
                ?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {
                    errors.address
                      .message
                  }
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-timezone">
                Timezone
              </Label>

              <Input
                id="branch-timezone"
                {...register(
                  "timezone"
                )}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-slate-50 p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-sky-700"
                {...register("active")}
              />

              <span>
                <span className="block text-sm font-medium">
                  Branch active
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Inactive branches remain
                  in configuration history.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-updated-by">
              Responsible staff member
            </Label>

            <Input
              id="branch-updated-by"
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
              Branch records are retained
              when deactivated. They are not
              deleted from configuration
              history.
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
            form="branch-settings-form"
            disabled={isSubmitting}
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving branch
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save branch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
