import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PatientMedicalHistoryProvider } from "@/features/patients/providers/patient-medical-history-provider"
import { PatientProvider } from "@/features/patients/providers/patient-provider"

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
              {children}
            </PatientMedicalHistoryProvider>
          </PatientProvider>

          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
