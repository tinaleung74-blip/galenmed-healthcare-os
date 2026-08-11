import type {
  PhilHealthAuditAction,
  PhilHealthAuditRecord,
  PhilHealthClaim,
  PhilHealthClaimRequirement,
  PhilHealthClaimStatus,
  PhilHealthEligibilityStatus,
  PhilHealthStaffRole,
  PhilHealthState,
} from "@/features/philhealth/types/philhealth.types"

interface ClaimNumberRecord {
  internalClaimNumber: string
}

const INTERNAL_REQUIREMENT_DEFINITIONS =
  [
    {
      code:
        "patient-consent",

      label:
        "Patient consent and authorization",

      required: true,
    },
    {
      code:
        "member-data-validation",

      label:
        "Member or dependent data validation",

      required: true,
    },
    {
      code:
        "eligibility-evidence",

      label:
        "Eligibility or PBEF evidence",

      required: true,
    },
    {
      code:
        "clinical-documentation",

      label:
        "Diagnosis and clinical documentation",

      required: true,
    },
    {
      code:
        "itemized-hospital-charges",

      label:
        "Itemized hospital charges",

      required: true,
    },
    {
      code:
        "supporting-claim-documents",

      label:
        "Supporting claim documents",

      required: true,
    },
  ] as const

const PREPARATION_STATUSES:
  readonly PhilHealthClaimStatus[] =
  [
    "draft",
    "eligibility-pending",
    "requirements-incomplete",
    "ready-for-review",
  ]

function sortAuditValue(
  value: unknown
): unknown {
  if (Array.isArray(value)) {
    return value.map(
      sortAuditValue
    )
  }

  if (
    typeof value ===
      "object" &&
    value !== null
  ) {
    const sortedEntries =
      Object.entries(
        value as Record<
          string,
          unknown
        >
      )
        .sort(
          (
            [firstKey],
            [secondKey]
          ) =>
            firstKey.localeCompare(
              secondKey,
              "en-PH"
            )
        )
        .map(
          (
            [
              key,
              entryValue,
            ]
          ) => [
            key,
            sortAuditValue(
              entryValue
            ),
          ]
        )

    return Object.fromEntries(
      sortedEntries
    )
  }

  return value
}

function isSensitiveAuditKey(
  key: string
): boolean {
  const normalizedKey =
    key
      .replace(
        /[_-]+/g,
        ""
      )
      .toLocaleLowerCase(
        "en-PH"
      )

  return [
    "philhealthidentificationnumber",
    "principalmemberpin",
    "pbefreference",
    "officialclaimnumber",
    "transmittalcontrolnumber",
    "patientdocumentid",
  ].some(
    (sensitiveKey) =>
      normalizedKey.includes(
        sensitiveKey
      )
  )
}

function protectSensitiveValue(
  value: unknown
): string {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return "[REDACTED]"
  }

  const normalizedValue =
    value.replace(
      /\s+/g,
      ""
    )

  const suffix =
    normalizedValue.slice(-4)

  return suffix
    ? `••••${suffix}`
    : "[REDACTED]"
}

function redactAuditValue(
  value: unknown,
  key = ""
): unknown {
  if (
    key &&
    isSensitiveAuditKey(key)
  ) {
    return protectSensitiveValue(
      value
    )
  }

  if (Array.isArray(value)) {
    return value.map(
      (entryValue) =>
        redactAuditValue(
          entryValue
        )
    )
  }

  if (
    typeof value ===
      "object" &&
    value !== null
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<
          string,
          unknown
        >
      ).map(
        (
          [
            entryKey,
            entryValue,
          ]
        ) => [
          entryKey,
          redactAuditValue(
            entryValue,
            entryKey
          ),
        ]
      )
    )
  }

  return value
}

export function createTemporaryPhilHealthId(
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

export function normalizePhilHealthPin(
  value: string
): string | null {
  const normalizedValue =
    value.replace(
      /[\s-]+/g,
      ""
    )

  return normalizedValue ||
    null
}

export function normalizePhilHealthOptionalText(
  value: string
): string | null {
  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

export function parsePhilHealthPesoToCentavos(
  value: string
): number {
  const normalizedValue =
    value.trim()

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizedValue
    )
  ) {
    throw new Error(
      "Enter a valid PHP amount with no more than two decimal places."
    )
  }

  const [
    wholePart,
    decimalPart = "",
  ] =
    normalizedValue.split(".")

  const centavos =
    Number(wholePart) *
      100 +
    Number(
      decimalPart.padEnd(
        2,
        "0"
      )
    )

  if (
    !Number.isSafeInteger(
      centavos
    ) ||
    centavos < 0
  ) {
    throw new Error(
      "The PHP amount is outside the supported range."
    )
  }

  return centavos
}

export function calculatePhilHealthPatientResponsibility(
  grossHospitalChargesCentavos:
    number,

  estimatedPhilHealthBenefitCentavos:
    number
): number {
  return Math.max(
    0,
    grossHospitalChargesCentavos -
      estimatedPhilHealthBenefitCentavos
  )
}

