import type {
  PatientDocumentCategory,
  PatientDocumentConfidentialityLevel,
} from "@/features/patients/types/patient-document.types"

export function getDocumentFileExtension(
  fileName: string
): string {
  const normalizedFileName = fileName.trim()
  const finalDotIndex =
    normalizedFileName.lastIndexOf(".")

  if (
    finalDotIndex <= 0 ||
    finalDotIndex ===
      normalizedFileName.length - 1
  ) {
    return "unknown"
  }

  return normalizedFileName
    .slice(finalDotIndex + 1)
    .toLowerCase()
}

export function parseDocumentSizeKilobytes(
  value: string
): number {
  const numericValue = Number(value.trim())

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    return 0
  }

  return Math.round(numericValue * 1024)
}

export function formatDocumentFileSize(
  sizeBytes: number
): string {
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes < 0
  ) {
    return "Unknown size"
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  const sizeKilobytes = sizeBytes / 1024

  if (sizeKilobytes < 1024) {
    return `${
      Math.round(sizeKilobytes * 10) / 10
    } KB`
  }

  const sizeMegabytes =
    sizeKilobytes / 1024

  return `${
    Math.round(sizeMegabytes * 10) / 10
  } MB`
}

export function documentSizeBytesToKilobytes(
  sizeBytes: number
): string {
  if (
    !Number.isFinite(sizeBytes) ||
    sizeBytes <= 0
  ) {
    return ""
  }

  return String(
    Math.round((sizeBytes / 1024) * 10) / 10
  )
}

export function maskPatientDocumentFileName(
  fileName: string,
  category: PatientDocumentCategory,
  confidentialityLevel: PatientDocumentConfidentialityLevel
): string {
  const shouldMask =
    category === "identification" ||
    category === "insurance" ||
    confidentialityLevel !== "standard"

  if (!shouldMask) {
    return fileName
  }

  const extension =
    getDocumentFileExtension(fileName)

  return extension === "unknown"
    ? "••••••••"
    : `••••••••.${extension}`
}
