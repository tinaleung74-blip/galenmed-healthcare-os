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
  PHARMACY_OPERATIONS_ACTOR,
} from "@/features/pharmacy/constants/pharmacy.constants"
import {
  MOCK_PHARMACY_INVENTORY,
} from "@/features/pharmacy/data/pharmacy-inventory.mock-data"
import {
  MOCK_PHARMACY_PRESCRIPTIONS,
} from "@/features/pharmacy/data/pharmacy-prescription.mock-data"
import type {
  PharmacyDispenseFormValues,
} from "@/features/pharmacy/schemas/pharmacy-dispense.schema"
import type {
  PharmacyPrescriptionFormValues,
} from "@/features/pharmacy/schemas/pharmacy-prescription.schema"
import type {
  PharmacyCounselingValues,
  PharmacyDispensingVerificationValues,
  PharmacyPrescriptionReviewValues,
  PharmacyReleaseValues,
} from "@/features/pharmacy/schemas/pharmacy-review.schema"
import type {
  PharmacyDispensingRecord,
  PharmacyInventoryItem,
  PharmacyPrescription,
  PharmacyPrescriptionItem,
} from "@/features/pharmacy/types/pharmacy.types"
import {
  areAllPrescriptionItemsDispensed,
  createTemporaryPharmacyId,
  derivePharmacyInventoryStatus,
  generatePharmacyPrescriptionNumber,
  getMedicationDefinitionOrThrow,
  getPharmacyInventoryAvailableQuantity,
  getPrescriptionItemRemainingQuantity,
  isPharmacyInventoryExpired,
} from "@/features/pharmacy/utils/pharmacy.utils"
import {
  useConsultations,
} from "@/features/consultations/providers/consultation-provider"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  usePersistentDevelopmentState,
} from "@/hooks/use-persistent-development-state"

const PHARMACY_PRESCRIPTION_STORAGE_KEY =
  "galenmed:development:pharmacy-prescriptions:v1"

const PHARMACY_INVENTORY_STORAGE_KEY =
  "galenmed:development:pharmacy-inventory:v1"

const INITIAL_PHARMACY_PRESCRIPTIONS:
  PharmacyPrescription[] = [
  ...MOCK_PHARMACY_PRESCRIPTIONS,
]

const INITIAL_PHARMACY_INVENTORY:
  PharmacyInventoryItem[] = [
  ...MOCK_PHARMACY_INVENTORY,
]

interface PharmacyContextValue {
  prescriptions:
    PharmacyPrescription[]

  inventoryItems:
    PharmacyInventoryItem[]

  createPharmacyPrescription: (
    values:
      PharmacyPrescriptionFormValues
  ) => PharmacyPrescription

  reviewPharmacyPrescription: (
    prescriptionId: string,
    values:
      PharmacyPrescriptionReviewValues
  ) => PharmacyPrescription

  dispensePharmacyPrescriptionItem: (
    prescriptionId: string,
    values:
      PharmacyDispenseFormValues
  ) => PharmacyPrescription

  verifyPharmacyDispensing: (
    prescriptionId: string,
    values:
      PharmacyDispensingVerificationValues
  ) => PharmacyPrescription

  completePharmacyCounseling: (
    prescriptionId: string,
    values:
      PharmacyCounselingValues
  ) => PharmacyPrescription

  releasePharmacyPrescription: (
    prescriptionId: string,
    values:
      PharmacyReleaseValues
  ) => PharmacyPrescription

  cancelPharmacyPrescription: (
    prescriptionId: string,
    cancellationReason: string,
    cancelledBy?: string
  ) => PharmacyPrescription
}

const PharmacyContext =
  createContext<PharmacyContextValue | null>(
    null
  )

interface PharmacyProviderProps {
  children: ReactNode
}

