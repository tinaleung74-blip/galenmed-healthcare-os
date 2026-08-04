import {
  PHARMACY_MEDICATION_CATALOG,
} from "@/features/pharmacy/constants/pharmacy.constants"
import type {
  PharmacyInventoryItem,
  PharmacyInventoryStatus,
  PharmacyMedicationDefinition,
  PharmacyPrescription,
  PharmacyPrescriptionItem,
} from "@/features/pharmacy/types/pharmacy.types"

export function createTemporaryPharmacyId(
  prefix: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in
      globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function generatePharmacyPrescriptionNumber(
  prescriptions:
    readonly PharmacyPrescription[],

  year = new Date().getFullYear()
): string {
  const prefix =
    `GM-RX-${year}-`

  const highestSequence =
    prescriptions.reduce(
      (
        highest,
        prescription
      ) => {
        if (
          !prescription
            .prescriptionNumber
            .startsWith(prefix)
        ) {
          return highest
        }

        const sequence = Number(
          prescription
            .prescriptionNumber
            .slice(prefix.length)
        )

        return (
          Number.isInteger(
            sequence
          ) &&
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

export function getMedicationDefinitionOrThrow(
  medicationId: string
): PharmacyMedicationDefinition {
  const medication =
    PHARMACY_MEDICATION_CATALOG.find(
      (candidateMedication) =>
        candidateMedication.id ===
        medicationId
    )

  if (!medication) {
    throw new Error(
      "The selected medication was not found in the synthetic catalog."
    )
  }

  if (!medication.active) {
    throw new Error(
      "The selected medication is inactive."
    )
  }

  return medication
}

export function getPharmacyInventoryAvailableQuantity(
  inventoryItem:
    Pick<
      PharmacyInventoryItem,
      | "onHandQuantity"
      | "reservedQuantity"
    >
): number {
  return Math.max(
    0,
    inventoryItem.onHandQuantity -
      inventoryItem.reservedQuantity
  )
}

export function derivePharmacyInventoryStatus(
  inventoryItem:
    Pick<
      PharmacyInventoryItem,
      | "onHandQuantity"
      | "reservedQuantity"
      | "reorderLevel"
      | "status"
    >
): PharmacyInventoryStatus {
  if (
    inventoryItem.status ===
    "inactive"
  ) {
    return "inactive"
  }

  const availableQuantity =
    getPharmacyInventoryAvailableQuantity(
      inventoryItem
    )

  if (availableQuantity <= 0) {
    return "out-of-stock"
  }

  if (
    availableQuantity <=
    inventoryItem.reorderLevel
  ) {
    return "low-stock"
  }

  return "available"
}

export function isPharmacyInventoryExpired(
  inventoryItem:
    Pick<
      PharmacyInventoryItem,
      "expiresAt"
    >,

  referenceDate = new Date()
): boolean {
  const expirationDate =
    new Date(
      `${inventoryItem.expiresAt}T23:59:59`
    )

  if (
    Number.isNaN(
      expirationDate.getTime()
    )
  ) {
    return true
  }

  return (
    expirationDate.getTime() <
    referenceDate.getTime()
  )
}

export function getPrescriptionItemRemainingQuantity(
  item:
    Pick<
      PharmacyPrescriptionItem,
      | "quantityPrescribed"
      | "quantityDispensed"
    >
): number {
  return Math.max(
    0,
    item.quantityPrescribed -
      item.quantityDispensed
  )
}

export function areAllPrescriptionItemsDispensed(
  prescription:
    Pick<
      PharmacyPrescription,
      "items"
    >
): boolean {
  const activeItems =
    prescription.items.filter(
      (item) =>
        item.status !==
        "cancelled"
    )

  return (
    activeItems.length > 0 &&
    activeItems.every(
      (item) =>
        getPrescriptionItemRemainingQuantity(
          item
        ) === 0
    )
  )
}

export function findAvailableInventoryForMedication(
  inventoryItems:
    readonly PharmacyInventoryItem[],

  medicationId: string,
  branchId: string
): PharmacyInventoryItem[] {
  return inventoryItems
    .filter(
      (inventoryItem) =>
        inventoryItem.medicationId ===
          medicationId &&
        inventoryItem.branchId ===
          branchId &&
        inventoryItem.status !==
          "inactive" &&
        !isPharmacyInventoryExpired(
          inventoryItem
        ) &&
        getPharmacyInventoryAvailableQuantity(
          inventoryItem
        ) > 0
    )
    .sort(
      (
        firstItem,
        secondItem
      ) =>
        new Date(
          firstItem.expiresAt
        ).getTime() -
        new Date(
          secondItem.expiresAt
        ).getTime()
    )
}
