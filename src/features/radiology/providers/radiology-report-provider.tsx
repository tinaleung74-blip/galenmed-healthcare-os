"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

import {
  useRadiology,
} from "@/features/radiology/providers/radiology-provider"
import type {
  RadiologyReportFormValues,
  RadiologyReportReleaseValues,
  RadiologyReportVerificationValues,
} from "@/features/radiology/schemas/radiology-report.schema"
import type {
  RadiologyCriticalCommunicationMethod,
  RadiologyReportRecord,
} from "@/features/radiology/types/radiology-report.types"
import {
  createTemporaryRadiologyId,
} from "@/features/radiology/utils/radiology.utils"
import {
  usePersistentDevelopmentState,
} from "@/hooks/use-persistent-development-state"

const RADIOLOGY_REPORT_STORAGE_KEY =
  "galenmed:development:radiology-reports:v1"

const INITIAL_RADIOLOGY_REPORTS:
  RadiologyReportRecord[] = []

interface RadiologyReportContextValue {
  reports: RadiologyReportRecord[]

  saveRadiologyReportDraft: (
    orderId: string,
    values:
      RadiologyReportFormValues
  ) => RadiologyReportRecord

  verifyRadiologyReport: (
    reportId: string,
    values:
      RadiologyReportVerificationValues
  ) => RadiologyReportRecord

  releaseRadiologyReport: (
    reportId: string,
    values:
      RadiologyReportReleaseValues
  ) => RadiologyReportRecord
}

const RadiologyReportContext =
  createContext<RadiologyReportContextValue | null>(
    null
  )

interface RadiologyReportProviderProps {
  children: ReactNode
}

function getReportOrThrow(
  reports:
    readonly RadiologyReportRecord[],
  reportId: string
): RadiologyReportRecord {
  const report =
    reports.find(
      (candidateReport) =>
        candidateReport.id ===
        reportId
    )

  if (!report) {
    throw new Error(
      "The radiology report was not found."
    )
  }

  return report
}

function replaceReport(
  reports:
    readonly RadiologyReportRecord[],
  updatedReport:
    RadiologyReportRecord
): RadiologyReportRecord[] {
  return reports.map((report) =>
    report.id === updatedReport.id
      ? updatedReport
      : report
  )
}

function normalizeDateTimeOrThrow(
  value: string
): string {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "The critical-finding communication date and time are invalid."
    )
  }

  return date.toISOString()
}