function getPrescriptionOrThrow(
  prescriptions:
    readonly PharmacyPrescription[],

  prescriptionId: string
): PharmacyPrescription {
  const prescription =
    prescriptions.find(
      (candidatePrescription) =>
        candidatePrescription.id ===
        prescriptionId
    )

  if (!prescription) {
    throw new Error(
      "The pharmacy prescription was not found."
    )
  }

  return prescription
}

function getInventoryItemOrThrow(
  inventoryItems:
    readonly PharmacyInventoryItem[],

  inventoryItemId: string
): PharmacyInventoryItem {
  const inventoryItem =
    inventoryItems.find(
      (candidateItem) =>
        candidateItem.id ===
        inventoryItemId
    )

  if (!inventoryItem) {
    throw new Error(
      "The selected pharmacy inventory batch was not found."
    )
  }

  return inventoryItem
}

function replacePrescription(
  prescriptions:
    readonly PharmacyPrescription[],

  updatedPrescription:
    PharmacyPrescription
): PharmacyPrescription[] {
  return prescriptions.map(
    (prescription) =>
      prescription.id ===
      updatedPrescription.id
        ? updatedPrescription
        : prescription
  )
}

function replaceInventoryItem(
  inventoryItems:
    readonly PharmacyInventoryItem[],

  updatedInventoryItem:
    PharmacyInventoryItem
): PharmacyInventoryItem[] {
  return inventoryItems.map(
    (inventoryItem) =>
      inventoryItem.id ===
      updatedInventoryItem.id
        ? updatedInventoryItem
        : inventoryItem
  )
}

function normalizeActor(
  value: string,
  fallback =
    PHARMACY_OPERATIONS_ACTOR
): string {
  return value.trim() || fallback
}

