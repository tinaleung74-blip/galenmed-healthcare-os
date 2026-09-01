"use client"

import {
  useTransition,
} from "react"
import {
  LoaderCircle,
  Printer,
} from "lucide-react"
import {
  toast,
} from "sonner"

import {
  Button,
} from "@/components/ui/button"
import {
  recordPatientPortalPrintRequestAction,
} from "@/features/patient-portal/actions/patient-portal-records.actions"

interface PatientPrintButtonProps {
  documentId:
    string
}

export function PatientPrintButton({
  documentId,
}: PatientPrintButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition()

  function handlePrint() {
    startTransition(
      async () => {
        const result =
          await recordPatientPortalPrintRequestAction(
            documentId
          )

        if (
          !result.success
        ) {
          toast.error(
            result.message
          )

          return
        }

        window.print()
      }
    )
  }

  return (
    <Button
      type="button"
      disabled={
        isPending
      }
      onClick={
        handlePrint
      }
    >
      {isPending ? (
        <LoaderCircle
          className="animate-spin"
          aria-hidden="true"
        />
      ) : (
        <Printer
          aria-hidden="true"
        />
      )}

      {isPending
        ? "Recording request"
        : "Print released copy"}
    </Button>
  )
}
