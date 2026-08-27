"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { approvePrescriptionForReleaseAction, returnPrescriptionForCorrectionAction } from "@/features/hospital-operations/actions/doctor-prescription.actions"
import type { ReceptionPrescriptionReviewRecord } from "@/features/hospital-operations/types/doctor-prescription.types"

export function ReceptionPrescriptionReviewDialog({ record, open, onOpenChange }: { record: ReceptionPrescriptionReviewRecord | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  if (!record) return null

  const prescriptionId =
    record.prescriptionId

  function returnForCorrection() {
    setErrorMessage(null)
    startTransition(async () => {
      const result = await returnPrescriptionForCorrectionAction({ prescriptionId, reason })
      if (!result.success) { setErrorMessage(result.message); return }
      onOpenChange(false); router.refresh()
    })
  }

  function approve() {
    setErrorMessage(null)
    startTransition(async () => {
      const result = await approvePrescriptionForReleaseAction({ prescriptionId, reviewNotes })
      if (!result.success) { setErrorMessage(result.message); return }
      onOpenChange(false); router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>Review Doctor Prescription</DialogTitle><DialogDescription>{record.prescriptionNumber} · {record.patientName} · {record.doctorName}</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Diagnosis</p><p className="mt-1 font-medium">{record.diagnosisText}</p></div><div><p className="text-xs text-muted-foreground">Consultation</p><p className="mt-1 font-mono text-sm">{record.consultationNumber}</p></div></div>
          <div className="space-y-3">{record.items.map((item) => <article key={item.id} className="rounded-xl border p-4"><p className="font-semibold">{item.genericName} {item.strength}</p><p className="mt-1 text-sm text-muted-foreground">{item.dose} · {item.route} · {item.frequency} · {item.duration}</p><p className="mt-1 text-sm">Quantity: {item.quantity} {item.quantityUnit}</p>{item.instructions ? <p className="mt-2 text-sm">{item.instructions}</p> : null}</article>)}</div>
          <div className="space-y-2"><Label htmlFor="prescription-return-reason">Correction reason</Label><Textarea id="prescription-return-reason" value={reason} rows={3} disabled={isPending || record.status !== "submitted"} onChange={(event) => setReason(event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="prescription-review-notes">Approval notes (optional)</Label><Textarea id="prescription-review-notes" value={reviewNotes} rows={3} disabled={isPending || record.status !== "submitted"} onChange={(event) => setReviewNotes(event.target.value)} /></div>
          {errorMessage ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending || record.status !== "submitted"} onClick={returnForCorrection}>{isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />} Return for correction</Button>
          <Button type="button" disabled={isPending || record.status !== "submitted"} className="bg-emerald-700 text-white hover:bg-emerald-800" onClick={approve}><CheckCircle2 aria-hidden="true" /> Approve for release</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
