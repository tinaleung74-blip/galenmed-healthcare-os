export const HOSPITAL_SERVICE_TYPES = [
  "consultation",
  "laboratory",
  "radiology",
  "pharmacy",
  "billing",
  "procedure",
  "other",
] as const

export type HospitalServiceType =
  (typeof HOSPITAL_SERVICE_TYPES)[number]

export interface ServiceCatalogDepartment {
  id: string
  code: string
  name: string
  active: boolean
}

export interface ServiceCatalogBranch {
  id: string
  code: string
  name: string
  active: boolean
}

export interface ServiceCatalogItem {
  id: string
  code: string
  name: string
  description: string | null
  serviceType: HospitalServiceType
  departmentId: string
  departmentCode: string
  departmentName: string
  branchId: string | null
  branchCode: string | null
  branchName: string | null
  defaultPriceCentavos: number
  doctorOrderRequired: boolean
  allowsPatientRequest: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceCatalogPageData {
  items: ServiceCatalogItem[]
  departments: ServiceCatalogDepartment[]
  branches: ServiceCatalogBranch[]
}

export interface ServiceCatalogActionResult {
  success: boolean
  message: string
}
