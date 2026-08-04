import type {
  LaboratoryAnalyteDefinition,
  LaboratoryResultFlag,
} from "@/features/laboratory/types/laboratory-result.types"

export function calculateLaboratoryResultFlag(
  analyte:
    LaboratoryAnalyteDefinition,

  numericValue: number | null,

  textValue: string | null
): LaboratoryResultFlag {
  if (
    analyte.valueType === "numeric"
  ) {
    if (numericValue === null) {
      return "not-applicable"
    }

    if (
      analyte.criticalLow !== null &&
      numericValue <
        analyte.criticalLow
    ) {
      return "critical-low"
    }

    if (
      analyte.criticalHigh !== null &&
      numericValue >
        analyte.criticalHigh
    ) {
      return "critical-high"
    }

    if (
      analyte.referenceLow !== null &&
      numericValue <
        analyte.referenceLow
    ) {
      return "low"
    }

    if (
      analyte.referenceHigh !== null &&
      numericValue >
        analyte.referenceHigh
    ) {
      return "high"
    }

    return "normal"
  }

  if (
    analyte.valueType ===
    "qualitative"
  ) {
    const normalizedValue =
      textValue
        ?.trim()
        .toLocaleLowerCase(
          "en-PH"
        ) ?? ""

    if (!normalizedValue) {
      return "not-applicable"
    }

    const normalizedNormalValues =
      analyte.normalQualitativeValues.map(
        (value) =>
          value
            .trim()
            .toLocaleLowerCase(
              "en-PH"
            )
      )

    return normalizedNormalValues.includes(
      normalizedValue
    )
      ? "normal"
      : "abnormal"
  }

  return "not-applicable"
}

export function formatLaboratoryReferenceRange(
  analyte:
    LaboratoryAnalyteDefinition
): string {
  if (analyte.referenceText) {
    return analyte.referenceText
  }

  if (
    analyte.referenceLow !== null &&
    analyte.referenceHigh !== null
  ) {
    return `${analyte.referenceLow}–${analyte.referenceHigh}${
      analyte.unit
        ? ` ${analyte.unit}`
        : ""
    }`
  }

  if (
    analyte.referenceLow !== null
  ) {
    return `≥ ${analyte.referenceLow}${
      analyte.unit
        ? ` ${analyte.unit}`
        : ""
    }`
  }

  if (
    analyte.referenceHigh !== null
  ) {
    return `≤ ${analyte.referenceHigh}${
      analyte.unit
        ? ` ${analyte.unit}`
        : ""
    }`
  }

  return "Not configured"
}
