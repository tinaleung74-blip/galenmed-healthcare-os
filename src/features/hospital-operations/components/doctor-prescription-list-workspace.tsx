import { ArrowLeft, FilePenLine, Pill, Plus } from "lucide-react"
import Link from "next/link"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StaffContext } from "@/features/auth/types/staff-auth.types"
import { DoctorPrescriptionStatusBadge } from "@/features/hospital-operations/components/doctor-prescription-badges"
import type { DoctorPrescriptionQueueRecord } from "@/features/hospital-operations/types/doctor-prescription.types"
import { formatPrescriptionDateTime } from "@/features/hospital-operations/utils/doctor-prescription.utils"
import { cn } from "@/lib/utils"

export function DoctorPrescriptionListWorkspace({
  context,
  records,
}: {
  context: StaffContext
  records: DoctorPrescriptionQueueRecord[]
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <GalenMedLogo size="md" priority className="rounded-xl bg-white p-1 ring-1 ring-slate-200" />
            <div><p className="font-semibold">GalenMed</p><p className="text-xs text-muted-foreground">Doctor Prescription Workspace</p></div>
          </div>
          <Link href="/doctor/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft aria-hidden="true" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-medium text-teal-700">Doctor-authored medicines</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Prescription Composer</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create, correct, and submit prescriptions for consultations assigned to {context.fullName}.</p>
        </section>

        <Card className="shadow-none">
          <CardContent className="p-0">
            {records.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <Pill className="size-9 text-teal-700" aria-hidden="true" />
                <h2 className="mt-4 font-semibold">No active consultations available</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">Complete or start an assigned Doctor consultation before preparing a prescription.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[1050px]">
                  <TableHeader><TableRow>
                    <TableHead>Patient</TableHead><TableHead>Consultation</TableHead><TableHead>Diagnosis</TableHead><TableHead>Prescription</TableHead><TableHead>Updated</TableHead><TableHead>Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.consultationId}>
                        <TableCell><p className="font-medium">{record.patientName}</p><p className="font-mono text-xs text-muted-foreground">{record.medicalRecordNumber}</p></TableCell>
                        <TableCell><p className="font-mono text-xs">{record.consultationNumber}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{record.consultationStatus.replace(/_/g, " ")}</p></TableCell>
                        <TableCell><p className="max-w-xs whitespace-normal">{record.diagnosisText ?? "Diagnosis not completed"}</p></TableCell>
                        <TableCell>{record.prescriptionStatus ? <DoctorPrescriptionStatusBadge status={record.prescriptionStatus} /> : <span className="text-sm text-muted-foreground">Not created</span>}</TableCell>
                        <TableCell>{formatPrescriptionDateTime(record.prescriptionUpdatedAt ?? record.completedAt)}</TableCell>
                        <TableCell>
                          <Link href={`/doctor/prescriptions/${record.consultationId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                            {record.prescriptionId ? <FilePenLine aria-hidden="true" /> : <Plus aria-hidden="true" />}
                            {record.prescriptionId ? "Open" : "Create"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
