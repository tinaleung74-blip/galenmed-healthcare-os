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
  RADIOLOGY_OPERATIONS_ACTOR,
  RADIOLOGY_PROCEDURE_CATALOG,
  RADIOLOGY_ROOMS,
} from "@/features/radiology/constants/radiology.constants"
import { MOCK_RADIOLOGY_ORDERS } from "@/features/radiology/data/radiology.mock-data"
import type {
  RadiologyOrderFormValues,
} from "@/features/radiology/schemas/radiology-order.schema"
import type {
  RadiologyScheduleFormValues,
} from "@/features/radiology/schemas/radiology-schedule.schema"
import type {
  RadiologyOrder,
  RadiologyPreparationChecklistItem,
  RadiologyProcedureDefinition,
  RadiologyRoomDefinition,
} from "@/features/radiology/types/radiology.types"
import {
  buildRadiologyPreparationChecklist,
  buildRadiologySchedule,
  createTemporaryRadiologyId,
  findRadiologyScheduleConflicts,
  formatRadiologyScheduleRange,
  generateRadiologyOrderNumber,
} from "@/features/radiology/utils/radiology.utils"
import { useConsultations } from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"
import { usePersistentDevelopmentState } from "@/hooks/use-persistent-development-state"

const RADIOLOGY_STORAGE_KEY =
  "galenmed:development:radiology-orders:v1"

const INITIAL_RADIOLOGY_ORDERS:
  RadiologyOrder[] = [
  ...MOCK_RADIOLOGY_ORDERS,
]

interface RadiologyContextValue {
  radiologyOrders: RadiologyOrder[]

  createRadiologyOrder: (
    values: RadiologyOrderFormValues
  ) => RadiologyOrder

  scheduleRadiologyOrder: (
    orderId: string,
    values: RadiologyScheduleFormValues
  ) => RadiologyOrder

  updateRadiologyPreparationItem: (
    orderId: string,
    checklistItemId: string,
    completed: boolean,
    updatedBy?: string,
    notes?: string
  ) => RadiologyOrder

  checkInRadiologyOrder: (
    orderId: string,
    checkedInBy?: string
  ) => RadiologyOrder

  markRadiologyReady: (
    orderId: string,
    readyBy?: string
  ) => RadiologyOrder

  startRadiologyImaging: (
    orderId: string,
    startedBy?: string
  ) => RadiologyOrder

  markRadiologyImagesAcquired: (
    orderId: string,
    acquiredBy?: string
  ) => RadiologyOrder

  technicallyCompleteRadiologyOrder: (
    orderId: string,
    completedBy?: string
  ) => RadiologyOrder

  attachRadiologyReportToOrder: (
    orderId: string,
    reportId: string,
    draftedBy: string,
    draftedAt?: string
  ) => RadiologyOrder

  verifyRadiologyOrderReport: (
    orderId: string,
    reportId: string,
    verifiedBy: string,
    verifiedAt?: string
  ) => RadiologyOrder

  releaseRadiologyOrderReport: (
    orderId: string,
    reportId: string,
    releasedBy: string,
    releasedAt?: string
  ) => RadiologyOrder

  cancelRadiologyOrder: (
    orderId: string,
    cancellationReason: string,
    cancelledBy?: string
  ) => RadiologyOrder

  markRadiologyNoShow: (
    orderId: string,
    markedBy?: string
  ) => RadiologyOrder
}

const RadiologyContext =
  createContext<RadiologyContextValue | null>(
    null
  )

interface RadiologyProviderProps {
  children: ReactNode
}

function getRadiologyOrderOrThrow(
  orders: readonly RadiologyOrder[],
  orderId: string
): RadiologyOrder {
  const order = orders.find(
    (candidateOrder) =>
      candidateOrder.id === orderId
  )

  if (!order) {
    throw new Error(
      "The radiology order was not found."
    )
  }

  return order
}

function replaceRadiologyOrder(
  orders: readonly RadiologyOrder[],
  updatedOrder: RadiologyOrder
): RadiologyOrder[] {
  return orders.map((order) =>
    order.id === updatedOrder.id
      ? updatedOrder
      : order
  )
}

function getProcedureOrThrow(
  procedureCode: string
): RadiologyProcedureDefinition {
  const procedure =
    RADIOLOGY_PROCEDURE_CATALOG.find(
      (candidateProcedure) =>
        candidateProcedure.code ===
        procedureCode
    )

  if (!procedure) {
    throw new Error(
      "The selected radiology procedure was not found."
    )
  }

  return procedure
}

