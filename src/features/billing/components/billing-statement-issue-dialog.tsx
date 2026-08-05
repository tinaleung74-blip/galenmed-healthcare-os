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
  FileCheck2,
  LoaderCircle,
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
import {
  BillingStatementStatusBadge,
} from "@/features/billing/components/billing-status-badges"
import {
  BILLING_SYNTHETIC_NOTICE,
} from "@/features/billing/constants/billing.constants"
import {
  billingStatementIssueSchema,
  type BillingStatementIssueValues,
} from "@/features/billing/schemas/billing-statement.schema"
import type {
  BillingStatement,
} from "@/features/billing/types/billing.types"
import {
  formatBillingAmount,
} from "@/features/billing/utils/billing.utils"

interface BillingStatementIssueDialogProps {
  statement:
    | BillingStatement
    | null

  open: boolean

  onOpenChange: (
    open: boolean
  ) => void

  onSubmitIssue: (
    values:
      BillingStatementIssueValues
  ) => Promise<void>
}

const EMPTY_ISSUE_VALUES:
  BillingStatementIssueValues = {
  issuedBy: "",
  issueConfirmed: false,
}

export function BillingStatementIssueDialog({
  statement,
  open,
  onOpenChange,
  onSubmitIssue,
}: BillingStatementIssueDialogProps) {
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
    useForm<BillingStatementIssueValues>(
      {
        resolver: zodResolver(
          billingStatementIssueSchema
        ),

        defaultValues:
          EMPTY_ISSUE_VALUES,

        mode: "onTouched",
      }
    )

  useEffect(() => {
    if (open) {
      reset(
        EMPTY_ISSUE_VALUES
      )
    }
  }, [open, reset])

  if (!statement) {
    return null
  }

  async function submitIssue(
    values:
      BillingStatementIssueValues
  ) {
    try {
      await onSubmitIssue(values)

      onOpenChange(false)
    } catch (error) {
      setError("root", {
        type: "manual",

        message:
          error instanceof Error
            ? error.message
            : "The billing statement could not be issued.",
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <FileCheck2
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            Issue billing statement
          </DialogTitle>

          <DialogDescription>
            {statement.statementNumber}
            {" · "}
            Issue the current draft totals
            and make the statement eligible
            for payment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Current status
            </p>

            <div className="mt-2">
              <BillingStatementStatusBadge
                status={
                  statement.status
                }
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Posted charges
            </p>

            <p className="mt-1 font-semibold">
              {statement.chargeIds.length}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Net charges
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.netChargeAmountCentavos
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Patient responsibility
            </p>

            <p className="mt-1 font-semibold">
              {formatBillingAmount(
                statement.patientResponsibilityCentavos
              )}
            </p>
          </div>
        </div>

        <form
          id="billing-statement-issue-form"
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(
            submitIssue
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="billing-statement-issued-by">
              Issued by
            </Label>

            <Input
              id="billing-statement-issued-by"
              placeholder="Synthetic Billing Officer"
              {...register("issuedBy")}
            />

            {errors.issuedBy
              ?.message ? (
              <p className="text-xs font-medium text-destructive">
                {
                  errors.issuedBy
                    .message
                }
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-sky-700"
              {...register(
                "issueConfirmed"
              )}
            />

            <span className="text-sm text-sky-900">
              I confirm that the synthetic
              charges, adjustments, coverage
              allocations, and patient
              responsibility were reviewed
              before issuing this statement.
            </span>
          </label>

          {errors.issueConfirmed
            ?.message ? (
            <p className="text-xs font-medium text-destructive">
              {
                errors.issueConfirmed
                  .message
              }
            </p>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />

            <p>
              {BILLING_SYNTHETIC_NOTICE}
              Issuing this development
              statement does not create a
              real invoice.
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
            form="billing-statement-issue-form"
            disabled={isSubmitting}
            className="bg-sky-700 text-white hover:bg-sky-800"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Issuing statement
              </>
            ) : (
              <>
                <FileCheck2
                  aria-hidden="true"
                />
                Issue statement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
