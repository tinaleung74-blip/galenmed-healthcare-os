"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Eye, Search } from "lucide-react"
import Link from "next/link"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StaffContext } from "@/features/auth/types/staff-auth.types"
import { DoctorPrescriptionStatusBadge } from "@/features/hospital-operations/components/doctor-prescription-badges"
import { ReceptionPrescriptionReviewDialog } from "@/features/hospital-operations/components/reception-prescription-review-dialog"
import type { ReceptionPrescriptionReviewRecord } from "@/features/hospital-operations/types/doctor-prescription.types"
import { formatPrescriptionDateTime } from "@/features/hospital-operations/utils/doctor-prescription.utils"
import { cn } from "@/lib/utils"

export function ReceptionPrescriptionReviewWorkspace({ context, records }: { context: StaffContext; records: ReceptionPrescriptionReviewRecord[] }) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? records.find((record) => record.prescriptionId === selectedId) ?? null : null
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return records
    return records.filter((record) => [record.prescriptionNumber, record.patientName, record.medicalRecordNumber, record.doctorName, record.consultationNumber].join(" ").toLowerCase().includes(query))
  }, [records, search])

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"><div className="flex items-center gap-3"><GalenMedLogo size="md" priority className="rounded-xl bg-white p-1 ring-1 ring-slate-200" /><div><p className="font-semibold">GalenMed</p><p className="text-xs text-muted-foreground">Reception Prescription Review</p></div></div><Link href="/reception/dashboard" className={cn(buttonVariants({ variant: "outline" }))}><ArrowLeft aria-hidden="true" /> Dashboard</Link></div></header>
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section><p className="text-sm font-medium text-teal-700">Operational review</p><h1 className="mt-1 text-2xl font-semibold">Submitted Prescriptions</h1><p className="mt-2 text-sm text-muted-foreground">Verify patient and consultation context, then return or approve Doctor-signed prescriptions. Signed in as {context.fullName}.</p></section>
        <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={search} className="pl-9" placeholder="Search patient, MRN, Doctor, or prescription" onChange={(event) => setSearch(event.target.value)} /></div>
        <div className="overflow-x-auto rounded-xl border bg-white"><Table className="min-w-[1100px]"><TableHeader><TableRow><TableHead>Prescription</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead>Release</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{filtered.map((record) => <TableRow key={record.prescriptionId}><TableCell><p className="font-mono text-xs font-semibold">{record.prescriptionNumber}</p><p className="mt-1 text-xs text-muted-foreground">Revision {record.revisionNumber}</p></TableCell><TableCell><p className="font-medium">{record.patientName}</p><p className="font-mono text-xs text-muted-foreground">{record.medicalRecordNumber}</p></TableCell><TableCell>{record.doctorName}</TableCell><TableCell><DoctorPrescriptionStatusBadge status={record.status} /></TableCell><TableCell>{formatPrescriptionDateTime(record.submittedAt)}</TableCell><TableCell className="capitalize">{record.releaseStatus?.replace(/_/g, " ") ?? "Not ready"}</TableCell><TableCell><Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(record.prescriptionId)}><Eye aria-hidden="true" /> Review</Button></TableCell></TableRow>)}</TableBody></Table></div>
      </div>
      <ReceptionPrescriptionReviewDialog record={selected} open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null) }} />
    </main>
  )
}
