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
  LABORATORY_PROCESSING_ACTOR,
  LABORATORY_TEST_CATALOG,
} from "@/features/laboratory/constants/laboratory.constants"
import { MOCK_LABORATORY_ORDERS } from "@/features/laboratory/data/laboratory.mock-data"
import type { LaboratoryOrderFormValues } from "@/features/laboratory/schemas/laboratory-order.schema"
import type { LaboratorySpecimenCollectionFormValues } from "@/features/laboratory/schemas/laboratory-specimen.schema"
import type {
  LaboratoryOrder,
  LaboratoryOrderItem,
  LaboratorySpecimenRecord,
  LaboratorySpecimenType,
} from "@/features/laboratory/types/laboratory.types"
import {
  areAllRequiredSpecimensCollected,
  areAllRequiredSpecimensReceived,
  createTemporaryLaboratoryId,
  generateLaboratoryAccessionNumber,
  generateLaboratoryOrderNumber,
} from "@/features/laboratory/utils/laboratory.utils"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import { usePersistentDevelopmentState } from "@/hooks/use-persistent-development-state"

const LABORATORY_STORAGE_KEY =
  "galenmed:development:laboratory-orders:v1"

const INITIAL_LABORATORY_ORDERS:
  LaboratoryOrder[] = [
  ...MOCK_LABORATORY_ORDERS,
]

interface LaboratoryContextValue {
  laboratoryOrders: LaboratoryOrder[]

  createLaboratoryOrder: (
    values: LaboratoryOrderFormValues
  ) => LaboratoryOrder

  collectLaboratorySpecimen: (
    orderId: string,
    values:
      LaboratorySpecimenCollectionFormValues
  ) => LaboratoryOrder

  receiveLaboratorySpecimen: (
    orderId: string,
    specimenId: string,
    receivedBy?: string
  ) => LaboratoryOrder

  startLaboratoryProcessing: (
    orderId: string,
    startedBy?: string
  ) => LaboratoryOrder

  rejectLaboratorySpecimen: (
    orderId: string,
    specimenId: string,
    rejectionReason: string,
    rejectedBy?: string
  ) => LaboratoryOrder

  cancelLaboratoryOrder: (
    orderId: string,
    cancellationReason: string,
    cancelledBy?: string
  ) => LaboratoryOrder
}

const LaboratoryContext =
  createContext<LaboratoryContextValue | null>(
    null
  )

interface LaboratoryProviderProps {
  children: ReactNode
}

function getLaboratoryOrderOrThrow(
  orders:
    readonly LaboratoryOrder[],
  orderId: string
): LaboratoryOrder {
  const order = orders.find(
    (candidateOrder) =>
      candidateOrder.id === orderId
  )

  if (!order) {
    throw new Error(
      "The laboratory order was not found."
    )
  }

  return order
}

function replaceLaboratoryOrder(
  orders:
    readonly LaboratoryOrder[],
  updatedOrder: LaboratoryOrder
): LaboratoryOrder[] {
  return orders.map((order) =>
    order.id === updatedOrder.id
      ? updatedOrder
      : order
  )
}

function getRelevantOrderItems(
  order: LaboratoryOrder,
  specimenType:
    LaboratorySpecimenType
): LaboratoryOrderItem[] {
  return order.items.filter(
    (item) =>
      item.specimenType ===
        specimenType &&
      item.status !== "cancelled"
  )
}

function canCollectSpecimen(
  order: LaboratoryOrder
): boolean {
  return [
    "ordered",
    "specimen-collected",
    "rejected",
  ].includes(order.status)
}

function normalizeDateTimeOrThrow(
  value: string
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "The specimen collection date and time are invalid."
    )
  }

  return date.toISOString()
}

