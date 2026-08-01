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
  APPOINTMENT_DEPARTMENTS,
  APPOINTMENT_DOCTORS,
  APPOINTMENT_ROOMS,
  APPOINTMENT_SCHEDULING_ACTOR,
} from "@/features/appointments/constants/appointment.constants"
import { MOCK_APPOINTMENTS } from "@/features/appointments/data/appointment.mock-data"
import { usePersistentDevelopmentState } from "@/hooks/use-persistent-development-state"
import type { AppointmentFormValues } from "@/features/appointments/schemas/appointment.schema"
import type {
  AppointmentRecord,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types"
import {
  buildAppointmentSchedule,
  findAppointmentConflicts,
  formatAppointmentRange,
} from "@/features/appointments/utils/appointment.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import { usePatients } from "@/features/patients/providers/patient-provider"

const APPOINTMENT_STORAGE_KEY =
  "galenmed:development:appointments:v2"

const INITIAL_APPOINTMENTS:
  AppointmentRecord[] = [
  ...MOCK_APPOINTMENTS,
]

interface AppointmentContextValue {
  appointments: AppointmentRecord[]

  createAppointment: (
    values: AppointmentFormValues
  ) => AppointmentRecord

  updateAppointment: (
    appointmentId: string,
    values: AppointmentFormValues
  ) => AppointmentRecord

  linkAppointmentConsultation: (
    appointmentId: string,
    consultationId: string,
    consultationNumber: string
  ) => AppointmentRecord

  markAppointmentInConsultation: (
    consultationId: string,
    startedAt?: string,
    updatedBy?: string
  ) => AppointmentRecord | null

  completeAppointmentFromConsultation: (
    consultationId: string,
    completedAt?: string,
    updatedBy?: string
  ) => AppointmentRecord | null

  confirmAppointment: (
    appointmentId: string
  ) => AppointmentRecord

  checkInAppointment: (
    appointmentId: string
  ) => AppointmentRecord

  cancelAppointment: (
    appointmentId: string,
    cancellationReason: string
  ) => AppointmentRecord

  markAppointmentNoShow: (
    appointmentId: string
  ) => AppointmentRecord
}

const AppointmentContext =
  createContext<AppointmentContextValue | null>(
    null
  )

interface AppointmentProviderProps {
  children: ReactNode
}

function createTemporaryAppointmentId(): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `appointment-${globalThis.crypto.randomUUID()}`
  }

  return `appointment-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function generateAppointmentNumber(
  appointments:
    readonly AppointmentRecord[],
  year = new Date().getFullYear()
): string {
  const prefix =
    `GM-APT-${year}-`

  const highestSequence =
    appointments.reduce(
      (highest, appointment) => {
        if (
          !appointment.appointmentNumber.startsWith(
            prefix
          )
        ) {
          return highest
        }

        const sequence = Number(
          appointment.appointmentNumber.slice(
            prefix.length
          )
        )

        return (
          Number.isInteger(sequence) &&
          sequence > highest
            ? sequence
            : highest
        )
      },
      0
    )

  return `${prefix}${String(
    highestSequence + 1
  ).padStart(6, "0")}`
}

function getBranchOrThrow(
  branchId: string
) {
  const branch =
    GALENMED_BRANCHES.find(
      (candidateBranch) =>
        candidateBranch.id ===
        branchId
    )

  if (!branch) {
    throw new Error(
      "The selected GalenMed branch was not found."
    )
  }

  return branch
}

function getDepartmentOrThrow(
  departmentId: string
) {
  const department =
    APPOINTMENT_DEPARTMENTS.find(
      (candidateDepartment) =>
        candidateDepartment.id ===
        departmentId
    )

  if (!department) {
    throw new Error(
      "The selected department was not found."
    )
  }

  return department
}

function getDoctorOrThrow(
  doctorId: string,
  departmentId: string
) {
  const doctor =
    APPOINTMENT_DOCTORS.find(
      (candidateDoctor) =>
        candidateDoctor.id ===
        doctorId
    )

  if (!doctor) {
    throw new Error(
      "The selected doctor was not found."
    )
  }

  const belongsToDepartment =
    doctor.departmentIds.some(
      (candidateDepartmentId) =>
        candidateDepartmentId ===
        departmentId
    )

  if (!belongsToDepartment) {
    throw new Error(
      "The selected doctor is not assigned to the selected department."
    )
  }

  return doctor
}

function getRoomOrThrow(
  roomId: string,
  departmentId: string
) {
  if (!roomId) {
    return null
  }

  const room =
    APPOINTMENT_ROOMS.find(
      (candidateRoom) =>
        candidateRoom.id === roomId
    )

  if (!room) {
    throw new Error(
      "The selected consultation room was not found."
    )
  }

  const supportsDepartment =
    room.departmentIds.some(
      (candidateDepartmentId) =>
        candidateDepartmentId ===
        departmentId
    )

  if (!supportsDepartment) {
    throw new Error(
      "The selected room is not configured for this department."
    )
  }

  return room
}

function getAppointmentOrThrow(
  appointments:
    readonly AppointmentRecord[],
  appointmentId: string
): AppointmentRecord {
  const appointment =
    appointments.find(
      (candidateAppointment) =>
        candidateAppointment.id ===
        appointmentId
    )

  if (!appointment) {
    throw new Error(
      "The appointment record was not found."
    )
  }

  return appointment
}

function ensureNoSchedulingConflict(
  appointments:
    readonly AppointmentRecord[],

  candidate: {
    patientId: string
    doctorId: string
    roomId: string | null
    scheduledStartAt: string
    scheduledEndAt: string
  },

  excludedAppointmentId?: string
) {
  const conflicts =
    findAppointmentConflicts(
      appointments,
      candidate,
      excludedAppointmentId
    )

  const firstConflict =
    conflicts[0]

  if (!firstConflict) {
    return
  }

  const resourceLabel = {
    patient: "Patient",
    doctor: "Doctor",
    room: "Room",
  }[firstConflict.resource]

  throw new Error(
    `${resourceLabel} already has a conflicting appointment: ${firstConflict.appointment.appointmentNumber}, ${formatAppointmentRange(
      firstConflict.appointment
    )}.`
  )
}

function canBeRescheduled(
  status: AppointmentStatus
): boolean {
  return (
    status === "scheduled" ||
    status === "confirmed"
  )
}

export function AppointmentProvider({
  children,
}: AppointmentProviderProps) {
  const { patients } = usePatients()

  const [
    appointments,
    setAppointments,
  ] =
    usePersistentDevelopmentState<
      AppointmentRecord[]
    >(
      APPOINTMENT_STORAGE_KEY,
      INITIAL_APPOINTMENTS
    )

  const appointmentsRef =
    useRef<AppointmentRecord[]>(
      appointments
    )

  useEffect(() => {
    appointmentsRef.current =
      appointments
  }, [appointments])

  const createAppointment =
    useCallback(
      (
        values: AppointmentFormValues
      ): AppointmentRecord => {
        const patientExists =
          patients.some(
            (patient) =>
              patient.id ===
              values.patientId
          )

        if (!patientExists) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        const branch =
          getBranchOrThrow(
            values.branchId
          )

        const department =
          getDepartmentOrThrow(
            values.departmentId
          )

        const doctor =
          getDoctorOrThrow(
            values.doctorId,
            department.id
          )

        const room =
          values.mode ===
          "telemedicine"
            ? null
            : getRoomOrThrow(
                values.roomId,
                department.id
              )

        const schedule =
          buildAppointmentSchedule(
            values
          )

        ensureNoSchedulingConflict(
          appointmentsRef.current,
          {
            patientId:
              values.patientId,

            doctorId:
              doctor.id,

            roomId:
              room?.id ?? null,

            scheduledStartAt:
              schedule.scheduledStartAt,

            scheduledEndAt:
              schedule.scheduledEndAt,
          }
        )

        const now =
          new Date().toISOString()

        const newAppointment:
          AppointmentRecord = {
          id:
            createTemporaryAppointmentId(),

          appointmentNumber:
            generateAppointmentNumber(
              appointmentsRef.current
            ),

          patientId:
            values.patientId,

          branchId:
            branch.id,

          branchName:
            branch.name,

          departmentId:
            department.id,

          departmentName:
            department.name,

          doctorId:
            doctor.id,

          doctorName:
            doctor.name,

          roomId:
            room?.id ?? null,

          roomName:
            room?.name ?? null,

          ...schedule,

          mode:
            values.mode,

          visitType:
            values.visitType,

          status:
            values.status,

          priority:
            values.priority,

          source:
            values.source,

          chiefComplaint:
            values.chiefComplaint.trim(),

          patientInstructions:
            values.patientInstructions
              .trim() || null,

          internalNotes:
            values.internalNotes
              .trim() || null,

          linkedConsultationId: null,

          linkedConsultationNumber: null,

          confirmedAt:
            values.status ===
            "confirmed"
              ? now
              : null,

          checkedInAt: null,

          consultationStartedAt: null,

          completedAt: null,

          cancelledAt: null,
          cancelledBy: null,
          cancellationReason: null,

          noShowAt: null,
          noShowMarkedBy: null,

          createdBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          createdAt: now,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments = [
          newAppointment,
          ...appointmentsRef.current,
        ]

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return newAppointment
      },
      [patients, setAppointments]
    )

  const updateAppointment =
    useCallback(
      (
        appointmentId: string,
        values: AppointmentFormValues
      ): AppointmentRecord => {
        const existingAppointment =
          getAppointmentOrThrow(
            appointmentsRef.current,
            appointmentId
          )

        if (
          !canBeRescheduled(
            existingAppointment.status
          )
        ) {
          throw new Error(
            "Only scheduled or confirmed appointments can be edited or rescheduled."
          )
        }

        const patientExists =
          patients.some(
            (patient) =>
              patient.id ===
              values.patientId
          )

        if (!patientExists) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        const branch =
          getBranchOrThrow(
            values.branchId
          )

        const department =
          getDepartmentOrThrow(
            values.departmentId
          )

        const doctor =
          getDoctorOrThrow(
            values.doctorId,
            department.id
          )

        const room =
          values.mode ===
          "telemedicine"
            ? null
            : getRoomOrThrow(
                values.roomId,
                department.id
              )

        const schedule =
          buildAppointmentSchedule(
            values
          )

        ensureNoSchedulingConflict(
          appointmentsRef.current,
          {
            patientId:
              values.patientId,

            doctorId:
              doctor.id,

            roomId:
              room?.id ?? null,

            scheduledStartAt:
              schedule.scheduledStartAt,

            scheduledEndAt:
              schedule.scheduledEndAt,
          },
          appointmentId
        )

        const now =
          new Date().toISOString()

        const updatedAppointment:
          AppointmentRecord = {
          ...existingAppointment,

          patientId:
            values.patientId,

          branchId:
            branch.id,

          branchName:
            branch.name,

          departmentId:
            department.id,

          departmentName:
            department.name,

          doctorId:
            doctor.id,

          doctorName:
            doctor.name,

          roomId:
            room?.id ?? null,

          roomName:
            room?.name ?? null,

          ...schedule,

          mode:
            values.mode,

          visitType:
            values.visitType,

          status:
            values.status,

          priority:
            values.priority,

          source:
            values.source,

          chiefComplaint:
            values.chiefComplaint.trim(),

          patientInstructions:
            values.patientInstructions
              .trim() || null,

          internalNotes:
            values.internalNotes
              .trim() || null,

          confirmedAt:
            values.status ===
            "confirmed"
              ? existingAppointment
                  .confirmedAt ?? now
              : null,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (appointment) =>
              appointment.id ===
              appointmentId
                ? updatedAppointment
                : appointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return updatedAppointment
      },
      [patients, setAppointments]
    )

  const linkAppointmentConsultation =
    useCallback(
      (
        appointmentId: string,
        consultationId: string,
        consultationNumber: string
      ): AppointmentRecord => {
        const appointment =
          getAppointmentOrThrow(
            appointmentsRef.current,
            appointmentId
          )

        if (
          appointment.linkedConsultationId &&
          appointment.linkedConsultationNumber
        ) {
          if (
            appointment.linkedConsultationId ===
              consultationId &&
            appointment.linkedConsultationNumber ===
              consultationNumber
          ) {
            return appointment
          }

          throw new Error(
            "This appointment is already linked to a different consultation."
          )
        }

        const now =
          new Date().toISOString()

        const linkedAppointment:
          AppointmentRecord = {
          ...appointment,

          linkedConsultationId:
            consultationId,

          linkedConsultationNumber:
            consultationNumber,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointmentId
                ? linkedAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return linkedAppointment
      },
      [setAppointments]
    )
  const markAppointmentInConsultation =
    useCallback(
      (
        consultationId: string,
        startedAt =
          new Date().toISOString(),
        updatedBy =
          APPOINTMENT_SCHEDULING_ACTOR
      ): AppointmentRecord | null => {
        const appointment =
          appointmentsRef.current.find(
            (candidateAppointment) =>
              candidateAppointment.linkedConsultationId ===
              consultationId
          ) ?? null

        if (!appointment) {
          return null
        }

        if (
          appointment.status ===
          "in-consultation"
        ) {
          return appointment
        }

        if (
          appointment.status !==
          "checked-in"
        ) {
          throw new Error(
            "The linked appointment must be checked in before starting the consultation."
          )
        }

        const updatedAppointment:
          AppointmentRecord = {
          ...appointment,

          status: "in-consultation",

          consultationStartedAt:
            startedAt,

          updatedBy,

          updatedAt:
            startedAt,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointment.id
                ? updatedAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return updatedAppointment
      },
      [setAppointments]
    )

  const completeAppointmentFromConsultation =
    useCallback(
      (
        consultationId: string,
        completedAt =
          new Date().toISOString(),
        updatedBy =
          APPOINTMENT_SCHEDULING_ACTOR
      ): AppointmentRecord | null => {
        const appointment =
          appointmentsRef.current.find(
            (candidateAppointment) =>
              candidateAppointment.linkedConsultationId ===
              consultationId
          ) ?? null

        if (!appointment) {
          return null
        }

        if (
          appointment.status ===
          "completed"
        ) {
          return appointment
        }

        if (
          appointment.status !==
          "in-consultation"
        ) {
          throw new Error(
            "The linked appointment must be in consultation before it can be completed."
          )
        }

        const completedAppointment:
          AppointmentRecord = {
          ...appointment,

          status: "completed",

          completedAt,

          updatedBy,

          updatedAt:
            completedAt,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointment.id
                ? completedAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return completedAppointment
      },
      [setAppointments]
    )
  const confirmAppointment =
    useCallback(
      (
        appointmentId: string
      ): AppointmentRecord => {
        const appointment =
          getAppointmentOrThrow(
            appointmentsRef.current,
            appointmentId
          )

        if (
          appointment.status ===
          "confirmed"
        ) {
          return appointment
        }

        if (
          appointment.status !==
          "scheduled"
        ) {
          throw new Error(
            "Only a scheduled appointment can be confirmed."
          )
        }

        const now =
          new Date().toISOString()

        const confirmedAppointment:
          AppointmentRecord = {
          ...appointment,

          status: "confirmed",

          confirmedAt: now,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointmentId
                ? confirmedAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return confirmedAppointment
      },
      [setAppointments]
    )

  const checkInAppointment =
    useCallback(
      (
        appointmentId: string
      ): AppointmentRecord => {
        const appointment =
          getAppointmentOrThrow(
            appointmentsRef.current,
            appointmentId
          )

        if (
          appointment.status ===
          "checked-in"
        ) {
          return appointment
        }

        if (
          appointment.status !==
            "scheduled" &&
          appointment.status !==
            "confirmed"
        ) {
          throw new Error(
            "Only a scheduled or confirmed appointment can be checked in."
          )
        }

        const now =
          new Date().toISOString()

        const checkedInAppointment:
          AppointmentRecord = {
          ...appointment,

          status: "checked-in",

          checkedInAt: now,

          confirmedAt:
            appointment.confirmedAt ??
            now,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointmentId
                ? checkedInAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return checkedInAppointment
      },
      [setAppointments]
    )

  const cancelAppointment =
    useCallback(
      (
        appointmentId: string,
        cancellationReason: string
      ): AppointmentRecord => {
        const normalizedReason =
          cancellationReason.trim()

        if (
          normalizedReason.length < 5
        ) {
          throw new Error(
            "A cancellation reason of at least five characters is required."
          )
        }

        const appointment =
          getAppointmentOrThrow(
            appointmentsRef.current,
            appointmentId
          )

        if (
          appointment.status ===
            "in-consultation" ||
          appointment.status ===
            "completed" ||
          appointment.status ===
            "cancelled" ||
          appointment.status ===
            "no-show"
        ) {
          throw new Error(
            "The selected appointment cannot be cancelled."
          )
        }

        const now =
          new Date().toISOString()

        const cancelledAppointment:
          AppointmentRecord = {
          ...appointment,

          status: "cancelled",

          cancelledAt: now,

          cancelledBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          cancellationReason:
            normalizedReason,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointmentId
                ? cancelledAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return cancelledAppointment
      },
      [setAppointments]
    )

  const markAppointmentNoShow =
    useCallback(
      (
        appointmentId: string
      ): AppointmentRecord => {
        const appointment =
          getAppointmentOrThrow(
            appointmentsRef.current,
            appointmentId
          )

        if (
          appointment.status !==
            "scheduled" &&
          appointment.status !==
            "confirmed"
        ) {
          throw new Error(
            "Only a scheduled or confirmed appointment can be marked as no-show."
          )
        }

        const now =
          new Date().toISOString()

        const noShowAppointment:
          AppointmentRecord = {
          ...appointment,

          status: "no-show",

          noShowAt: now,

          noShowMarkedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedBy:
            APPOINTMENT_SCHEDULING_ACTOR,

          updatedAt: now,
        }

        const nextAppointments =
          appointmentsRef.current.map(
            (currentAppointment) =>
              currentAppointment.id ===
              appointmentId
                ? noShowAppointment
                : currentAppointment
          )

        appointmentsRef.current =
          nextAppointments

        setAppointments(
          nextAppointments
        )

        return noShowAppointment
      },
      [setAppointments]
    )

  const contextValue =
    useMemo<AppointmentContextValue>(
      () => ({
        appointments,
        createAppointment,
        updateAppointment,
        linkAppointmentConsultation,
        markAppointmentInConsultation,
        completeAppointmentFromConsultation,
        confirmAppointment,
        checkInAppointment,
        cancelAppointment,
        markAppointmentNoShow,
      }),
      [
        appointments,
        createAppointment,
        updateAppointment,
        linkAppointmentConsultation,
        markAppointmentInConsultation,
        completeAppointmentFromConsultation,
        confirmAppointment,
        checkInAppointment,
        cancelAppointment,
        markAppointmentNoShow,
      ]
    )

  return (
    <AppointmentContext.Provider
      value={contextValue}
    >
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointments(): AppointmentContextValue {
  const context = useContext(
    AppointmentContext
  )

  if (!context) {
    throw new Error(
      "useAppointments must be used inside AppointmentProvider."
    )
  }

  return context
}
