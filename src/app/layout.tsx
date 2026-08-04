import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { AppointmentAuditProvider } from "@/features/appointments/providers/appointment-audit-provider"
import { AppointmentProvider } from "@/features/appointments/providers/appointment-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LaboratoryProvider } from "@/features/laboratory/providers/laboratory-provider"
import { LaboratoryResultProvider } from "@/features/laboratory/providers/laboratory-result-provider"
import { ConsultationDiagnosisProvider } from "@/features/consultations/providers/consultation-diagnosis-provider"
import { ConsultationEmrProvider } from "@/features/consultations/providers/consultation-emr-provider"
import { ConsultationFinalizationProvider } from "@/features/consultations/providers/consultation-finalization-provider"
import { ConsultationPrescriptionProvider } from "@/features/consultations/providers/consultation-prescription-provider"
import { ConsultationProvider } from "@/features/consultations/providers/consultation-provider"
import { PatientAllergyProvider } from "@/features/patients/providers/patient-allergy-provider"
import { PatientDocumentsProvider } from "@/features/patients/providers/patient-documents-provider"
import { PatientInsuranceProvider } from "@/features/patients/providers/patient-insurance-provider"
import { PatientMedicalHistoryProvider } from "@/features/patients/providers/patient-medical-history-provider"
import { PatientProvider } from "@/features/patients/providers/patient-provider"
import { PatientVitalSignsProvider } from "@/features/patients/providers/patient-vital-signs-provider"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "GalenMed Healthcare OS",
  description:
    "Healthcare operating system for clinics and hospitals",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <PatientProvider>
            <PatientMedicalHistoryProvider>
              <PatientVitalSignsProvider>
                <PatientAllergyProvider>
                  <PatientInsuranceProvider>
                    <PatientDocumentsProvider>
                      <AppointmentProvider>
                        <AppointmentAuditProvider>
                          <ConsultationProvider>
                        <ConsultationEmrProvider>
                          <ConsultationDiagnosisProvider>
                            <ConsultationPrescriptionProvider>
                              <ConsultationFinalizationProvider>
                                <LaboratoryProvider>
                                  <LaboratoryResultProvider>
                                    {children}
                                  </LaboratoryResultProvider>
                                </LaboratoryProvider>
                              </ConsultationFinalizationProvider>
                            </ConsultationPrescriptionProvider>
                          </ConsultationDiagnosisProvider>
                        </ConsultationEmrProvider>
                          </ConsultationProvider>
                        </AppointmentAuditProvider>
                      </AppointmentProvider>
                    </PatientDocumentsProvider>
                  </PatientInsuranceProvider>
                </PatientAllergyProvider>
              </PatientVitalSignsProvider>
            </PatientMedicalHistoryProvider>
          </PatientProvider>

          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