export function generateInternalPhilHealthClaimNumber(
  claims:
    readonly ClaimNumberRecord[],

  year =
    new Date().getFullYear()
): string {
  const prefix =
    `GM-PH-${year}-`

  const highestSequence =
    claims.reduce(
      (
        highest,
        claim
      ) => {
        if (
          !claim.internalClaimNumber.startsWith(
            prefix
          )
        ) {
          return highest
        }

        const sequence =
          Number(
            claim.internalClaimNumber.slice(
              prefix.length
            )
          )

        return (
          Number.isInteger(
            sequence
          ) &&
          sequence > highest
        )
          ? sequence
          : highest
      },
      0
    )

  return `${prefix}${String(
    highestSequence + 1
  ).padStart(6, "0")}`
}

export function createInitialPhilHealthClaimRequirements(
  claimId: string
): PhilHealthClaimRequirement[] {
  return INTERNAL_REQUIREMENT_DEFINITIONS.map(
    (definition) => ({
      id:
        createTemporaryPhilHealthId(
          "philhealth-requirement"
        ),

      claimId,

      code:
        definition.code,

      label:
        definition.label,

      required:
        definition.required,

      status: "missing",

      patientDocumentId:
        null,

      remarks:
        null,

      reviewedAt:
        null,

      reviewedBy:
        null,
    })
  )
}

export function calculatePhilHealthClaimCompleteness(
  requirements:
    readonly PhilHealthClaimRequirement[],

  eligibilityStatus:
    PhilHealthEligibilityStatus
): number {
  const requiredRequirements =
    requirements.filter(
      (requirement) =>
        requirement.required
    )

  const verifiedRequirements =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status ===
          "verified" ||
        requirement.status ===
          "not-required"
    ).length

  const eligibilityPoint =
    eligibilityStatus ===
    "eligible"
      ? 1
      : 0

  const totalPoints =
    requiredRequirements.length +
    1

  if (totalPoints === 0) {
    return 0
  }

  return Math.round(
    (
      (
        verifiedRequirements +
        eligibilityPoint
      ) /
      totalPoints
    ) *
      100
  )
}

export function derivePhilHealthClaimPreparationStatus({
  currentStatus,
  eligibilityStatus,
  requirements,
}: {
  currentStatus:
    PhilHealthClaimStatus

  eligibilityStatus:
    PhilHealthEligibilityStatus

  requirements:
    readonly PhilHealthClaimRequirement[]
}): PhilHealthClaimStatus {
  if (
    !PREPARATION_STATUSES.includes(
      currentStatus
    )
  ) {
    return currentStatus
  }

  if (
    eligibilityStatus !==
    "eligible"
  ) {
    return "eligibility-pending"
  }

  const incompleteRequirement =
    requirements.some(
      (requirement) =>
        requirement.required &&
        requirement.status !==
          "verified" &&
        requirement.status !==
          "not-required"
    )

  return incompleteRequirement
    ? "requirements-incomplete"
    : "ready-for-review"
}

export function serializePhilHealthAuditSnapshot(
  value: unknown
): string {
  return JSON.stringify(
    sortAuditValue(
      redactAuditValue(value)
    )
  )
}

export function createPhilHealthAuditRecord({
  patientId = null,
  claimId = null,
  action,
  summary,
  actor,
  actorRole,
  beforeValue = null,
  afterValue = null,
  occurredAt =
    new Date().toISOString(),
}: {
  patientId?: string | null
  claimId?: string | null

  action:
    PhilHealthAuditAction

  summary: string

  actor: string

  actorRole:
    PhilHealthStaffRole | null

  beforeValue?: unknown
  afterValue?: unknown

  occurredAt?: string
}): PhilHealthAuditRecord {
  return {
    id:
      createTemporaryPhilHealthId(
        "philhealth-audit"
      ),

    patientId,
    claimId,

    action,

    summary:
      summary.trim(),

    actor:
      actor.trim(),

    actorRole,

    occurredAt,

    beforeSnapshot:
      beforeValue === null
        ? null
        : serializePhilHealthAuditSnapshot(
            beforeValue
          ),

    afterSnapshot:
      afterValue === null
        ? null
        : serializePhilHealthAuditSnapshot(
            afterValue
          ),

    sensitiveFieldsRedacted:
      true,
  }
}

export function clonePhilHealthState(
  state: PhilHealthState
): PhilHealthState {
  if (
    typeof globalThis.structuredClone ===
    "function"
  ) {
    return globalThis.structuredClone(
      state
    )
  }

  return JSON.parse(
    JSON.stringify(state)
  ) as PhilHealthState
}

export function incrementPhilHealthStateRevision(
  state: PhilHealthState,
  updatedBy: string,
  updatedAt =
    new Date().toISOString()
): PhilHealthState {
  return {
    ...state,

    revision:
      state.revision + 1,

    updatedAt,

    updatedBy:
      updatedBy.trim(),
  }
}

export function replacePhilHealthClaim(
  claims:
    readonly PhilHealthClaim[],

  updatedClaim:
    PhilHealthClaim
): PhilHealthClaim[] {
  return claims.map(
    (claim) =>
      claim.id ===
      updatedClaim.id
        ? updatedClaim
        : claim
  )
}