export function PharmacyProvider({
  children,
}: PharmacyProviderProps) {
  const { patients } =
    usePatients()

  const { consultations } =
    useConsultations()

  const [
    prescriptions,
    setPrescriptions,
  ] =
    usePersistentDevelopmentState<
      PharmacyPrescription[]
    >(
      PHARMACY_PRESCRIPTION_STORAGE_KEY,
      INITIAL_PHARMACY_PRESCRIPTIONS
    )

  const [
    inventoryItems,
    setInventoryItems,
  ] =
    usePersistentDevelopmentState<
      PharmacyInventoryItem[]
    >(
      PHARMACY_INVENTORY_STORAGE_KEY,
      INITIAL_PHARMACY_INVENTORY
    )

  const prescriptionsRef =
    useRef<
      PharmacyPrescription[]
    >(prescriptions)

  const inventoryRef =
    useRef<
      PharmacyInventoryItem[]
    >(inventoryItems)

  useEffect(() => {
    prescriptionsRef.current =
      prescriptions
  }, [prescriptions])

  useEffect(() => {
    inventoryRef.current =
      inventoryItems
  }, [inventoryItems])

  const savePrescription =
    useCallback(
      (
        updatedPrescription:
          PharmacyPrescription
      ): PharmacyPrescription => {
        const nextPrescriptions =
          replacePrescription(
            prescriptionsRef.current,
            updatedPrescription
          )

        prescriptionsRef.current =
          nextPrescriptions

        setPrescriptions(
          nextPrescriptions
        )

        return updatedPrescription
      },
      [setPrescriptions]
    )

  const saveInventoryItem =
    useCallback(
      (
        updatedInventoryItem:
          PharmacyInventoryItem
      ): PharmacyInventoryItem => {
        const nextInventory =
          replaceInventoryItem(
            inventoryRef.current,
            updatedInventoryItem
          )

        inventoryRef.current =
          nextInventory

        setInventoryItems(
          nextInventory
        )

        return updatedInventoryItem
      },
      [setInventoryItems]
    )

  const createPharmacyPrescription =
    useCallback(
      (
        values:
          PharmacyPrescriptionFormValues
      ): PharmacyPrescription => {
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
            "The selected pharmacy branch was not found."
          )
        }

        const consultation =
          values.consultationId
            ? consultations.find(
                (
                  candidateConsultation
                ) =>
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
            "A cancelled or no-show consultation cannot create a pharmacy prescription."
          )
        }

        const items:
          PharmacyPrescriptionItem[] =
          values.items.map(
            (itemValue) => {
              const medication =
                getMedicationDefinitionOrThrow(
                  itemValue.medicationId
                )

              return {
                id:
                  createTemporaryPharmacyId(
                    "pharmacy-prescription-item"
                  ),

                medicationId:
                  medication.id,

                medicationSku:
                  medication.sku,

                genericName:
                  medication.genericName,

                brandName:
                  medication.brandName,

                strength:
                  medication.strength,

                dosageForm:
                  medication.dosageForm,

                dose:
                  itemValue.dose.trim(),

                route:
                  itemValue.route,

                frequency:
                  itemValue.frequency.trim(),

                durationDays:
                  itemValue.durationDays
                    ? Number(
                        itemValue.durationDays
                      )
                    : null,

                quantityPrescribed:
                  Number(
                    itemValue.quantityPrescribed
                  ),

                quantityDispensed: 0,

                instructions:
                  itemValue.instructions
                    .trim(),

                substitutionAllowed:
                  itemValue
                    .substitutionAllowed,

                status: "pending",
              }
            }
          )

        const now =
          new Date().toISOString()

        const newPrescription:
          PharmacyPrescription = {
          id:
            createTemporaryPharmacyId(
              "pharmacy-prescription"
            ),

          prescriptionNumber:
            generatePharmacyPrescriptionNumber(
              prescriptionsRef.current
            ),

          patientId:
            patient.id,

          consultationId:
            consultation?.id ?? null,

          consultationNumber:
            consultation
              ?.consultationNumber ??
            null,

          branchId:
            branch.id,

          branchName:
            branch.name,

          prescriberName:
            values.prescriberName
              .trim(),

          source:
            values.source,

          priority:
            values.priority,

          status:
            "pending-review",

          clinicalNotes:
            values.clinicalNotes
              .trim() || null,

          items,

          dispensingRecords: [],

          allergyReviewStatus:
            "pending",

          allergyReviewAt: null,
          allergyReviewBy: null,
          allergyReviewNotes: null,

          interactionReviewStatus:
            "pending",

          interactionReviewAt: null,
          interactionReviewBy: null,
          interactionReviewNotes: null,

          pharmacistVerifiedAt: null,
          pharmacistVerifiedBy: null,
          pharmacistVerificationNotes:
            null,

          counselingCompletedAt: null,
          counselingCompletedBy: null,
          counselingNotes: null,

          releasedAt: null,
          releasedBy: null,

          cancelledAt: null,
          cancelledBy: null,
          cancellationReason: null,

          createdAt: now,
          updatedAt: now,

          updatedBy:
            values.prescriberName
              .trim(),
        }

        const nextPrescriptions = [
          newPrescription,
          ...prescriptionsRef.current,
        ]

        prescriptionsRef.current =
          nextPrescriptions

        setPrescriptions(
          nextPrescriptions
        )

        return newPrescription
      },
      [
        consultations,
        patients,
        setPrescriptions,
      ]
    )

  const reviewPharmacyPrescription =
    useCallback(
      (
        prescriptionId: string,

        values:
          PharmacyPrescriptionReviewValues
      ): PharmacyPrescription => {
        const prescription =
          getPrescriptionOrThrow(
            prescriptionsRef.current,
            prescriptionId
          )

        if (
          ![
            "received",
            "pending-review",
            "on-hold",
          ].includes(
            prescription.status
          )
        ) {
          throw new Error(
            "This prescription can no longer be changed through the safety-review workflow."
          )
        }

        const reviewedBy =
          values.reviewedBy.trim()

        const now =
          new Date().toISOString()

        const isBlocked =
          values.allergyReviewStatus ===
            "blocked" ||
          values.interactionReviewStatus ===
            "blocked"

        const updatedPrescription:
          PharmacyPrescription = {
          ...prescription,

          status: isBlocked
            ? "on-hold"
            : "approved",

          allergyReviewStatus:
            values.allergyReviewStatus,

          allergyReviewAt: now,

          allergyReviewBy:
            reviewedBy,

          allergyReviewNotes:
            values.allergyReviewNotes
              .trim() || null,

          interactionReviewStatus:
            values.interactionReviewStatus,

          interactionReviewAt: now,

          interactionReviewBy:
            reviewedBy,

          interactionReviewNotes:
            values
              .interactionReviewNotes
              .trim() || null,

          updatedAt: now,

          updatedBy:
            reviewedBy,
        }

        return savePrescription(
          updatedPrescription
        )
      },
      [savePrescription]
    )

  const dispensePharmacyPrescriptionItem =
    useCallback(
      (
        prescriptionId: string,

        values:
          PharmacyDispenseFormValues
      ): PharmacyPrescription => {
        const prescription =
          getPrescriptionOrThrow(
            prescriptionsRef.current,
            prescriptionId
          )

        if (
          prescription.releasedAt
        ) {
          throw new Error(
            "A released prescription cannot be dispensed again."
          )
        }

        if (
          prescription.status !==
            "approved" &&
          prescription.status !==
            "partially-dispensed"
        ) {
          throw new Error(
            "The prescription must be approved before dispensing."
          )
        }

        if (
          prescription.allergyReviewStatus ===
            "pending" ||
          prescription.allergyReviewStatus ===
            "blocked" ||
          prescription.interactionReviewStatus ===
            "pending" ||
          prescription.interactionReviewStatus ===
            "blocked"
        ) {
          throw new Error(
            "Complete and clear the pharmacy safety reviews before dispensing."
          )
        }

        const prescriptionItem =
          prescription.items.find(
            (item) =>
              item.id ===
              values.prescriptionItemId
          )

        if (!prescriptionItem) {
          throw new Error(
            "The prescription medication item was not found."
          )
        }

        const remainingQuantity =
          getPrescriptionItemRemainingQuantity(
            prescriptionItem
          )

        if (
          remainingQuantity <= 0
        ) {
          return prescription
        }

        const quantityToDispense =
          Number(
            values.quantityToDispense
          )

        if (
          quantityToDispense >
          remainingQuantity
        ) {
          throw new Error(
            `Only ${remainingQuantity} remaining unit(s) may be dispensed for this prescription item.`
          )
        }

        const inventoryItem =
          getInventoryItemOrThrow(
            inventoryRef.current,
            values.inventoryItemId
          )

        if (
          inventoryItem.medicationId !==
          prescriptionItem.medicationId
        ) {
          throw new Error(
            "The selected inventory batch belongs to a different medication."
          )
        }

        if (
          inventoryItem.branchId !==
          prescription.branchId
        ) {
          throw new Error(
            "The selected inventory batch belongs to a different branch."
          )
        }

        if (
          inventoryItem.status ===
            "inactive" ||
          isPharmacyInventoryExpired(
            inventoryItem
          )
        ) {
          throw new Error(
            "The selected inventory batch is inactive or expired."
          )
        }

        const availableQuantity =
          getPharmacyInventoryAvailableQuantity(
            inventoryItem
          )

        if (
          quantityToDispense >
          availableQuantity
        ) {
          throw new Error(
            `Only ${availableQuantity} available unit(s) remain in this inventory batch.`
          )
        }

        const dispensedBy =
          normalizeActor(
            values.dispensedBy
          )

        const now =
          new Date().toISOString()

        const dispensingRecord:
          PharmacyDispensingRecord = {
          id:
            createTemporaryPharmacyId(
              "pharmacy-dispensing-record"
            ),

          prescriptionId:
            prescription.id,

          prescriptionItemId:
            prescriptionItem.id,

          medicationId:
            prescriptionItem.medicationId,

          medicationSku:
            prescriptionItem.medicationSku,

          genericName:
            prescriptionItem.genericName,

          strength:
            prescriptionItem.strength,

          inventoryItemId:
            inventoryItem.id,

          batchNumber:
            inventoryItem.batchNumber,

          quantityDispensed:
            quantityToDispense,

          dispensedAt: now,

          dispensedBy,

          labelReviewConfirmed:
            values.labelReviewConfirmed,
        }

        const nextQuantityDispensed =
          prescriptionItem
            .quantityDispensed +
          quantityToDispense

        const updatedItems =
          prescription.items.map(
            (item) =>
              item.id ===
              prescriptionItem.id
                ? {
                    ...item,

                    quantityDispensed:
                      nextQuantityDispensed,

                    status:
                      nextQuantityDispensed >=
                      item.quantityPrescribed
                        ? "dispensed" as const
                        : "partially-dispensed" as const,
                  }
                : item
          )

        const updatedPrescriptionBase:
          PharmacyPrescription = {
          ...prescription,

          items:
            updatedItems,

          dispensingRecords: [
            ...(
              prescription
                .dispensingRecords ??
              []
            ),
            dispensingRecord,
          ],

          updatedAt: now,

          updatedBy:
            dispensedBy,
        }

        const updatedPrescription:
          PharmacyPrescription = {
          ...updatedPrescriptionBase,

          status:
            areAllPrescriptionItemsDispensed(
              updatedPrescriptionBase
            )
              ? "dispensed"
              : "partially-dispensed",
        }

        const updatedInventoryBase:
          PharmacyInventoryItem = {
          ...inventoryItem,

          onHandQuantity:
            inventoryItem.onHandQuantity -
            quantityToDispense,

          updatedAt: now,

          updatedBy:
            dispensedBy,
        }

        const updatedInventory:
          PharmacyInventoryItem = {
          ...updatedInventoryBase,

          status:
            derivePharmacyInventoryStatus(
              updatedInventoryBase
            ),
        }

        saveInventoryItem(
          updatedInventory
        )

        return savePrescription(
          updatedPrescription
        )
      },
      [
        saveInventoryItem,
        savePrescription,
      ]
    )

  const verifyPharmacyDispensing =
    useCallback(
      (
        prescriptionId: string,

        values:
          PharmacyDispensingVerificationValues
      ): PharmacyPrescription => {
        const prescription =
          getPrescriptionOrThrow(
            prescriptionsRef.current,
            prescriptionId
          )

        if (
          prescription
            .pharmacistVerifiedAt
        ) {
          return prescription
        }

        if (
          prescription.status !==
            "dispensed" ||
          !areAllPrescriptionItemsDispensed(
            prescription
          )
        ) {
          throw new Error(
            "Complete dispensing for all prescription items before pharmacist verification."
          )
        }

        const verifiedBy =
          normalizeActor(
            values.verifiedBy
          )

        const now =
          new Date().toISOString()

        const updatedPrescription:
          PharmacyPrescription = {
          ...prescription,

          pharmacistVerifiedAt:
            now,

          pharmacistVerifiedBy:
            verifiedBy,

          pharmacistVerificationNotes:
            values.verificationNotes
              .trim() || null,

          updatedAt: now,

          updatedBy:
            verifiedBy,
        }

        return savePrescription(
          updatedPrescription
        )
      },
      [savePrescription]
    )

  const completePharmacyCounseling =
    useCallback(
      (
        prescriptionId: string,

        values:
          PharmacyCounselingValues
      ): PharmacyPrescription => {
        const prescription =
          getPrescriptionOrThrow(
            prescriptionsRef.current,
            prescriptionId
          )

        if (
          prescription
            .counselingCompletedAt
        ) {
          return prescription
        }

        if (
          !prescription
            .pharmacistVerifiedAt
        ) {
          throw new Error(
            "Pharmacist verification is required before medication counseling."
          )
        }

        const completedBy =
          normalizeActor(
            values
              .counselingCompletedBy
          )

        const now =
          new Date().toISOString()

        const updatedPrescription:
          PharmacyPrescription = {
          ...prescription,

          counselingCompletedAt:
            now,

          counselingCompletedBy:
            completedBy,

          counselingNotes:
            values.counselingNotes
              .trim(),

          updatedAt: now,

          updatedBy:
            completedBy,
        }

        return savePrescription(
          updatedPrescription
        )
      },
      [savePrescription]
    )

  const releasePharmacyPrescription =
    useCallback(
      (
        prescriptionId: string,

        values:
          PharmacyReleaseValues
      ): PharmacyPrescription => {
        const prescription =
          getPrescriptionOrThrow(
            prescriptionsRef.current,
            prescriptionId
          )

        if (
          prescription.releasedAt
        ) {
          return prescription
        }

        if (
          prescription.status !==
            "dispensed" ||
          !prescription
            .pharmacistVerifiedAt ||
          !prescription
            .counselingCompletedAt
        ) {
          throw new Error(
            "Complete dispensing, pharmacist verification, and counseling before final medication release."
          )
        }

        const releasedBy =
          normalizeActor(
            values.releasedBy
          )

        const now =
          new Date().toISOString()

        const updatedPrescription:
          PharmacyPrescription = {
          ...prescription,

          releasedAt: now,

          releasedBy,

          updatedAt: now,

          updatedBy:
            releasedBy,
        }

        return savePrescription(
          updatedPrescription
        )
      },
      [savePrescription]
    )

  const cancelPharmacyPrescription =
    useCallback(
      (
        prescriptionId: string,
        cancellationReason: string,

        cancelledBy =
          PHARMACY_OPERATIONS_ACTOR
      ): PharmacyPrescription => {
        const prescription =
          getPrescriptionOrThrow(
            prescriptionsRef.current,
            prescriptionId
          )

        if (
          prescription.status ===
          "cancelled"
        ) {
          return prescription
        }

        if (
          prescription.items.some(
            (item) =>
              item.quantityDispensed >
              0
          ) ||
          prescription.releasedAt
        ) {
          throw new Error(
            "A prescription with dispensed medication cannot be cancelled through this workflow."
          )
        }

        const normalizedReason =
          cancellationReason.trim()

        if (
          normalizedReason.length < 5
        ) {
          throw new Error(
            "A cancellation reason of at least five characters is required."
          )
        }

        const actor =
          normalizeActor(
            cancelledBy
          )

        const now =
          new Date().toISOString()

        const updatedPrescription:
          PharmacyPrescription = {
          ...prescription,

          status: "cancelled",

          items:
            prescription.items.map(
              (item) => ({
                ...item,
                status: "cancelled",
              })
            ),

          cancelledAt: now,

          cancelledBy:
            actor,

          cancellationReason:
            normalizedReason,

          updatedAt: now,

          updatedBy:
            actor,
        }

        return savePrescription(
          updatedPrescription
        )
      },
      [savePrescription]
    )

  const contextValue =
    useMemo<PharmacyContextValue>(
      () => ({
        prescriptions,
        inventoryItems,
        createPharmacyPrescription,
        reviewPharmacyPrescription,
        dispensePharmacyPrescriptionItem,
        verifyPharmacyDispensing,
        completePharmacyCounseling,
        releasePharmacyPrescription,
        cancelPharmacyPrescription,
      }),
      [
        prescriptions,
        inventoryItems,
        createPharmacyPrescription,
        reviewPharmacyPrescription,
        dispensePharmacyPrescriptionItem,
        verifyPharmacyDispensing,
        completePharmacyCounseling,
        releasePharmacyPrescription,
        cancelPharmacyPrescription,
      ]
    )

  return (
    <PharmacyContext.Provider
      value={contextValue}
    >
      {children}
    </PharmacyContext.Provider>
  )
}

export function usePharmacy(): PharmacyContextValue {
  const context =
    useContext(
      PharmacyContext
    )

  if (!context) {
    throw new Error(
      "usePharmacy must be used inside PharmacyProvider."
    )
  }

  return context
}
