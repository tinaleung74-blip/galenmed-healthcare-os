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
  getLaboratoryAnalytesForTest,
} from "@/features/laboratory/constants/laboratory-result.constants"
import { MOCK_LABORATORY_RESULT_SETS } from "@/features/laboratory/data/laboratory-result.mock-data"
import { useLaboratory } from "@/features/laboratory/providers/laboratory-provider"
import type {
  LaboratoryResultPanelFormValues,
  LaboratoryResultReleaseValues,
  LaboratoryResultVerificationValues,
} from "@/features/laboratory/schemas/laboratory-result.schema"
import type {
  LaboratoryResultEntry,
  LaboratoryResultSet,
} from "@/features/laboratory/types/laboratory-result.types"
import {
  calculateLaboratoryResultFlag,
} from "@/features/laboratory/utils/laboratory-result.utils"
import {
  createTemporaryLaboratoryId,
} from "@/features/laboratory/utils/laboratory.utils"
import { usePersistentDevelopmentState } from "@/hooks/use-persistent-development-state"

const LABORATORY_RESULT_STORAGE_KEY =
  "galenmed:development:laboratory-result-sets:v1"

const INITIAL_LABORATORY_RESULT_SETS:
  LaboratoryResultSet[] = [
  ...MOCK_LABORATORY_RESULT_SETS,
]

interface LaboratoryResultContextValue {
  resultSets: LaboratoryResultSet[]

  saveLaboratoryResultDraft: (
    orderId: string,
    orderItemId: string,
    values:
      LaboratoryResultPanelFormValues
  ) => LaboratoryResultSet

  completeLaboratoryResultSet: (
    resultSetId: string,
    completedBy: string
  ) => LaboratoryResultSet

  verifyLaboratoryResultSet: (
    resultSetId: string,
    values:
      LaboratoryResultVerificationValues
  ) => LaboratoryResultSet

  releaseLaboratoryResultSet: (
    resultSetId: string,
    values:
      LaboratoryResultReleaseValues
  ) => LaboratoryResultSet
}

const LaboratoryResultContext =
  createContext<LaboratoryResultContextValue | null>(
    null
  )

interface LaboratoryResultProviderProps {
  children: ReactNode
}

function replaceResultSet(
  resultSets:
    readonly LaboratoryResultSet[],
  updatedResultSet:
    LaboratoryResultSet
): LaboratoryResultSet[] {
  return resultSets.map(
    (resultSet) =>
      resultSet.id ===
      updatedResultSet.id
        ? updatedResultSet
        : resultSet
  )
}

function getResultSetOrThrow(
  resultSets:
    readonly LaboratoryResultSet[],
  resultSetId: string
): LaboratoryResultSet {
  const resultSet =
    resultSets.find(
      (candidateResultSet) =>
        candidateResultSet.id ===
        resultSetId
    )

  if (!resultSet) {
    throw new Error(
      "The laboratory result set was not found."
    )
  }

  return resultSet
}

