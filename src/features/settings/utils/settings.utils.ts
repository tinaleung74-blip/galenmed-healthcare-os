import type {
  GalenMedSettingsState,
  SettingsAuditAction,
  SettingsAuditRecord,
  SettingsSection,
} from "@/features/settings/types/settings.types"

function sortSettingsValue(
  value: unknown
): unknown {
  if (Array.isArray(value)) {
    return value.map(
      sortSettingsValue
    )
  }

  if (
    typeof value === "object" &&
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
          ([key, entryValue]) => [
            key,
            sortSettingsValue(
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

function serializeSettingsValue(
  value: unknown
): string {
  return JSON.stringify(
    sortSettingsValue(value)
  )
}

export function createTemporarySettingsId(
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

export function normalizeSettingsActor(
  value: string,
  fallback =
    "GalenMed System"
): string {
  return value.trim() || fallback
}

export function cloneGalenMedSettings(
  settings:
    GalenMedSettingsState
): GalenMedSettingsState {
  if (
    typeof globalThis.structuredClone ===
    "function"
  ) {
    return globalThis.structuredClone(
      settings
    )
  }

  return JSON.parse(
    JSON.stringify(settings)
  ) as GalenMedSettingsState
}

export function settingsValuesAreEqual(
  firstValue: unknown,
  secondValue: unknown
): boolean {
  return (
    serializeSettingsValue(
      firstValue
    ) ===
    serializeSettingsValue(
      secondValue
    )
  )
}

export function summarizeSettingsValue(
  value: unknown,
  maximumLength = 2000
): string {
  const serializedValue =
    serializeSettingsValue(
      value
    )

  if (
    serializedValue.length <=
    maximumLength
  ) {
    return serializedValue
  }

  return `${serializedValue.slice(
    0,
    maximumLength
  )}…`
}

export function createSettingsAuditRecord({
  section,
  action,
  recordId = null,
  summary,
  beforeValue = null,
  afterValue = null,
  actor,
  occurredAt =
    new Date().toISOString(),
}: {
  section: SettingsSection

  action:
    SettingsAuditAction

  recordId?: string | null

  summary: string

  beforeValue?: unknown
  afterValue?: unknown

  actor: string
  occurredAt?: string
}): SettingsAuditRecord {
  return {
    id:
      createTemporarySettingsId(
        "settings-audit"
      ),

    section,
    action,

    recordId,

    summary:
      summary.trim(),

    beforeSnapshot:
      beforeValue === null
        ? null
        : summarizeSettingsValue(
            beforeValue
          ),

    afterSnapshot:
      afterValue === null
        ? null
        : summarizeSettingsValue(
            afterValue
          ),

    actor:
      normalizeSettingsActor(
        actor
      ),

    occurredAt,
  }
}

export function replaceSettingsRecord<
  RecordType extends {
    id: string
  },
>(
  records:
    readonly RecordType[],

  updatedRecord:
    RecordType
): RecordType[] {
  const recordExists =
    records.some(
      (record) =>
        record.id ===
        updatedRecord.id
    )

  if (!recordExists) {
    return [
      updatedRecord,
      ...records,
    ]
  }

  return records.map(
    (record) =>
      record.id ===
      updatedRecord.id
        ? updatedRecord
        : record
  )
}

export function incrementSettingsRevision(
  settings:
    GalenMedSettingsState,

  updatedBy: string,
  updatedAt =
    new Date().toISOString()
): GalenMedSettingsState {
  return {
    ...settings,

    revision:
      settings.revision + 1,

    updatedAt,

    updatedBy:
      normalizeSettingsActor(
        updatedBy
      ),
  }
}