export function LaboratoryProvider({
  children,
}: LaboratoryProviderProps) {
  const { patients } =
    usePatients()

  const { consultations } =
    useConsultations()

  const [
    laboratoryOrders,
    setLaboratoryOrders,
  ] =
    usePersistentDevelopmentState<
      LaboratoryOrder[]
    >(
      LABORATORY_STORAGE_KEY,
      INITIAL_LABORATORY_ORDERS
    )

  const ordersRef =
    useRef<LaboratoryOrder[]>(
      laboratoryOrders
    )

  useEffect(() => {
    ordersRef.current =
      laboratoryOrders
  }, [laboratoryOrders])

  const saveOrder = useCallback(
    (
      updatedOrder: LaboratoryOrder
    ): LaboratoryOrder => {
      const nextOrders =
        replaceLaboratoryOrder(
          ordersRef.current,
          updatedOrder
        )

      ordersRef.current =
        nextOrders

      setLaboratoryOrders(
        nextOrders
      )

      return updatedOrder
    },
    [setLaboratoryOrders]
  )

  const createLaboratoryOrder =
    useCallback(
      (
        values:
          LaboratoryOrderFormValues
      ): LaboratoryOrder => {
        const patient =
          patients.find(
            (candidatePatient) =>
              candidatePatient.id ===
              values.patientId
          )

        if (!patient) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        const branch =
          GALENMED_BRANCHES.find(
            (candidateBranch) =>
              candidateBranch.id ===
              values.branchId
          )

        if (!branch) {
          throw new Error(
            "The selected laboratory branch was not found."
          )
        }

        const consultation =
          values.consultationId
            ? consultations.find(
                (candidateConsultation) =>
                  candidateConsultation.id ===
                  values.consultationId
              ) ?? null
            : null

        if (
          values.source ===
            "consultation" &&
          !consultation
        ) {
          throw new Error(
            "The linked consultation was not found."
          )
        }

        if (
          consultation &&
          consultation.patientId !==
            patient.id
        ) {
          throw new Error(
            "The selected consultation belongs to a different patient."
          )
        }

        if (
          consultation &&
          (
            consultation.status ===
              "cancelled" ||
            consultation.status ===
              "no-show"
          )
        ) {
          throw new Error(
            "A cancelled or no-show consultation cannot create a laboratory order."
          )
        }

        const uniqueTestCodes =
          Array.from(
            new Set(
              values.selectedTestCodes
            )
          )

        const selectedTests =
          uniqueTestCodes.map(
            (testCode) => {
              const test =
                LABORATORY_TEST_CATALOG.find(
                  (catalogTest) =>
                    catalogTest.code ===
                    testCode
                )

              if (!test) {
                throw new Error(
                  `Unknown laboratory test code: ${testCode}.`
                )
              }

              return test
            }
          )

        const now =
          new Date().toISOString()

        const items:
          LaboratoryOrderItem[] =
          selectedTests.map(
            (test) => ({
              id:
                createTemporaryLaboratoryId(
                  "laboratory-item"
                ),

              testCode: test.code,
              testName: test.name,
              category: test.category,

              specimenType:
                test.specimenType,

              containerType:
                test.defaultContainer,

              estimatedTurnaroundMinutes:
                test.estimatedTurnaroundMinutes,

              status: "pending",
            })
          )

        const newOrder:
          LaboratoryOrder = {
          id:
            createTemporaryLaboratoryId(
              "laboratory-order"
            ),

          orderNumber:
            generateLaboratoryOrderNumber(
              ordersRef.current
            ),

          patientId:
            patient.id,

          consultationId:
            consultation?.id ?? null,

          consultationNumber:
            consultation?.consultationNumber ??
            null,

          branchId:
            branch.id,

          branchName:
            branch.name,

          orderedByName:
            values.orderedByName.trim(),

          priority:
            values.priority,

          source:
            values.source,

          status: "ordered",

          clinicalIndication:
            values.clinicalIndication.trim(),

          fastingRequired:
            values.fastingRequired ||
            selectedTests.some(
              (test) =>
                test.requiresFasting
            ),

          patientInstructions:
            values.patientInstructions
              .trim() || null,

          internalNotes:
            values.internalNotes
              .trim() || null,

          items,
          specimens: [],

          processingStartedAt: null,
          processingStartedBy: null,

          completedAt: null,
          completedBy: null,

          verifiedAt: null,
          verifiedBy: null,

          releasedAt: null,
          releasedBy: null,

          cancelledAt: null,
          cancelledBy: null,
          cancellationReason: null,

          createdAt: now,

          updatedAt: now,

          updatedBy:
            values.orderedByName.trim(),
        }

        const nextOrders = [
          newOrder,
          ...ordersRef.current,
        ]

        ordersRef.current =
          nextOrders

        setLaboratoryOrders(
          nextOrders
        )

        return newOrder
      },
      [
        consultations,
        patients,
        setLaboratoryOrders,
      ]
    )

  const collectLaboratorySpecimen =
    useCallback(
      (
        orderId: string,

        values:
          LaboratorySpecimenCollectionFormValues
      ): LaboratoryOrder => {
        const order =
          getLaboratoryOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (!canCollectSpecimen(order)) {
          throw new Error(
            "Specimen collection is not allowed for the current laboratory-order status."
          )
        }

        const relevantItems =
          getRelevantOrderItems(
            order,
            values.specimenType
          )

        if (
          relevantItems.length === 0
        ) {
          throw new Error(
            "The selected specimen type is not required by this laboratory order."
          )
        }

        const existingUsableSpecimen =
          order.specimens.find(
            (specimen) =>
              specimen.specimenType ===
                values.specimenType &&
              specimen.status !==
                "rejected"
          )

        if (
          existingUsableSpecimen
        ) {
          throw new Error(
            "A usable specimen of this type is already attached to the laboratory order."
          )
        }

        const collectedAt =
          normalizeDateTimeOrThrow(
            values.collectedAt
          )

        const newSpecimen:
          LaboratorySpecimenRecord = {
          id:
            createTemporaryLaboratoryId(
              "laboratory-specimen"
            ),

          accessionNumber:
            generateLaboratoryAccessionNumber(
              ordersRef.current
            ),

          orderItemIds:
            relevantItems.map(
              (item) => item.id
            ),

          specimenType:
            values.specimenType,

          collectionMethod:
            values.collectionMethod,

          containerType:
            values.containerType.trim(),

          status: "collected",

          collectedAt,

          collectedBy:
            values.collectedBy.trim(),

          receivedAt: null,
          receivedBy: null,

          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,

          notes:
            values.notes.trim() ||
            null,
        }

        const updatedOrderBase:
          LaboratoryOrder = {
          ...order,

          specimens: [
            ...order.specimens,
            newSpecimen,
          ],

          updatedAt:
            collectedAt,

          updatedBy:
            values.collectedBy.trim(),
        }

        const updatedOrder:
          LaboratoryOrder = {
          ...updatedOrderBase,

          status:
            areAllRequiredSpecimensCollected(
              updatedOrderBase
            )
              ? "specimen-collected"
              : "ordered",
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const receiveLaboratorySpecimen =
    useCallback(
      (
        orderId: string,
        specimenId: string,

        receivedBy =
          LABORATORY_PROCESSING_ACTOR
      ): LaboratoryOrder => {
        const order =
          getLaboratoryOrderOrThrow(
            ordersRef.current,
            orderId
          )

        const specimen =
          order.specimens.find(
            (candidateSpecimen) =>
              candidateSpecimen.id ===
              specimenId
          )

        if (!specimen) {
          throw new Error(
            "The laboratory specimen was not found."
          )
        }

        if (
          specimen.status ===
          "received"
        ) {
          return order
        }

        if (
          specimen.status !==
          "collected"
        ) {
          throw new Error(
            "Only a collected specimen can be received."
          )
        }

        const now =
          new Date().toISOString()

        const updatedSpecimen:
          LaboratorySpecimenRecord = {
          ...specimen,

          status: "received",

          receivedAt: now,

          receivedBy:
            receivedBy.trim(),
        }

        const updatedOrderBase:
          LaboratoryOrder = {
          ...order,

          specimens:
            order.specimens.map(
              (currentSpecimen) =>
                currentSpecimen.id ===
                specimenId
                  ? updatedSpecimen
                  : currentSpecimen
            ),

          updatedAt: now,

          updatedBy:
            receivedBy.trim(),
        }

        const updatedOrder:
          LaboratoryOrder = {
          ...updatedOrderBase,

          status:
            areAllRequiredSpecimensReceived(
              updatedOrderBase
            )
              ? "received"
              : "specimen-collected",
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const startLaboratoryProcessing =
    useCallback(
      (
        orderId: string,

        startedBy =
          LABORATORY_PROCESSING_ACTOR
      ): LaboratoryOrder => {
        const order =
          getLaboratoryOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
          "in-process"
        ) {
          return order
        }

        if (
          order.status !== "received"
        ) {
          throw new Error(
            "All required specimens must be received before processing can begin."
          )
        }

        const now =
          new Date().toISOString()

        const updatedOrder:
          LaboratoryOrder = {
          ...order,

          status: "in-process",

          items:
            order.items.map(
              (item) =>
                item.status === "pending"
                  ? {
                      ...item,
                      status:
                        "in-process",
                    }
                  : item
            ),

          processingStartedAt: now,

          processingStartedBy:
            startedBy.trim(),

          updatedAt: now,

          updatedBy:
            startedBy.trim(),
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const rejectLaboratorySpecimen =
    useCallback(
      (
        orderId: string,
        specimenId: string,
        rejectionReason: string,

        rejectedBy =
          LABORATORY_PROCESSING_ACTOR
      ): LaboratoryOrder => {
        const normalizedReason =
          rejectionReason.trim()

        if (
          normalizedReason.length < 5
        ) {
          throw new Error(
            "A specimen rejection reason of at least five characters is required."
          )
        }

        const order =
          getLaboratoryOrderOrThrow(
            ordersRef.current,
            orderId
          )

        const specimen =
          order.specimens.find(
            (candidateSpecimen) =>
              candidateSpecimen.id ===
              specimenId
          )

        if (!specimen) {
          throw new Error(
            "The laboratory specimen was not found."
          )
        }

        if (
          specimen.status ===
          "rejected"
        ) {
          return order
        }

        if (
          [
            "completed",
            "verified",
            "released",
            "cancelled",
          ].includes(order.status)
        ) {
          throw new Error(
            "The specimen can no longer be rejected in the current laboratory-order status."
          )
        }

        const now =
          new Date().toISOString()

        const updatedSpecimen:
          LaboratorySpecimenRecord = {
          ...specimen,

          status: "rejected",

          rejectedAt: now,

          rejectedBy:
            rejectedBy.trim(),

          rejectionReason:
            normalizedReason,
        }

        const rejectedItemIds =
          new Set(
            specimen.orderItemIds
          )

        const updatedOrder:
          LaboratoryOrder = {
          ...order,

          status: "rejected",

          specimens:
            order.specimens.map(
              (currentSpecimen) =>
                currentSpecimen.id ===
                specimenId
                  ? updatedSpecimen
                  : currentSpecimen
            ),

          items:
            order.items.map(
              (item) =>
                rejectedItemIds.has(
                  item.id
                )
                  ? {
                      ...item,
                      status: "pending",
                    }
                  : item
            ),

          processingStartedAt: null,
          processingStartedBy: null,

          updatedAt: now,

          updatedBy:
            rejectedBy.trim(),
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const cancelLaboratoryOrder =
    useCallback(
      (
        orderId: string,
        cancellationReason: string,

        cancelledBy =
          LABORATORY_PROCESSING_ACTOR
      ): LaboratoryOrder => {
        const normalizedReason =
          cancellationReason.trim()

        if (
          normalizedReason.length < 5
        ) {
          throw new Error(
            "A cancellation reason of at least five characters is required."
          )
        }

        const order =
          getLaboratoryOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status === "cancelled"
        ) {
          return order
        }

        if (
          [
            "in-process",
            "completed",
            "verified",
            "released",
          ].includes(order.status)
        ) {
          throw new Error(
            "The laboratory order can no longer be cancelled through this workflow."
          )
        }

        const now =
          new Date().toISOString()

        const updatedOrder:
          LaboratoryOrder = {
          ...order,

          status: "cancelled",

          items:
            order.items.map(
              (item) => ({
                ...item,
                status: "cancelled",
              })
            ),

          cancelledAt: now,

          cancelledBy:
            cancelledBy.trim(),

          cancellationReason:
            normalizedReason,

          updatedAt: now,

          updatedBy:
            cancelledBy.trim(),
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const contextValue =
    useMemo<LaboratoryContextValue>(
      () => ({
        laboratoryOrders,
        createLaboratoryOrder,
        collectLaboratorySpecimen,
        receiveLaboratorySpecimen,
        startLaboratoryProcessing,
        rejectLaboratorySpecimen,
        cancelLaboratoryOrder,
      }),
      [
        laboratoryOrders,
        createLaboratoryOrder,
        collectLaboratorySpecimen,
        receiveLaboratorySpecimen,
        startLaboratoryProcessing,
        rejectLaboratorySpecimen,
        cancelLaboratoryOrder,
      ]
    )

  return (
    <LaboratoryContext.Provider
      value={contextValue}
    >
      {children}
    </LaboratoryContext.Provider>
  )
}

export function useLaboratory(): LaboratoryContextValue {
  const context = useContext(
    LaboratoryContext
  )

  if (!context) {
    throw new Error(
      "useLaboratory must be used inside LaboratoryProvider."
    )
  }

  return context
}
