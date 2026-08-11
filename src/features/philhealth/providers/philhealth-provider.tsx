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
  INITIAL_PHILHEALTH_STATE,
} from "@/features/philhealth/data/philhealth.initial-state"
import type {
  PhilHealthClaimFormValues,
  PhilHealthEligibilityFormValues,
  PhilHealthProfileFormValues,
  PhilHealthRequirementUpdateValues,
} from "@/features/philhealth/schemas/philhealth.schema"
import type {
  PhilHealthAuditRecord,
  PhilHealthClaim,
  PhilHealthClaimStatus,
  PhilHealthModuleSettings,
  PhilHealthPatientProfile,
  PhilHealthState,
} from "@/features/philhealth/types/philhealth.types"
import {
  calculatePhilHealthClaimCompleteness,
  calculatePhilHealthPatientResponsibility,
  clonePhilHealthState,
  createInitialPhilHealthClaimRequirements,
  createPhilHealthAuditRecord,
  createTemporaryPhilHealthId,
  derivePhilHealthClaimPreparationStatus,
  generateInternalPhilHealthClaimNumber,
  incrementPhilHealthStateRevision,
  normalizePhilHealthOptionalText,
  normalizePhilHealthPin,
  parsePhilHealthPesoToCentavos,
  replacePhilHealthClaim,
} from "@/features/philhealth/utils/philhealth.utils"
import {
  GALENMED_BRANCHES,
} from "@/features/patients/constants/patient.constants"
import {
  usePatients,
} from "@/features/patients/providers/patient-provider"
import {
  usePersistentDevelopmentState,
} from "@/hooks/use-persistent-development-state"

const PHILHEALTH_STORAGE_KEY =
  "galenmed:development:philhealth-state:v1"

const INITIAL_STATE =
  clonePhilHealthState(
    INITIAL_PHILHEALTH_STATE
  )

const LOCKED_REQUIREMENT_STATUSES:
  readonly PhilHealthClaimStatus[] =
  [
    "submitted-manually",
    "submitted-electronically",
    "paid",
    "reconciled",
    "voided",
  ]

interface PhilHealthContextValue {
  state: PhilHealthState

  profiles:
    PhilHealthPatientProfile[]

  claims:
    PhilHealthClaim[]

  auditRecords:
    PhilHealthAuditRecord[]

  settings:
    PhilHealthModuleSettings

  getProfileForPatient: (
    patientId: string
  ) =>
    | PhilHealthPatientProfile
    | null

  getClaim: (
    claimId: string
  ) =>
    | PhilHealthClaim
    | null

  savePatientProfile: (
    values:
      PhilHealthProfileFormValues
  ) => PhilHealthPatientProfile

  recordEligibility: (
    values:
      PhilHealthEligibilityFormValues
  ) => PhilHealthPatientProfile

  createClaimDraft: (
    values:
      PhilHealthClaimFormValues
  ) => PhilHealthClaim

  updateClaimRequirement: (
    values:
      PhilHealthRequirementUpdateValues
  ) => PhilHealthClaim
}

const PhilHealthContext =
  createContext<PhilHealthContextValue | null>(
    null
  )

interface PhilHealthProviderProps {
  children: ReactNode
}

function createNextPhilHealthState({
  currentState,
  actor,
  occurredAt,
  auditRecord,
  profiles =
    currentState.profiles,
  claims =
    currentState.claims,
}: {
  currentState:
    PhilHealthState

  actor: string
  occurredAt: string

  auditRecord:
    PhilHealthAuditRecord

  profiles?:
    PhilHealthPatientProfile[]

  claims?:
    PhilHealthClaim[]
}): PhilHealthState {
  return incrementPhilHealthStateRevision(
    {
      ...currentState,

      profiles,
      claims,

      auditRecords: [
        auditRecord,
        ...currentState.auditRecords,
      ],
    },
    actor,
    occurredAt
  )
}

