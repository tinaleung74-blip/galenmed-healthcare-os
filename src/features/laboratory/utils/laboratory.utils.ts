import type {
  LaboratoryOrder,
  LaboratoryOrderItem,
  LaboratorySpecimenRecord,
  LaboratorySpecimenType,
} from "@/features/laboratory/types/laboratory.types"

export function createTemporaryLaboratoryId(
  prefix: string
): string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function generateLaboratoryOrderNumber(
  orders:
    readonly LaboratoryOrder[],
  year = new Date().getFullYear()
): string {
  const prefix =
    `GM-LAB-${year}-`

  const highestSequence =
    orders.reduce(
      (highest, order) => {
        if (
          !order.orderNumber.startsWith(
            prefix
          )
        ) {
          return highest
        }

        const sequence = Number(
          order.orderNumber.slice(
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

export function generateLaboratoryAccessionNumber(
  orders:
    readonly LaboratoryOrder[],
  year = new Date().getFullYear()
): string {
  const prefix =
    `GM-ACC-${year}-`

  const highestSequence =
    orders
      .flatMap(
        (order) => order.specimens
      )
      .reduce(
        (highest, specimen) => {
          if (
            !specimen.accessionNumber.startsWith(
              prefix
            )
          ) {
            return highest
          }

          const sequence = Number(
            specimen.accessionNumber.slice(
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

export function getRequiredSpecimenTypes(
  items:
    readonly LaboratoryOrderItem[]
): LaboratorySpecimenType[] {
  return Array.from(
    new Set(
      items
        .filter(
          (item) =>
            item.status !== "cancelled"
        )
        .map(
          (item) =>
            item.specimenType
        )
    )
  )
}

function hasUsableSpecimen(
  specimens:
    readonly LaboratorySpecimenRecord[],
  specimenType:
    LaboratorySpecimenType
): boolean {
  return specimens.some(
    (specimen) =>
      specimen.specimenType ===
        specimenType &&
      specimen.status !== "rejected"
  )
}

function hasReceivedSpecimen(
  specimens:
    readonly LaboratorySpecimenRecord[],
  specimenType:
    LaboratorySpecimenType
): boolean {
  return specimens.some(
    (specimen) =>
      specimen.specimenType ===
        specimenType &&
      specimen.status === "received"
  )
}

export function areAllRequiredSpecimensCollected(
  order: LaboratoryOrder
): boolean {
  const requiredTypes =
    getRequiredSpecimenTypes(
      order.items
    )

  return (
    requiredTypes.length > 0 &&
    requiredTypes.every(
      (specimenType) =>
        hasUsableSpecimen(
          order.specimens,
          specimenType
        )
    )
  )
}

export function areAllRequiredSpecimensReceived(
  order: LaboratoryOrder
): boolean {
  const requiredTypes =
    getRequiredSpecimenTypes(
      order.items
    )

  return (
    requiredTypes.length > 0 &&
    requiredTypes.every(
      (specimenType) =>
        hasReceivedSpecimen(
          order.specimens,
          specimenType
        )
    )
  )
}

export function getLaboratorySpecimenProgress(
  order: LaboratoryOrder
): {
  required: number
  collected: number
  received: number
  rejected: number
} {
  const requiredTypes =
    getRequiredSpecimenTypes(
      order.items
    )

  const collected =
    requiredTypes.filter(
      (specimenType) =>
        hasUsableSpecimen(
          order.specimens,
          specimenType
        )
    ).length

  const received =
    requiredTypes.filter(
      (specimenType) =>
        hasReceivedSpecimen(
          order.specimens,
          specimenType
        )
    ).length

  const rejected =
    order.specimens.filter(
      (specimen) =>
        specimen.status ===
        "rejected"
    ).length

  return {
    required:
      requiredTypes.length,
    collected,
    received,
    rejected,
  }
}
