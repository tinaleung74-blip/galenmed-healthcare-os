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
  ShieldAlert,
  Undo2,
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
  billingReversalSchema,
  type BillingReversalValues,
} from "@/features/billing/schemas/billing-payment.schema"

interface BillingReversalDialogProps {
  title: string

  description: string

  reference:
    string | null

  actionLabel: string

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitReversal: (
    values:
      BillingReversalValues
  ) => Promise<void>
}

const EMPTY_REVERSAL_VALUES:
  BillingReversalValues = {
  reason: "",
  performedBy: "",
}

export function BillingReversalDialog({
  title,
  description,
  reference,
  actionLabel,
  open,
  onOpenChange,
  onSubmitReversal,
}: BillingReversalDialogProps) {
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
    useForm<BillingReversalValues>(
      {
        resolver: zodResolver(
          billingReversalSchema
        ),

        defaultValues:
          EMPTY_REVERSAL_VALUES,

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_REVERSAL_VALUES
      )
    }
  }, [open, reset])

  async function submitReversal(
    values:
      BillingReversalValues
  ) {
    try {
      await onSubmitReversal(
        values
      )

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The billing reversal could not be completed.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <ShieldAlert
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {title}
          </DialogTitle>

          <DialogDescription>
            {description}

            {reference ? (
              <>
                {" "}
                Reference:{" "}
                <span className="font-mono">
                  {reference}
                </span>
                .
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form
          id="billing-reversal-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitReversal
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="billing-reversal-reason">
              Reason
            </Label>

            <Textarea
              id="billing-reversal-reason"
              rows={4}
              placeholder="Document the synthetic reversal or void reason."
              {...register("reason")}
            />

            {errors.reason
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.reason
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-reversal-performed-by">
              Performed by
            </Label>

            <Input
              id="billing-reversal-performed-by"
              placeholder="Synthetic Billing Supervisor"
              {...register(
                "performedBy"
              )}
            />

            {errors.performedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.performedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              Reversal and void actions are
              retained in the synthetic
              development history. Records
              are not deleted.
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
            form="billing-reversal-form"
            variant="destructive"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Processing
              </>
            ) : (
              <>
                <Undo2
                  aria-hidden="true"
                />
                {actionLabel}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