export function PhilHealthProvider({
  children,
}: PhilHealthProviderProps) {
  const {
    patients,
  } = usePatients()

  const [
    state,
    setState,
  ] =
    usePersistentDevelopmentState<
      PhilHealthState
    >(
      PHILHEALTH_STORAGE_KEY,
      INITIAL_STATE
    )

  const stateRef =
    useRef<PhilHealthState>(
      state
    )

  const patientsRef =
    useRef(patients)

  useEffect(() => {
    stateRef.current =
      state
  }, [state])

  useEffect(() => {
    patientsRef.current =
      patients
  }, [patients])

  const commitState =
    useCallback(
      (
        nextState:
          PhilHealthState
      ): PhilHealthState => {
        stateRef.current =
          nextState

        setState(nextState)

        return nextState
      },
      [setState]
    )

  const getProfileForPatient =
    useCallback(
      (
        patientId: string
      ):
        | PhilHealthPatientProfile
        | null =>
        stateRef.current.profiles.find(
          (profile) =>
            profile.patientId ===
            patientId
        ) ?? null,
      []
    )

  const getClaim =
    useCallback(
      (
        claimId: string
      ):
        | PhilHealthClaim
        | null =>
        stateRef.current.claims.find(
          (claim) =>
            claim.id ===
            claimId
        ) ?? null,
      []
    )

  const savePatientProfile =
    useCallback(
      (
        values:
          PhilHealthProfileFormValues
      ): PhilHealthPatientProfile => {
        const currentState =
          stateRef.current

        const patient =
          patientsRef.current.find(
            (
              candidatePatient
            ) =>
              candidatePatient.id ===
              values.patientId
          )

        if (!patient) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        if (
          patient.status ===
          "archived"
        ) {
          throw new Error(
            "An archived patient cannot receive a new PhilHealth profile update."
          )
        }

        const existingProfile =
          currentState.profiles.find(
            (profile) =>
              profile.patientId ===
              values.patientId
          ) ?? null

        const actor =
          values.updatedBy.trim()

        const now =
          new Date().toISOString()

        const isPrincipalMember =
          values.memberRelationship ===
          "member"

        const updatedProfile:
          PhilHealthPatientProfile = {
          id:
            existingProfile?.id ??
            createTemporaryPhilHealthId(
              "philhealth-profile"
            ),

          patientId:
            patient.id,

          philHealthIdentificationNumber:
            normalizePhilHealthPin(
              values
                .philHealthIdentificationNumber
            ),

          memberRelationship:
            values.memberRelationship,

          principalMemberName:
            isPrincipalMember
              ? null
              : normalizePhilHealthOptionalText(
                  values
                    .principalMemberName
                ),

          principalMemberPin:
            isPrincipalMember
              ? null
              : normalizePhilHealthPin(
                  values
                    .principalMemberPin
                ),

          membershipCategory:
            normalizePhilHealthOptionalText(
              values
                .membershipCategory
            ),

          consentAcknowledgedAt:
            existingProfile
              ?.consentAcknowledgedAt ??
            now,

          consentAcknowledgedBy:
            existingProfile
              ?.consentAcknowledgedBy ??
            values
              .consentAcknowledgedBy
              .trim(),

          eligibilityStatus:
            existingProfile
              ?.eligibilityStatus ??
            "not-checked",

          eligibilitySource:
            existingProfile
              ?.eligibilitySource ??
            "not-checked",

          eligibilityCheckedAt:
            existingProfile
              ?.eligibilityCheckedAt ??
            null,

          eligibilityCheckedBy:
            existingProfile
              ?.eligibilityCheckedBy ??
            null,

          pbefReference:
            existingProfile
              ?.pbefReference ??
            null,

          eligibilityNotes:
            existingProfile
              ?.eligibilityNotes ??
            null,

          createdAt:
            existingProfile
              ?.createdAt ??
            now,

          createdBy:
            existingProfile
              ?.createdBy ??
            actor,

          updatedAt: now,
          updatedBy: actor,
        }

        const nextProfiles =
          existingProfile
            ? currentState.profiles.map(
                (profile) =>
                  profile.id ===
                  updatedProfile.id
                    ? updatedProfile
                    : profile
              )
            : [
                updatedProfile,
                ...currentState.profiles,
              ]

        const auditRecord =
          createPhilHealthAuditRecord({
            patientId:
              patient.id,

            action:
              existingProfile
                ? "profile-updated"
                : "profile-created",

            summary:
              existingProfile
                ? "Patient PhilHealth profile was updated."
                : "Patient PhilHealth profile was created.",

            actor,

            actorRole:
              values.actorRole,

            beforeValue:
              existingProfile,

            afterValue:
              updatedProfile,

            occurredAt: now,
          })

        const nextState =
          createNextPhilHealthState({
            currentState,
            actor,
            occurredAt: now,
            auditRecord,
            profiles:
              nextProfiles,
          })

        commitState(nextState)

        return updatedProfile
      },
      [commitState]
    )

  const recordEligibility =
    useCallback(
      (
        values:
          PhilHealthEligibilityFormValues
      ): PhilHealthPatientProfile => {
        const currentState =
          stateRef.current

        const existingProfile =
          currentState.profiles.find(
            (profile) =>
              profile.id ===
              values.profileId
          )

        if (!existingProfile) {
          throw new Error(
            "The selected PhilHealth profile was not found."
          )
        }

        if (
          values.source ===
            "integration" &&
          !currentState.settings
            .liveIntegrationEnabled
        ) {
          throw new Error(
            "Live PhilHealth integration is not enabled. Record the result as an official-portal manual verification."
          )
        }

        const actor =
          values.checkedBy.trim()

        const now =
          new Date().toISOString()

        const updatedProfile:
          PhilHealthPatientProfile = {
          ...existingProfile,

          eligibilityStatus:
            values.status,

          eligibilitySource:
            values.source,

          eligibilityCheckedAt:
            now,

          eligibilityCheckedBy:
            actor,

          pbefReference:
            normalizePhilHealthOptionalText(
              values.pbefReference
            ),

          eligibilityNotes:
            normalizePhilHealthOptionalText(
              values.notes
            ),

          updatedAt: now,
          updatedBy: actor,
        }

        const nextProfiles =
          currentState.profiles.map(
            (profile) =>
              profile.id ===
              updatedProfile.id
                ? updatedProfile
                : profile
          )

        const recalculatedClaims =
          currentState.claims.map(
            (claim) => {
              if (
                claim.profileId !==
                updatedProfile.id
              ) {
                return claim
              }

              const completenessPercent =
                calculatePhilHealthClaimCompleteness(
                  claim.requirements,
                  updatedProfile
                    .eligibilityStatus
                )

              const status =
                derivePhilHealthClaimPreparationStatus({
                  currentStatus:
                    claim.status,

                  eligibilityStatus:
                    updatedProfile
                      .eligibilityStatus,

                  requirements:
                    claim.requirements,
                })

              if (
                claim.completenessPercent ===
                  completenessPercent &&
                claim.status === status
              ) {
                return claim
              }

              return {
                ...claim,

                completenessPercent,
                status,

                updatedAt: now,
                updatedBy: actor,
              }
            }
          )

        const auditRecord =
          createPhilHealthAuditRecord({
            patientId:
              updatedProfile.patientId,

            action:
              "eligibility-recorded",

            summary:
              `PhilHealth eligibility was recorded as ${values.status}.`,

            actor,

            actorRole:
              values.actorRole,

            beforeValue: {
              eligibilityStatus:
                existingProfile
                  .eligibilityStatus,

              eligibilitySource:
                existingProfile
                  .eligibilitySource,

              eligibilityCheckedAt:
                existingProfile
                  .eligibilityCheckedAt,

              pbefReference:
                existingProfile
                  .pbefReference,
            },

            afterValue: {
              eligibilityStatus:
                updatedProfile
                  .eligibilityStatus,

              eligibilitySource:
                updatedProfile
                  .eligibilitySource,

              eligibilityCheckedAt:
                updatedProfile
                  .eligibilityCheckedAt,

              pbefReference:
                updatedProfile
                  .pbefReference,

              eligibilityNotes:
                updatedProfile
                  .eligibilityNotes,
            },

            occurredAt: now,
          })

        const nextState =
          createNextPhilHealthState({
            currentState,
            actor,
            occurredAt: now,
            auditRecord,
            profiles:
              nextProfiles,

            claims:
              recalculatedClaims,
          })

        commitState(nextState)

        return updatedProfile
      },
      [commitState]
    )

  const createClaimDraft =
    useCallback(
      (
        values:
          PhilHealthClaimFormValues
      ): PhilHealthClaim => {
        const currentState =
          stateRef.current

        const patient =
          patientsRef.current.find(
            (
              candidatePatient
            ) =>
              candidatePatient.id ===
              values.patientId
          )

        if (!patient) {
          throw new Error(
            "The selected patient record was not found."
          )
        }

        if (
          patient.status ===
          "archived"
        ) {
          throw new Error(
            "A PhilHealth claim cannot be created for an archived patient."
          )
        }

        const profile =
          currentState.profiles.find(
            (
              candidateProfile
            ) =>
              candidateProfile.id ===
              values.profileId
          )

        if (!profile) {
          throw new Error(
            "The selected PhilHealth profile was not found."
          )
        }

        if (
          profile.patientId !==
          patient.id
        ) {
          throw new Error(
            "The selected PhilHealth profile does not belong to this patient."
          )
        }

        const branch =
          GALENMED_BRANCHES.find(
            (
              candidateBranch
            ) =>
              candidateBranch.id ===
              values.branchId
          )

        if (!branch) {
          throw new Error(
            "The selected GalenMed branch was not found."
          )
        }

        const encounterRecordId =
          normalizePhilHealthOptionalText(
            values.encounterRecordId
          )

        if (encounterRecordId) {
          const duplicateClaim =
            currentState.claims.find(
              (claim) =>
                claim.encounterRecordId ===
                  encounterRecordId &&
                claim.status !==
                  "voided"
            )

          if (duplicateClaim) {
            throw new Error(
              "An active PhilHealth claim already exists for this encounter record."
            )
          }
        }

        const actor =
          values.createdBy.trim()

        const now =
          new Date().toISOString()

        const claimId =
          createTemporaryPhilHealthId(
            "philhealth-claim"
          )

        const requirements =
          createInitialPhilHealthClaimRequirements(
            claimId
          )

        const grossAmount =
          parsePhilHealthPesoToCentavos(
            values
              .grossHospitalChargesPhp
          )

        const estimatedBenefit =
          parsePhilHealthPesoToCentavos(
            values
              .estimatedPhilHealthBenefitPhp
          )

        if (
          estimatedBenefit >
          grossAmount
        ) {
          throw new Error(
            "Estimated PhilHealth benefit must not exceed gross hospital charges."
          )
        }

        const preparationStatus =
          derivePhilHealthClaimPreparationStatus({
            currentStatus:
              "draft",

            eligibilityStatus:
              profile
                .eligibilityStatus,

            requirements,
          })

        const newClaim:
          PhilHealthClaim = {
          id:
            claimId,

          internalClaimNumber:
            generateInternalPhilHealthClaimNumber(
              currentState.claims
            ),

          patientId:
            patient.id,

          profileId:
            profile.id,

          branchId:
            branch.id,

          branchName:
            branch.name,

          encounterType:
            values.encounterType,

          encounterRecordId,

          encounterReference:
            normalizePhilHealthOptionalText(
              values
                .encounterReference
            ),

          admissionAt:
            normalizePhilHealthOptionalText(
              values.admissionAt
            ),

          dischargeAt:
            normalizePhilHealthOptionalText(
              values.dischargeAt
            ),

          primaryDiagnosisCode:
            normalizePhilHealthOptionalText(
              values
                .primaryDiagnosisCode
            ),

          primaryDiagnosisName:
            normalizePhilHealthOptionalText(
              values
                .primaryDiagnosisName
            ),

          benefitPackageCode:
            normalizePhilHealthOptionalText(
              values
                .benefitPackageCode
            ),

          benefitPackageName:
            normalizePhilHealthOptionalText(
              values
                .benefitPackageName
            ),

          status:
            preparationStatus,

          submissionChannel:
            "not-submitted",

          requirements,

          completenessPercent:
            calculatePhilHealthClaimCompleteness(
              requirements,
              profile
                .eligibilityStatus
            ),

          grossHospitalChargesCentavos:
            grossAmount,

          estimatedPhilHealthBenefitCentavos:
            estimatedBenefit,

          patientResponsibilityCentavos:
            calculatePhilHealthPatientResponsibility(
              grossAmount,
              estimatedBenefit
            ),

          officialClaimNumber:
            null,

          transmittalControlNumber:
            null,

          submittedAt:
            null,

          submittedBy:
            null,

          returnedAt:
            null,

          returnedReason:
            null,

          deniedAt:
            null,

          deniedReason:
            null,

          paidAt:
            null,

          paidAmountCentavos:
            0,

          reconciledAt:
            null,

          reconciledBy:
            null,

          notes:
            normalizePhilHealthOptionalText(
              values.notes
            ),

          createdAt: now,
          createdBy: actor,

          updatedAt: now,
          updatedBy: actor,

          voidedAt:
            null,

          voidedBy:
            null,

          voidReason:
            null,
        }

        const auditRecord =
          createPhilHealthAuditRecord({
            patientId:
              patient.id,

            claimId:
              newClaim.id,

            action:
              "claim-created",

            summary:
              `${newClaim.internalClaimNumber} was created in manual preparation mode.`,

            actor,

            actorRole:
              values.actorRole,

            afterValue:
              newClaim,

            occurredAt: now,
          })

        const nextState =
          createNextPhilHealthState({
            currentState,
            actor,
            occurredAt: now,
            auditRecord,

            claims: [
              newClaim,
              ...currentState.claims,
            ],
          })

        commitState(nextState)

        return newClaim
      },
      [commitState]
    )

  const updateClaimRequirement =
    useCallback(
      (
        values:
          PhilHealthRequirementUpdateValues
      ): PhilHealthClaim => {
        const currentState =
          stateRef.current

        const existingClaim =
          currentState.claims.find(
            (claim) =>
              claim.id ===
              values.claimId
          )

        if (!existingClaim) {
          throw new Error(
            "The selected PhilHealth claim was not found."
          )
        }

        if (
          LOCKED_REQUIREMENT_STATUSES.includes(
            existingClaim.status
          )
        ) {
          throw new Error(
            "Requirements cannot be changed after submission, payment, reconciliation, or voiding."
          )
        }

        const existingRequirement =
          existingClaim.requirements.find(
            (requirement) =>
              requirement.id ===
              values.requirementId
          )

        if (!existingRequirement) {
          throw new Error(
            "The selected PhilHealth claim requirement was not found."
          )
        }

        if (
          existingRequirement.required &&
          values.status ===
            "not-required"
        ) {
          throw new Error(
            "A required internal claim item cannot be marked not required."
          )
        }

        const actor =
          values.reviewedBy.trim()

        const now =
          new Date().toISOString()

        const isReviewedStatus =
          values.status ===
            "verified" ||
          values.status ===
            "rejected" ||
          values.status ===
            "not-required"

        const updatedRequirement = {
          ...existingRequirement,

          status:
            values.status,

          patientDocumentId:
            normalizePhilHealthOptionalText(
              values
                .patientDocumentId
            ),

          remarks:
            normalizePhilHealthOptionalText(
              values.remarks
            ),

          reviewedAt:
            isReviewedStatus
              ? now
              : null,

          reviewedBy:
            isReviewedStatus
              ? actor
              : null,
        }

        const updatedRequirements =
          existingClaim.requirements.map(
            (requirement) =>
              requirement.id ===
              updatedRequirement.id
                ? updatedRequirement
                : requirement
          )

        const profile =
          currentState.profiles.find(
            (
              candidateProfile
            ) =>
              candidateProfile.id ===
              existingClaim.profileId
          )

        if (!profile) {
          throw new Error(
            "The claim's PhilHealth profile was not found."
          )
        }

        const updatedClaim:
          PhilHealthClaim = {
          ...existingClaim,

          requirements:
            updatedRequirements,

          completenessPercent:
            calculatePhilHealthClaimCompleteness(
              updatedRequirements,
              profile
                .eligibilityStatus
            ),

          status:
            derivePhilHealthClaimPreparationStatus({
              currentStatus:
                existingClaim.status,

              eligibilityStatus:
                profile
                  .eligibilityStatus,

              requirements:
                updatedRequirements,
            }),

          updatedAt: now,
          updatedBy: actor,
        }

        const auditRecord =
          createPhilHealthAuditRecord({
            patientId:
              updatedClaim.patientId,

            claimId:
              updatedClaim.id,

            action:
              "requirement-updated",

            summary:
              `${updatedRequirement.label} was marked ${updatedRequirement.status}.`,

            actor,

            actorRole:
              values.actorRole,

            beforeValue:
              existingRequirement,

            afterValue:
              updatedRequirement,

            occurredAt: now,
          })

        const nextState =
          createNextPhilHealthState({
            currentState,
            actor,
            occurredAt: now,
            auditRecord,

            claims:
              replacePhilHealthClaim(
                currentState.claims,
                updatedClaim
              ),
          })

        commitState(nextState)

        return updatedClaim
      },
      [commitState]
    )

  const contextValue =
    useMemo<PhilHealthContextValue>(
      () => ({
        state,

        profiles:
          state.profiles,

        claims:
          state.claims,

        auditRecords:
          state.auditRecords,

        settings:
          state.settings,

        getProfileForPatient,
        getClaim,

        savePatientProfile,
        recordEligibility,
        createClaimDraft,
        updateClaimRequirement,
      }),
      [
        state,

        getProfileForPatient,
        getClaim,

        savePatientProfile,
        recordEligibility,
        createClaimDraft,
        updateClaimRequirement,
      ]
    )

  return (
    <PhilHealthContext.Provider
      value={contextValue}
    >
      {children}
    </PhilHealthContext.Provider>
  )
}

export function usePhilHealth(): PhilHealthContextValue {
  const context =
    useContext(
      PhilHealthContext
    )

  if (!context) {
    throw new Error(
      "usePhilHealth must be used inside PhilHealthProvider."
    )
  }

  return context
}