export function RadiologyReportProvider({
  children,
}: RadiologyReportProviderProps) {
  const {
    radiologyOrders,
    attachRadiologyReportToOrder,
    verifyRadiologyOrderReport,
    releaseRadiologyOrderReport,
  } = useRadiology()

  const [
    reports,
    setReports,
  ] =
    usePersistentDevelopmentState<
      RadiologyReportRecord[]
    >(
      RADIOLOGY_REPORT_STORAGE_KEY,
      INITIAL_RADIOLOGY_REPORTS
    )

  const reportsRef =
    useRef<RadiologyReportRecord[]>(
      reports
    )

  useEffect(() => {
    reportsRef.current = reports
  }, [reports])

  const saveRadiologyReportDraft =
    useCallback(
      (
        orderId: string,

        values:
          RadiologyReportFormValues
      ): RadiologyReportRecord => {
        const order =
          radiologyOrders.find(
            (candidateOrder) =>
              candidateOrder.id ===
              orderId
          )

        if (!order) {
          throw new Error(
            "The radiology order was not found."
          )
        }

        if (
          order.status !==
            "technically-completed" &&
          order.status !==
            "report-draft"
        ) {
          throw new Error(
            "Reporting is available only after technical completion."
          )
        }

        const existingReport =
          reportsRef.current.find(
            (report) =>
              report.orderId ===
              order.id
          ) ?? null

        if (
          existingReport &&
          existingReport.status !==
            "draft"
        ) {
          throw new Error(
            "Verified or released radiology reports cannot be edited."
          )
        }

        const now =
          new Date().toISOString()

        const draftedBy =
          values.draftedBy.trim()

        const reportId =
          existingReport?.id ??
          createTemporaryRadiologyId(
            "radiology-report"
          )

        attachRadiologyReportToOrder(
          order.id,
          reportId,
          draftedBy,
          now
        )

        const savedReport:
          RadiologyReportRecord = {
          id: reportId,

          orderId: order.id,

          patientId:
            order.patientId,

          procedureCode:
            order.procedureCode,

          procedureName:
            order.procedureName,

          modality:
            order.modality,

          bodyRegion:
            order.bodyRegion,

          status: "draft",

          version:
            existingReport
              ? existingReport.version +
                1
              : 1,

          findings:
            values.findings.trim(),

          impression:
            values.impression.trim(),

          recommendation:
            values.recommendation
              .trim() || null,

          findingLevel:
            values.findingLevel,

          criticalFindingSummary:
            values.findingLevel ===
            "critical"
              ? values
                  .criticalFindingSummary
                  .trim()
              : null,

          criticalCommunicatedAt:
            null,

          criticalCommunicatedBy:
            null,

          criticalCommunicatedTo:
            null,

          criticalCommunicationMethod:
            null,

          criticalCommunicationNote:
            null,

          draftedBy,
          draftedAt: now,

          verifiedBy: null,
          verifiedAt: null,

          radiologistRegistrationNumber:
            null,

          verificationNote: null,

          releasedBy: null,
          releasedAt: null,
          releaseNote: null,

          createdAt:
            existingReport?.createdAt ??
            now,

          updatedAt: now,
        }

        const nextReports =
          existingReport
            ? replaceReport(
                reportsRef.current,
                savedReport
              )
            : [
                savedReport,
                ...reportsRef.current,
              ]

        reportsRef.current =
          nextReports

        setReports(nextReports)

        return savedReport
      },
      [
        attachRadiologyReportToOrder,
        radiologyOrders,
        setReports,
      ]
    )

  const verifyRadiologyReport =
    useCallback(
      (
        reportId: string,

        values:
          RadiologyReportVerificationValues
      ): RadiologyReportRecord => {
        const report =
          getReportOrThrow(
            reportsRef.current,
            reportId
          )

        if (
          report.status ===
            "verified" ||
          report.status ===
            "released"
        ) {
          return report
        }

        if (
          report.status !== "draft"
        ) {
          throw new Error(
            "Only a report draft can be verified."
          )
        }

        const verifiedBy =
          values.verifiedBy.trim()

        let criticalCommunicatedAt:
          string | null = null

        let criticalCommunicatedBy:
          string | null = null

        let criticalCommunicatedTo:
          string | null = null

        let criticalCommunicationMethod:
          RadiologyCriticalCommunicationMethod | null =
          null

        let criticalCommunicationNote:
          string | null = null

        if (
          report.findingLevel ===
          "critical"
        ) {
          if (
            !values.criticalCommunicatedAt ||
            values.criticalCommunicatedBy
              .trim().length < 2 ||
            values.criticalCommunicatedTo
              .trim().length < 2 ||
            !values
              .criticalCommunicationMethod
          ) {
            throw new Error(
              "Critical findings require complete communication documentation before verification."
            )
          }

          criticalCommunicatedAt =
            normalizeDateTimeOrThrow(
              values
                .criticalCommunicatedAt
            )

          criticalCommunicatedBy =
            values
              .criticalCommunicatedBy
              .trim()

          criticalCommunicatedTo =
            values
              .criticalCommunicatedTo
              .trim()

          criticalCommunicationMethod =
            values
              .criticalCommunicationMethod

          criticalCommunicationNote =
            values
              .criticalCommunicationNote
              .trim() || null
        }

        const verifiedAt =
          new Date().toISOString()

        verifyRadiologyOrderReport(
          report.orderId,
          report.id,
          verifiedBy,
          verifiedAt
        )

        const verifiedReport:
          RadiologyReportRecord = {
          ...report,

          status: "verified",

          version:
            report.version + 1,

          verifiedBy,
          verifiedAt,

          radiologistRegistrationNumber:
            values
              .radiologistRegistrationNumber
              .trim(),

          verificationNote:
            values.verificationNote
              .trim() || null,

          criticalCommunicatedAt,
          criticalCommunicatedBy,
          criticalCommunicatedTo,
          criticalCommunicationMethod,
          criticalCommunicationNote,

          updatedAt:
            verifiedAt,
        }

        const nextReports =
          replaceReport(
            reportsRef.current,
            verifiedReport
          )

        reportsRef.current =
          nextReports

        setReports(nextReports)

        return verifiedReport
      },
      [
        setReports,
        verifyRadiologyOrderReport,
      ]
    )

  const releaseRadiologyReport =
    useCallback(
      (
        reportId: string,

        values:
          RadiologyReportReleaseValues
      ): RadiologyReportRecord => {
        const report =
          getReportOrThrow(
            reportsRef.current,
            reportId
          )

        if (
          report.status ===
          "released"
        ) {
          return report
        }

        if (
          report.status !==
          "verified"
        ) {
          throw new Error(
            "Only a verified radiology report can be released."
          )
        }

        const releasedBy =
          values.releasedBy.trim()

        const releasedAt =
          new Date().toISOString()

        releaseRadiologyOrderReport(
          report.orderId,
          report.id,
          releasedBy,
          releasedAt
        )

        const releasedReport:
          RadiologyReportRecord = {
          ...report,

          status: "released",

          version:
            report.version + 1,

          releasedBy,
          releasedAt,

          releaseNote:
            values.releaseNote
              .trim() || null,

          updatedAt:
            releasedAt,
        }

        const nextReports =
          replaceReport(
            reportsRef.current,
            releasedReport
          )

        reportsRef.current =
          nextReports

        setReports(nextReports)

        return releasedReport
      },
      [
        releaseRadiologyOrderReport,
        setReports,
      ]
    )

  const contextValue =
    useMemo<RadiologyReportContextValue>(
      () => ({
        reports,
        saveRadiologyReportDraft,
        verifyRadiologyReport,
        releaseRadiologyReport,
      }),
      [
        reports,
        saveRadiologyReportDraft,
        verifyRadiologyReport,
        releaseRadiologyReport,
      ]
    )

  return (
    <RadiologyReportContext.Provider
      value={contextValue}
    >
      {children}
    </RadiologyReportContext.Provider>
  )
}

export function useRadiologyReports(): RadiologyReportContextValue {
  const context =
    useContext(
      RadiologyReportContext
    )

  if (!context) {
    throw new Error(
      "useRadiologyReports must be used inside RadiologyReportProvider."
    )
  }

  return context
}