function getRoomOrThrow(
  roomId: string,
  branchId: string,
  modality:
    RadiologyOrder["modality"]
): RadiologyRoomDefinition {
  const room =
    RADIOLOGY_ROOMS.find(
      (candidateRoom) =>
        candidateRoom.id === roomId
    )

  if (!room) {
    throw new Error(
      "The selected radiology room was not found."
    )
  }

  if (room.branchId !== branchId) {
    throw new Error(
      "The selected room belongs to a different branch."
    )
  }

  const supportsModality =
    room.supportedModalities.some(
      (supportedModality) =>
        supportedModality === modality
    )

  if (!supportsModality) {
    throw new Error(
      "The selected room does not support the requested imaging modality."
    )
  }

  return room
}

function normalizeActor(
  value: string,
  fallback =
    RADIOLOGY_OPERATIONS_ACTOR
): string {
  return value.trim() || fallback
}

function allRequiredPreparationComplete(
  checklist:
    readonly RadiologyPreparationChecklistItem[]
): boolean {
  const requiredItems =
    checklist.filter(
      (item) => item.required
    )

  return (
    requiredItems.length > 0 &&
    requiredItems.every(
      (item) => item.completed
    )
  )
}

export function RadiologyProvider({
  children,
}: RadiologyProviderProps) {
  const { patients } = usePatients()

  const { consultations } =
    useConsultations()

  const [
    radiologyOrders,
    setRadiologyOrders,
  ] =
    usePersistentDevelopmentState<
      RadiologyOrder[]
    >(
      RADIOLOGY_STORAGE_KEY,
      INITIAL_RADIOLOGY_ORDERS
    )

  const ordersRef =
    useRef<RadiologyOrder[]>(
      radiologyOrders
    )

  useEffect(() => {
    ordersRef.current =
      radiologyOrders
  }, [radiologyOrders])

  const saveOrder = useCallback(
    (
      updatedOrder: RadiologyOrder
    ): RadiologyOrder => {
      const nextOrders =
        replaceRadiologyOrder(
          ordersRef.current,
          updatedOrder
        )

      ordersRef.current =
        nextOrders

      setRadiologyOrders(
        nextOrders
      )

      return updatedOrder
    },
    [setRadiologyOrders]
  )

  const createRadiologyOrder =
    useCallback(
      (
        values:
          RadiologyOrderFormValues
      ): RadiologyOrder => {
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
            "The selected GalenMed branch was not found."
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
            "A cancelled or no-show consultation cannot create a radiology order."
          )
        }

        const procedure =
          getProcedureOrThrow(
            values.procedureCode
          )

        const now =
          new Date().toISOString()

        const newOrder:
          RadiologyOrder = {
          id:
            createTemporaryRadiologyId(
              "radiology-order"
            ),

          orderNumber:
            generateRadiologyOrderNumber(
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

          procedureCode:
            procedure.code,

          procedureName:
            procedure.name,

          modality:
            procedure.modality,

          bodyRegion:
            procedure.bodyRegion,

          contrastProtocol:
            procedure.contrastProtocol,

          clinicalIndication:
            values.clinicalIndication.trim(),

          specialInstructions:
            values.specialInstructions
              .trim() || null,

          requiresFasting:
            procedure.requiresFasting,

          requiresPregnancyScreening:
            procedure.requiresPregnancyScreening,

          requiresRenalFunctionReview:
            procedure.requiresRenalFunctionReview,

          preparationChecklist:
            buildRadiologyPreparationChecklist(
              procedure
            ),

          scheduledStartAt: null,
          scheduledEndAt: null,
          durationMinutes: null,

          roomId: null,
          roomName: null,

          schedulingNotes: null,

          checkedInAt: null,
          checkedInBy: null,

          readyAt: null,
          readyBy: null,

          imagingStartedAt: null,
          imagingStartedBy: null,

          imagesAcquiredAt: null,
          imagesAcquiredBy: null,

          technicalCompletedAt: null,
          technicalCompletedBy: null,

          reportId: null,

          cancelledAt: null,
          cancelledBy: null,
          cancellationReason: null,

          noShowAt: null,
          noShowMarkedBy: null,

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

        setRadiologyOrders(
          nextOrders
        )

        return newOrder
      },
      [
        consultations,
        patients,
        setRadiologyOrders,
      ]
    )

  const scheduleRadiologyOrder =
    useCallback(
      (
        orderId: string,
        values:
          RadiologyScheduleFormValues
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status !== "ordered" &&
          order.status !== "scheduled"
        ) {
          throw new Error(
            "Only ordered or scheduled radiology requests can be scheduled or rescheduled."
          )
        }

        const room =
          getRoomOrThrow(
            values.roomId,
            order.branchId,
            order.modality
          )

        const schedule =
          buildRadiologySchedule(
            values
          )

        const conflicts =
          findRadiologyScheduleConflicts(
            ordersRef.current,
            {
              patientId:
                order.patientId,

              roomId:
                room.id,

              scheduledStartAt:
                schedule.scheduledStartAt,

              scheduledEndAt:
                schedule.scheduledEndAt,
            },
            order.id
          )

        const firstConflict =
          conflicts[0]

        if (firstConflict) {
          const resourceLabel =
            firstConflict.resource ===
            "patient"
              ? "Patient"
              : "Radiology room"

          throw new Error(
            `${resourceLabel} already has a conflicting radiology schedule: ${firstConflict.order.orderNumber}, ${formatRadiologyScheduleRange(
              firstConflict.order
            )}.`
          )
        }

        const now =
          new Date().toISOString()

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "scheduled",

          ...schedule,

          roomId:
            room.id,

          roomName:
            room.name,

          schedulingNotes:
            values.schedulingNotes
              .trim() || null,

          updatedAt: now,

          updatedBy:
            RADIOLOGY_OPERATIONS_ACTOR,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const updateRadiologyPreparationItem =
    useCallback(
      (
        orderId: string,
        checklistItemId: string,
        completed: boolean,

        updatedBy =
          RADIOLOGY_OPERATIONS_ACTOR,

        notes = ""
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          ![
            "scheduled",
            "checked-in",
            "ready",
          ].includes(order.status)
        ) {
          throw new Error(
            "Preparation items can only be changed before imaging begins."
          )
        }

        const checklistItem =
          order.preparationChecklist.find(
            (item) =>
              item.id ===
              checklistItemId
          )

        if (!checklistItem) {
          throw new Error(
            "The preparation checklist item was not found."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(updatedBy)

        const updatedChecklist =
          order.preparationChecklist.map(
            (item) =>
              item.id ===
              checklistItemId
                ? {
                    ...item,

                    completed,

                    completedAt:
                      completed
                        ? now
                        : null,

                    completedBy:
                      completed
                        ? normalizedActor
                        : null,

                    notes:
                      notes.trim() ||
                      null,
                  }
                : item
          )

        const requiredComplete =
          allRequiredPreparationComplete(
            updatedChecklist
          )

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          preparationChecklist:
            updatedChecklist,

          status:
            order.status ===
              "ready" &&
            !requiredComplete
              ? "checked-in"
              : order.status,

          readyAt:
            order.status ===
              "ready" &&
            !requiredComplete
              ? null
              : order.readyAt,

          readyBy:
            order.status ===
              "ready" &&
            !requiredComplete
              ? null
              : order.readyBy,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const checkInRadiologyOrder =
    useCallback(
      (
        orderId: string,

        checkedInBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
          "checked-in"
        ) {
          return order
        }

        if (
          order.status !==
          "scheduled"
        ) {
          throw new Error(
            "Only a scheduled radiology order can be checked in."
          )
        }

        if (
          !order.scheduledStartAt ||
          !order.scheduledEndAt ||
          !order.roomId
        ) {
          throw new Error(
            "The radiology order requires a complete schedule and room assignment before check-in."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(
            checkedInBy
          )

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "checked-in",

          checkedInAt: now,

          checkedInBy:
            normalizedActor,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const markRadiologyReady =
    useCallback(
      (
        orderId: string,

        readyBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (order.status === "ready") {
          return order
        }

        if (
          order.status !==
          "checked-in"
        ) {
          throw new Error(
            "The patient must be checked in before being marked ready for imaging."
          )
        }

        if (
          !allRequiredPreparationComplete(
            order.preparationChecklist
          )
        ) {
          throw new Error(
            "Complete all required preparation checklist items before marking the patient ready."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(readyBy)

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "ready",

          readyAt: now,

          readyBy:
            normalizedActor,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const startRadiologyImaging =
    useCallback(
      (
        orderId: string,

        startedBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
          "in-progress"
        ) {
          return order
        }

        if (
          order.status !== "ready"
        ) {
          throw new Error(
            "The patient must be ready before imaging can begin."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(startedBy)

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "in-progress",

          imagingStartedAt: now,

          imagingStartedBy:
            normalizedActor,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const markRadiologyImagesAcquired =
    useCallback(
      (
        orderId: string,

        acquiredBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
          "images-acquired"
        ) {
          return order
        }

        if (
          order.status !==
          "in-progress"
        ) {
          throw new Error(
            "Imaging must be in progress before image acquisition can be completed."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(
            acquiredBy
          )

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "images-acquired",

          imagesAcquiredAt: now,

          imagesAcquiredBy:
            normalizedActor,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const technicallyCompleteRadiologyOrder =
    useCallback(
      (
        orderId: string,

        completedBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
          "technically-completed"
        ) {
          return order
        }

        if (
          order.status !==
          "images-acquired"
        ) {
          throw new Error(
            "Images must be acquired before technical completion."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(
            completedBy
          )

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status:
            "technically-completed",

          technicalCompletedAt:
            now,

          technicalCompletedBy:
            normalizedActor,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const attachRadiologyReportToOrder =
    useCallback(
      (
        orderId: string,
        reportId: string,
        draftedBy: string,
        draftedAt =
          new Date().toISOString()
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.reportId &&
          order.reportId !== reportId
        ) {
          throw new Error(
            "This radiology order is already linked to a different report."
          )
        }

        if (
          order.status ===
            "report-draft" &&
          order.reportId === reportId
        ) {
          return order
        }

        if (
          order.status !==
          "technically-completed"
        ) {
          throw new Error(
            "A report draft can only be created after technical completion."
          )
        }

        const normalizedActor =
          normalizeActor(draftedBy)

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "report-draft",

          reportId,

          updatedAt: draftedAt,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const verifyRadiologyOrderReport =
    useCallback(
      (
        orderId: string,
        reportId: string,
        verifiedBy: string,
        verifiedAt =
          new Date().toISOString()
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
            "verified" &&
          order.reportId === reportId
        ) {
          return order
        }

        if (
          order.status !==
            "report-draft" ||
          order.reportId !== reportId
        ) {
          throw new Error(
            "Only the linked radiology report draft can be verified."
          )
        }

        const normalizedActor =
          normalizeActor(verifiedBy)

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "verified",

          updatedAt: verifiedAt,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const releaseRadiologyOrderReport =
    useCallback(
      (
        orderId: string,
        reportId: string,
        releasedBy: string,
        releasedAt =
          new Date().toISOString()
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status ===
            "released" &&
          order.reportId === reportId
        ) {
          return order
        }

        if (
          order.status !==
            "verified" ||
          order.reportId !== reportId
        ) {
          throw new Error(
            "Only the linked verified radiology report can be released."
          )
        }

        const normalizedActor =
          normalizeActor(releasedBy)

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "released",

          updatedAt: releasedAt,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )
  const cancelRadiologyOrder =
    useCallback(
      (
        orderId: string,
        cancellationReason: string,

        cancelledBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
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
          getRadiologyOrderOrThrow(
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
            "in-progress",
            "images-acquired",
            "technically-completed",
            "report-draft",
            "verified",
            "released",
          ].includes(order.status)
        ) {
          throw new Error(
            "The radiology order can no longer be cancelled through this workflow."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(
            cancelledBy
          )

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "cancelled",

          cancelledAt: now,

          cancelledBy:
            normalizedActor,

          cancellationReason:
            normalizedReason,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const markRadiologyNoShow =
    useCallback(
      (
        orderId: string,

        markedBy =
          RADIOLOGY_OPERATIONS_ACTOR
      ): RadiologyOrder => {
        const order =
          getRadiologyOrderOrThrow(
            ordersRef.current,
            orderId
          )

        if (
          order.status === "no-show"
        ) {
          return order
        }

        if (
          order.status !==
          "scheduled"
        ) {
          throw new Error(
            "Only a scheduled radiology order can be marked as no-show."
          )
        }

        const now =
          new Date().toISOString()

        const normalizedActor =
          normalizeActor(markedBy)

        const updatedOrder:
          RadiologyOrder = {
          ...order,

          status: "no-show",

          noShowAt: now,

          noShowMarkedBy:
            normalizedActor,

          updatedAt: now,

          updatedBy:
            normalizedActor,
        }

        return saveOrder(
          updatedOrder
        )
      },
      [saveOrder]
    )

  const contextValue =
    useMemo<RadiologyContextValue>(
      () => ({
        radiologyOrders,
        createRadiologyOrder,
        scheduleRadiologyOrder,
        updateRadiologyPreparationItem,
        checkInRadiologyOrder,
        markRadiologyReady,
        startRadiologyImaging,
        markRadiologyImagesAcquired,
        technicallyCompleteRadiologyOrder,
        attachRadiologyReportToOrder,
        verifyRadiologyOrderReport,
        releaseRadiologyOrderReport,
        cancelRadiologyOrder,
        markRadiologyNoShow,
      }),
      [
        radiologyOrders,
        createRadiologyOrder,
        scheduleRadiologyOrder,
        updateRadiologyPreparationItem,
        checkInRadiologyOrder,
        markRadiologyReady,
        startRadiologyImaging,
        markRadiologyImagesAcquired,
        technicallyCompleteRadiologyOrder,
        attachRadiologyReportToOrder,
        verifyRadiologyOrderReport,
        releaseRadiologyOrderReport,
        cancelRadiologyOrder,
        markRadiologyNoShow,
      ]
    )

  return (
    <RadiologyContext.Provider
      value={contextValue}
    >
      {children}
    </RadiologyContext.Provider>
  )
}

export function useRadiology(): RadiologyContextValue {
  const context = useContext(
    RadiologyContext
  )

  if (!context) {
    throw new Error(
      "useRadiology must be used inside RadiologyProvider."
    )
  }

  return context
}