export function LaboratoryResultProvider({
  children,
}: LaboratoryResultProviderProps) {
  const {
    laboratoryOrders,
    completeLaboratoryOrderItem,
    verifyLaboratoryOrderItem,
    releaseLaboratoryOrderItem,
  } = useLaboratory()

  const [
    resultSets,
    setResultSets,
  ] =
    usePersistentDevelopmentState<
      LaboratoryResultSet[]
    >(
      LABORATORY_RESULT_STORAGE_KEY,
      INITIAL_LABORATORY_RESULT_SETS
    )

  const resultSetsRef =
    useRef<LaboratoryResultSet[]>(
      resultSets
    )

  useEffect(() => {
    resultSetsRef.current =
      resultSets
  }, [resultSets])

  const saveLaboratoryResultDraft =
    useCallback(
      (
        orderId: string,
        orderItemId: string,
        values:
          LaboratoryResultPanelFormValues
      ): LaboratoryResultSet => {
        const order =
          laboratoryOrders.find(
            (candidateOrder) =>
              candidateOrder.id ===
              orderId
          )

        if (!order) {
          throw new Error(
            "The laboratory order was not found."
          )
        }

        if (
          order.status !==
          "in-process"
        ) {
          throw new Error(
            "Results may only be entered while the laboratory order is in process."
          )
        }

        const orderItem =
          order.items.find(
            (item) =>
              item.id ===
              orderItemId
          )

        if (!orderItem) {
          throw new Error(
            "The laboratory-order item was not found."
          )
        }

        if (
          orderItem.status !==
          "in-process"
        ) {
          throw new Error(
            "The selected laboratory test is not available for result entry."
          )
        }

        const analytes =
          getLaboratoryAnalytesForTest(
            orderItem.testCode
          )

        if (
          analytes.length === 0
        ) {
          throw new Error(
            "No analyte configuration is available for this laboratory test."
          )
        }

        const submittedEntries =
          new Map(
            values.entries.map(
              (entry) => [
                entry.analyteCode,
                entry,
              ]
            )
          )

        if (
          submittedEntries.size !==
          analytes.length
        ) {
          throw new Error(
            "Complete every configured analyte before saving the result panel."
          )
        }

        const existingResultSet =
          resultSetsRef.current.find(
            (resultSet) =>
              resultSet.orderItemId ===
              orderItemId
          ) ?? null

        if (
          existingResultSet &&
          existingResultSet.status !==
            "draft"
        ) {
          throw new Error(
            "Completed, verified, or released result sets cannot be edited."
          )
        }

        const now =
          new Date().toISOString()

        const performedBy =
          values.performedBy.trim()

        const entries:
          LaboratoryResultEntry[] =
          analytes.map((analyte) => {
            const submittedEntry =
              submittedEntries.get(
                analyte.code
              )

            if (!submittedEntry) {
              throw new Error(
                `${analyte.name} result is missing.`
              )
            }

            if (
              submittedEntry.valueType !==
              analyte.valueType
            ) {
              throw new Error(
                `${analyte.name} result type does not match the analyte configuration.`
              )
            }

            const numericValue =
              analyte.valueType ===
              "numeric"
                ? Number(
                    submittedEntry.numericValue
                  )
                : null

            const textValue =
              analyte.valueType ===
              "numeric"
                ? null
                : submittedEntry.textValue
                    .trim()

            const existingEntry =
              existingResultSet
                ?.entries.find(
                  (entry) =>
                    entry.analyteCode ===
                    analyte.code
                ) ?? null

            return {
              id:
                existingEntry?.id ??
                createTemporaryLaboratoryId(
                  "laboratory-result-entry"
                ),

              resultSetId:
                existingResultSet?.id ??
                "pending-result-set-id",

              orderId:
                order.id,

              orderItemId:
                orderItem.id,

              patientId:
                order.patientId,

              analyteCode:
                analyte.code,

              analyteName:
                analyte.name,

              valueType:
                analyte.valueType,

              numericValue,
              textValue,

              unit:
                analyte.unit,

              referenceLow:
                analyte.referenceLow,

              referenceHigh:
                analyte.referenceHigh,

              referenceText:
                analyte.referenceText,

              flag:
                calculateLaboratoryResultFlag(
                  analyte,
                  numericValue,
                  textValue
                ),

              comment:
                submittedEntry.comment
                  .trim() || null,

              enteredBy:
                existingEntry?.enteredBy ??
                performedBy,

              enteredAt:
                existingEntry?.enteredAt ??
                now,

              updatedBy:
                performedBy,

              updatedAt: now,
            }
          })

        const resultSetId =
          existingResultSet?.id ??
          createTemporaryLaboratoryId(
            "laboratory-result-set"
          )

        const normalizedEntries =
          entries.map((entry) => ({
            ...entry,
            resultSetId,
          }))

        const savedResultSet:
          LaboratoryResultSet = {
          id: resultSetId,

          orderId:
            order.id,

          orderItemId:
            orderItem.id,

          patientId:
            order.patientId,

          testCode:
            orderItem.testCode,

          testName:
            orderItem.testName,

          status: "draft",

          version:
            existingResultSet
              ? existingResultSet.version +
                1
              : 1,

          entries:
            normalizedEntries,

          performedBy,

          performedAt: now,

          completedBy: null,
          completedAt: null,

          verifiedBy: null,
          verifiedAt: null,
          verificationNote: null,

          releasedBy: null,
          releasedAt: null,
          releaseNote: null,

          createdAt:
            existingResultSet?.createdAt ??
            now,

          updatedAt: now,
        }

        const nextResultSets =
          existingResultSet
            ? replaceResultSet(
                resultSetsRef.current,
                savedResultSet
              )
            : [
                savedResultSet,
                ...resultSetsRef.current,
              ]

        resultSetsRef.current =
          nextResultSets

        setResultSets(
          nextResultSets
        )

        return savedResultSet
      },
      [
        laboratoryOrders,
        setResultSets,
      ]
    )

  const completeLaboratoryResultSet =
    useCallback(
      (
        resultSetId: string,
        completedBy: string
      ): LaboratoryResultSet => {
        const resultSet =
          getResultSetOrThrow(
            resultSetsRef.current,
            resultSetId
          )

        if (
          resultSet.status ===
            "completed" ||
          resultSet.status ===
            "verified" ||
          resultSet.status ===
            "released"
        ) {
          return resultSet
        }

        const incompleteEntry =
          resultSet.entries.find(
            (entry) =>
              (
                entry.valueType ===
                  "numeric" &&
                entry.numericValue ===
                  null
              ) ||
              (
                entry.valueType !==
                  "numeric" &&
                !entry.textValue?.trim()
              )
          )

        if (incompleteEntry) {
          throw new Error(
            `${incompleteEntry.analyteName} does not have a complete result.`
          )
        }

        const normalizedActor =
          completedBy.trim()

        if (
          normalizedActor.length < 2
        ) {
          throw new Error(
            "Completing laboratory analyst is required."
          )
        }

        const completedAt =
          new Date().toISOString()

        completeLaboratoryOrderItem(
          resultSet.orderId,
          resultSet.orderItemId,
          normalizedActor,
          completedAt
        )

        const completedResultSet:
          LaboratoryResultSet = {
          ...resultSet,

          status: "completed",

          version:
            resultSet.version + 1,

          completedBy:
            normalizedActor,

          completedAt,

          updatedAt:
            completedAt,
        }

        const nextResultSets =
          replaceResultSet(
            resultSetsRef.current,
            completedResultSet
          )

        resultSetsRef.current =
          nextResultSets

        setResultSets(
          nextResultSets
        )

        return completedResultSet
      },
      [
        completeLaboratoryOrderItem,
        setResultSets,
      ]
    )

  const verifyLaboratoryResultSet =
    useCallback(
      (
        resultSetId: string,
        values:
          LaboratoryResultVerificationValues
      ): LaboratoryResultSet => {
        const resultSet =
          getResultSetOrThrow(
            resultSetsRef.current,
            resultSetId
          )

        if (
          resultSet.status ===
            "verified" ||
          resultSet.status ===
            "released"
        ) {
          return resultSet
        }

        if (
          resultSet.status !==
          "completed"
        ) {
          throw new Error(
            "Only a completed result set can be technically verified."
          )
        }

        const hasCriticalResult =
          resultSet.entries.some(
            (entry) =>
              entry.flag ===
                "critical-low" ||
              entry.flag ===
                "critical-high"
          )

        const verificationNote =
          values.verificationNote.trim()

        if (
          hasCriticalResult &&
          verificationNote.length < 3
        ) {
          throw new Error(
            "A verification note is required for a critical laboratory result."
          )
        }

        const verifiedBy =
          values.verifiedBy.trim()

        const verifiedAt =
          new Date().toISOString()

        verifyLaboratoryOrderItem(
          resultSet.orderId,
          resultSet.orderItemId,
          verifiedBy,
          verifiedAt
        )

        const verifiedResultSet:
          LaboratoryResultSet = {
          ...resultSet,

          status: "verified",

          version:
            resultSet.version + 1,

          verifiedBy,
          verifiedAt,

          verificationNote:
            verificationNote || null,

          updatedAt:
            verifiedAt,
        }

        const nextResultSets =
          replaceResultSet(
            resultSetsRef.current,
            verifiedResultSet
          )

        resultSetsRef.current =
          nextResultSets

        setResultSets(
          nextResultSets
        )

        return verifiedResultSet
      },
      [
        setResultSets,
        verifyLaboratoryOrderItem,
      ]
    )

  const releaseLaboratoryResultSet =
    useCallback(
      (
        resultSetId: string,
        values:
          LaboratoryResultReleaseValues
      ): LaboratoryResultSet => {
        const resultSet =
          getResultSetOrThrow(
            resultSetsRef.current,
            resultSetId
          )

        if (
          resultSet.status ===
          "released"
        ) {
          return resultSet
        }

        if (
          resultSet.status !==
          "verified"
        ) {
          throw new Error(
            "Only a technically verified result set can be released."
          )
        }

        const releasedBy =
          values.releasedBy.trim()

        const releasedAt =
          new Date().toISOString()

        releaseLaboratoryOrderItem(
          resultSet.orderId,
          resultSet.orderItemId,
          releasedBy,
          releasedAt
        )

        const releasedResultSet:
          LaboratoryResultSet = {
          ...resultSet,

          status: "released",

          version:
            resultSet.version + 1,

          releasedBy,
          releasedAt,

          releaseNote:
            values.releaseNote
              .trim() || null,

          updatedAt:
            releasedAt,
        }

        const nextResultSets =
          replaceResultSet(
            resultSetsRef.current,
            releasedResultSet
          )

        resultSetsRef.current =
          nextResultSets

        setResultSets(
          nextResultSets
        )

        return releasedResultSet
      },
      [
        releaseLaboratoryOrderItem,
        setResultSets,
      ]
    )

  const contextValue =
    useMemo<LaboratoryResultContextValue>(
      () => ({
        resultSets,
        saveLaboratoryResultDraft,
        completeLaboratoryResultSet,
        verifyLaboratoryResultSet,
        releaseLaboratoryResultSet,
      }),
      [
        resultSets,
        saveLaboratoryResultDraft,
        completeLaboratoryResultSet,
        verifyLaboratoryResultSet,
        releaseLaboratoryResultSet,
      ]
    )

  return (
    <LaboratoryResultContext.Provider
      value={contextValue}
    >
      {children}
    </LaboratoryResultContext.Provider>
  )
}

export function useLaboratoryResults(): LaboratoryResultContextValue {
  const context = useContext(
    LaboratoryResultContext
  )

  if (!context) {
    throw new Error(
      "useLaboratoryResults must be used inside LaboratoryResultProvider."
    )
  }

  return context
}
