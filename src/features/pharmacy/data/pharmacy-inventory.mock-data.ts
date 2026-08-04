import type {
  PharmacyInventoryItem,
} from "@/features/pharmacy/types/pharmacy.types"

/**
 * Synthetic branch inventory for Pharmacy
 * workflow and interface testing only.
 */
export const MOCK_PHARMACY_INVENTORY: readonly PharmacyInventoryItem[] =
  [
    {
      id:
        "mock-inventory-paracetamol-001",

      medicationId:
        "medication-paracetamol-500-tablet",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-PARA-2026-A",

      expiresAt:
        "2027-06-30",

      onHandQuantity: 500,
      reservedQuantity: 0,
      reorderLevel: 100,

      status: "available",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-amoxicillin-001",

      medicationId:
        "medication-amoxicillin-500-capsule",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-AMOX-2026-A",

      expiresAt:
        "2027-03-31",

      onHandQuantity: 120,
      reservedQuantity: 0,
      reorderLevel: 40,

      status: "available",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-cetirizine-001",

      medicationId:
        "medication-cetirizine-10-tablet",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-CETI-2026-A",

      expiresAt:
        "2027-09-30",

      onHandQuantity: 40,
      reservedQuantity: 0,
      reorderLevel: 25,

      status: "available",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-omeprazole-001",

      medicationId:
        "medication-omeprazole-20-capsule",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-OMEP-2026-A",

      expiresAt:
        "2027-02-28",

      onHandQuantity: 18,
      reservedQuantity: 0,
      reorderLevel: 20,

      status: "low-stock",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-metformin-001",

      medicationId:
        "medication-metformin-500-tablet",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-METF-2026-A",

      expiresAt:
        "2027-08-31",

      onHandQuantity: 200,
      reservedQuantity: 0,
      reorderLevel: 60,

      status: "available",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-salbutamol-001",

      medicationId:
        "medication-salbutamol-inhaler",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-SALB-2026-A",

      expiresAt:
        "2027-05-31",

      onHandQuantity: 0,
      reservedQuantity: 0,
      reorderLevel: 10,

      status: "out-of-stock",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-ors-001",

      medicationId:
        "medication-oral-rehydration-salts",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-ORS-2026-A",

      expiresAt:
        "2027-11-30",

      onHandQuantity: 150,
      reservedQuantity: 0,
      reorderLevel: 40,

      status: "available",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
    {
      id:
        "mock-inventory-mupirocin-001",

      medicationId:
        "medication-mupirocin-ointment",

      branchId:
        "branch-makati",

      branchName:
        "GalenMed Makati",

      batchNumber:
        "SYN-MUPI-2026-A",

      expiresAt:
        "2027-04-30",

      onHandQuantity: 8,
      reservedQuantity: 0,
      reorderLevel: 10,

      status: "low-stock",

      updatedAt:
        "2026-08-04T08:00:00+08:00",

      updatedBy:
        "GalenMed Pharmacy Desk",
    },
  ]
