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
  DEFAULT_GALENMED_SETTINGS,
} from "@/features/settings/constants/settings.constants"
import type {
  BranchSettingsFormValues,
  DepartmentSettingsFormValues,
  NotificationSettingsFormValues,
  OperationalSettingsFormValues,
  OrganizationSettingsFormValues,
  RoleSettingsFormValues,
  SecuritySettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import {
  SETTINGS_PERMISSION_KEYS,
  type BranchSettings,
  type DepartmentSettings,
  type GalenMedSettingsState,
  type NotificationSettings,
  type OperationalSettings,
  type OrganizationSettings,
  type RoleSettings,
  type SecuritySettings,
  type SettingsAuditRecord,
  type SettingsPermissionKey,
  type SettingsSection,
} from "@/features/settings/types/settings.types"
import {
  cloneGalenMedSettings,
  createSettingsAuditRecord,
  createTemporarySettingsId,
  incrementSettingsRevision,
  normalizeSettingsActor,
  replaceSettingsRecord,
  settingsValuesAreEqual,
} from "@/features/settings/utils/settings.utils"
import {
  usePersistentDevelopmentState,
} from "@/hooks/use-persistent-development-state"

const SETTINGS_STATE_STORAGE_KEY =
  "galenmed:development:settings-state:v1"

const SETTINGS_AUDIT_STORAGE_KEY =
  "galenmed:development:settings-audit:v1"

const INITIAL_SETTINGS_STATE =
  cloneGalenMedSettings(
    DEFAULT_GALENMED_SETTINGS
  )

const INITIAL_SETTINGS_AUDIT_RECORDS:
  SettingsAuditRecord[] = []

interface SettingsContextValue {
  settings:
    GalenMedSettingsState

  auditRecords:
    SettingsAuditRecord[]

  updateOrganizationSettings: (
    values:
      OrganizationSettingsFormValues
  ) => OrganizationSettings

  updateBranchSettings: (
    values:
      BranchSettingsFormValues
  ) => BranchSettings

  saveDepartmentSettings: (
    values:
      DepartmentSettingsFormValues
  ) => DepartmentSettings

  saveRoleSettings: (
    values:
      RoleSettingsFormValues
  ) => RoleSettings

  updateOperationalSettings: (
    values:
      OperationalSettingsFormValues
  ) => OperationalSettings

  updateNotificationSettings: (
    values:
      NotificationSettingsFormValues
  ) => NotificationSettings

  updateSecuritySettings: (
    values:
      SecuritySettingsFormValues
  ) => SecuritySettings
}

const SettingsContext =
  createContext<SettingsContextValue | null>(
    null
  )

interface SettingsProviderProps {
  children: ReactNode
}

function normalizeOptionalText(
  value: string
): string | null {
  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

function getAuditActionForActiveState({
  existingActive,
  nextActive,
}: {
  existingActive: boolean
  nextActive: boolean
}):
  | "updated"
  | "activated"
  | "deactivated" {
  if (
    existingActive !==
    nextActive
  ) {
    return nextActive
      ? "activated"
      : "deactivated"
  }

  return "updated"
}

function normalizePermissions(
  permissions:
    readonly SettingsPermissionKey[]
): SettingsPermissionKey[] {
  const selectedPermissions =
    new Set(permissions)

  return SETTINGS_PERMISSION_KEYS.filter(
    (permission) =>
      selectedPermissions.has(
        permission
      )
  )
}

export function SettingsProvider({
  children,
}: SettingsProviderProps) {
  const [
    settings,
    setSettings,
  ] =
    usePersistentDevelopmentState<
      GalenMedSettingsState
    >(
      SETTINGS_STATE_STORAGE_KEY,
      INITIAL_SETTINGS_STATE
    )

  const [
    auditRecords,
    setAuditRecords,
  ] =
    usePersistentDevelopmentState<
      SettingsAuditRecord[]
    >(
      SETTINGS_AUDIT_STORAGE_KEY,
      INITIAL_SETTINGS_AUDIT_RECORDS
    )

  const settingsRef =
    useRef<
      GalenMedSettingsState
    >(settings)

  const auditRecordsRef =
    useRef<
      SettingsAuditRecord[]
    >(auditRecords)

  useEffect(() => {
    settingsRef.current =
      settings
  }, [settings])

  useEffect(() => {
    auditRecordsRef.current =
      auditRecords
  }, [auditRecords])

  const commitSettingsUpdate =
    useCallback(
      ({
        nextSettings,
        newAuditRecords,
      }: {
        nextSettings:
          GalenMedSettingsState

        newAuditRecords:
          readonly SettingsAuditRecord[]
      }): GalenMedSettingsState => {
        settingsRef.current =
          nextSettings

        setSettings(
          nextSettings
        )

        if (
          newAuditRecords.length >
          0
        ) {
          const nextAuditRecords = [
            ...newAuditRecords,
            ...auditRecordsRef.current,
          ]

          auditRecordsRef.current =
            nextAuditRecords

          setAuditRecords(
            nextAuditRecords
          )
        }

        return nextSettings
      },
      [
        setAuditRecords,
        setSettings,
      ]
    )

  const updateOrganizationSettings =
    useCallback(
      (
        values:
          OrganizationSettingsFormValues
      ): OrganizationSettings => {
        const currentSettings =
          settingsRef.current

        const beforeOrganization =
          currentSettings.organization

        const updatedOrganization:
          OrganizationSettings = {
          legalName:
            values.legalName.trim(),

          displayName:
            values.displayName.trim(),

          registrationNumber:
            normalizeOptionalText(
              values.registrationNumber
            ),

          taxIdentificationNumber:
            normalizeOptionalText(
              values
                .taxIdentificationNumber
            ),

          phoneNumber:
            normalizeOptionalText(
              values.phoneNumber
            ),

          emailAddress:
            normalizeOptionalText(
              values.emailAddress
            ),

          website:
            normalizeOptionalText(
              values.website
            ),

          address:
            values.address.trim(),

          timezone:
            values.timezone.trim(),

          currency: "PHP",
          locale: "en-PH",
        }

        if (
          settingsValuesAreEqual(
            beforeOrganization,
            updatedOrganization
          )
        ) {
          return beforeOrganization
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              organization:
                updatedOrganization,
            },
            actor,
            now
          )

        const auditRecord =
          createSettingsAuditRecord({
            section:
              "organization",

            action: "updated",

            recordId:
              "organization-profile",

            summary:
              "Organization profile configuration was updated.",

            beforeValue:
              beforeOrganization,

            afterValue:
              updatedOrganization,

            actor,
            occurredAt: now,
          })

        commitSettingsUpdate({
          nextSettings,

          newAuditRecords: [
            auditRecord,
          ],
        })

        return updatedOrganization
      },
      [commitSettingsUpdate]
    )

  const updateBranchSettings =
    useCallback(
      (
        values:
          BranchSettingsFormValues
      ): BranchSettings => {
        const currentSettings =
          settingsRef.current

        const existingBranch =
          currentSettings.branches.find(
            (branch) =>
              branch.branchId ===
              values.branchId
          )

        if (!existingBranch) {
          throw new Error(
            "The selected Settings branch was not found."
          )
        }

        const normalizedCode =
          values.code
            .trim()
            .toLocaleUpperCase(
              "en-PH"
            )

        const duplicateCode =
          currentSettings.branches.some(
            (branch) =>
              branch.branchId !==
                existingBranch.branchId &&
              branch.code
                .toLocaleUpperCase(
                  "en-PH"
                ) ===
                normalizedCode
          )

        if (duplicateCode) {
          throw new Error(
            "Another branch already uses this branch code."
          )
        }

        const updatedBranch:
          BranchSettings = {
          branchId:
            existingBranch.branchId,

          displayName:
            values.displayName.trim(),

          code:
            normalizedCode,

          address:
            values.address.trim(),

          phoneNumber:
            normalizeOptionalText(
              values.phoneNumber
            ),

          emailAddress:
            normalizeOptionalText(
              values.emailAddress
            ),

          timezone:
            values.timezone.trim(),

          active:
            values.active,
        }

        if (
          settingsValuesAreEqual(
            existingBranch,
            updatedBranch
          )
        ) {
          return existingBranch
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        const action =
          getAuditActionForActiveState({
            existingActive:
              existingBranch.active,

            nextActive:
              updatedBranch.active,
          })

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              branches:
                currentSettings.branches.map(
                  (branch) =>
                    branch.branchId ===
                    updatedBranch.branchId
                      ? updatedBranch
                      : branch
                ),
            },
            actor,
            now
          )

        const auditRecord =
          createSettingsAuditRecord({
            section:
              "branches",

            action,

            recordId:
              updatedBranch.branchId,

            summary:
              action === "activated"
                ? `${updatedBranch.displayName} was activated.`
                : action ===
                    "deactivated"
                  ? `${updatedBranch.displayName} was deactivated.`
                  : `${updatedBranch.displayName} configuration was updated.`,

            beforeValue:
              existingBranch,

            afterValue:
              updatedBranch,

            actor,
            occurredAt: now,
          })

        commitSettingsUpdate({
          nextSettings,

          newAuditRecords: [
            auditRecord,
          ],
        })

        return updatedBranch
      },
      [commitSettingsUpdate]
    )

  const saveDepartmentSettings =
    useCallback(
      (
        values:
          DepartmentSettingsFormValues
      ): DepartmentSettings => {
        const currentSettings =
          settingsRef.current

        const existingDepartment =
          values.id
            ? currentSettings.departments.find(
                (department) =>
                  department.id ===
                  values.id
              ) ?? null
            : null

        const normalizedCode =
          values.code
            .trim()
            .toLocaleUpperCase(
              "en-PH"
            )

        const duplicateCode =
          currentSettings.departments.some(
            (department) =>
              department.id !==
                existingDepartment?.id &&
              department.code
                .toLocaleUpperCase(
                  "en-PH"
                ) ===
                normalizedCode
          )

        if (duplicateCode) {
          throw new Error(
            "Another department already uses this department code."
          )
        }

        const configuredBranchIds =
          new Set(
            currentSettings.branches.map(
              (branch) =>
                branch.branchId
            )
          )

        const unknownBranchId =
          values.branchIds.find(
            (branchId) =>
              !configuredBranchIds.has(
                branchId
              )
          )

        if (unknownBranchId) {
          throw new Error(
            "A selected department branch no longer exists."
          )
        }

        const updatedDepartment:
          DepartmentSettings = {
          id:
            existingDepartment?.id ??
            createTemporarySettingsId(
              "department"
            ),

          code:
            normalizedCode,

          name:
            values.name.trim(),

          description:
            normalizeOptionalText(
              values.description
            ),

          branchIds:
            Array.from(
              new Set(
                values.branchIds
              )
            ),

          active:
            values.active,
        }

        if (
          existingDepartment &&
          settingsValuesAreEqual(
            existingDepartment,
            updatedDepartment
          )
        ) {
          return existingDepartment
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        const action =
          existingDepartment
            ? getAuditActionForActiveState({
                existingActive:
                  existingDepartment.active,

                nextActive:
                  updatedDepartment.active,
              })
            : "created"

        const nextDepartments =
          existingDepartment
            ? replaceSettingsRecord(
                currentSettings.departments,
                updatedDepartment
              )
            : [
                updatedDepartment,
                ...currentSettings.departments,
              ]

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              departments:
                nextDepartments,
            },
            actor,
            now
          )

        const auditRecord =
          createSettingsAuditRecord({
            section:
              "departments",

            action,

            recordId:
              updatedDepartment.id,

            summary:
              existingDepartment
                ? `${updatedDepartment.name} department configuration was updated.`
                : `${updatedDepartment.name} department was created.`,

            beforeValue:
              existingDepartment,

            afterValue:
              updatedDepartment,

            actor,
            occurredAt: now,
          })

        commitSettingsUpdate({
          nextSettings,

          newAuditRecords: [
            auditRecord,
          ],
        })

        return updatedDepartment
      },
      [commitSettingsUpdate]
    )

  const saveRoleSettings =
    useCallback(
      (
        values:
          RoleSettingsFormValues
      ): RoleSettings => {
        const currentSettings =
          settingsRef.current

        const existingRole =
          values.id
            ? currentSettings.roles.find(
                (role) =>
                  role.id ===
                  values.id
              ) ?? null
            : null

        const normalizedCode =
          values.code
            .trim()
            .toLocaleUpperCase(
              "en-PH"
            )

        if (
          existingRole?.systemRole &&
          existingRole.code !==
            normalizedCode
        ) {
          throw new Error(
            "A system role code cannot be changed."
          )
        }

        const duplicateCode =
          currentSettings.roles.some(
            (role) =>
              role.id !==
                existingRole?.id &&
              role.code
                .toLocaleUpperCase(
                  "en-PH"
                ) ===
                normalizedCode
          )

        if (duplicateCode) {
          throw new Error(
            "Another role already uses this role code."
          )
        }

        const normalizedPermissions =
          normalizePermissions(
            values.permissions
          )

        if (
          existingRole?.code ===
          "SUPER_ADMIN"
        ) {
          if (!values.active) {
            throw new Error(
              "The Super Administrator role cannot be deactivated."
            )
          }

          const missingPermission =
            SETTINGS_PERMISSION_KEYS.find(
              (permission) =>
                !normalizedPermissions.includes(
                  permission
                )
            )

          if (missingPermission) {
            throw new Error(
              "The Super Administrator role must retain every system permission."
            )
          }
        }

        const updatedRole:
          RoleSettings = {
          id:
            existingRole?.id ??
            createTemporarySettingsId(
              "role"
            ),

          code:
            normalizedCode,

          name:
            values.name.trim(),

          description:
            normalizeOptionalText(
              values.description
            ),

          permissions:
            normalizedPermissions,

          systemRole:
            existingRole
              ?.systemRole ??
            false,

          active:
            values.active,
        }

        if (
          existingRole &&
          settingsValuesAreEqual(
            existingRole,
            updatedRole
          )
        ) {
          return existingRole
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        let action:
          | "created"
          | "updated"
          | "activated"
          | "deactivated"
          | "permission-changed"

        if (!existingRole) {
          action = "created"
        } else if (
          !settingsValuesAreEqual(
            existingRole.permissions,
            updatedRole.permissions
          )
        ) {
          action =
            "permission-changed"
        } else {
          action =
            getAuditActionForActiveState({
              existingActive:
                existingRole.active,

              nextActive:
                updatedRole.active,
            })
        }

        const nextRoles =
          existingRole
            ? replaceSettingsRecord(
                currentSettings.roles,
                updatedRole
              )
            : [
                updatedRole,
                ...currentSettings.roles,
              ]

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              roles:
                nextRoles,
            },
            actor,
            now
          )

        const auditRecord =
          createSettingsAuditRecord({
            section:
              "roles-permissions",

            action,

            recordId:
              updatedRole.id,

            summary:
              action ===
              "permission-changed"
                ? `${updatedRole.name} role permissions were updated.`
                : existingRole
                  ? `${updatedRole.name} role configuration was updated.`
                  : `${updatedRole.name} role was created.`,

            beforeValue:
              existingRole,

            afterValue:
              updatedRole,

            actor,
            occurredAt: now,
          })

        commitSettingsUpdate({
          nextSettings,

          newAuditRecords: [
            auditRecord,
          ],
        })

        return updatedRole
      },
      [commitSettingsUpdate]
    )

  const updateOperationalSettings =
    useCallback(
      (
        values:
          OperationalSettingsFormValues
      ): OperationalSettings => {
        const currentSettings =
          settingsRef.current

        const beforeOperations =
          currentSettings.operations

        const updatedOperations:
          OperationalSettings = {
          appointments: {
            ...values.appointments,
          },

          clinical: {
            ...values.clinical,
          },

          laboratory: {
            ...values.laboratory,
          },

          radiology: {
            ...values.radiology,
          },

          pharmacy: {
            ...values.pharmacy,
          },

          billing: {
            ...values.billing,

            currency: "PHP",
          },
        }

        if (
          settingsValuesAreEqual(
            beforeOperations,
            updatedOperations
          )
        ) {
          return beforeOperations
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        const auditDefinitions: Array<{
          section: SettingsSection
          summary: string
          beforeValue: unknown
          afterValue: unknown
        }> = [
          {
            section:
              "appointments",

            summary:
              "Appointment operational configuration was updated.",

            beforeValue:
              beforeOperations.appointments,

            afterValue:
              updatedOperations.appointments,
          },
          {
            section:
              "clinical",

            summary:
              "Clinical default configuration was updated.",

            beforeValue:
              beforeOperations.clinical,

            afterValue:
              updatedOperations.clinical,
          },
          {
            section:
              "laboratory",

            summary:
              "Laboratory operational configuration was updated.",

            beforeValue:
              beforeOperations.laboratory,

            afterValue:
              updatedOperations.laboratory,
          },
          {
            section:
              "radiology",

            summary:
              "Radiology operational configuration was updated.",

            beforeValue:
              beforeOperations.radiology,

            afterValue:
              updatedOperations.radiology,
          },
          {
            section:
              "pharmacy",

            summary:
              "Pharmacy operational configuration was updated.",

            beforeValue:
              beforeOperations.pharmacy,

            afterValue:
              updatedOperations.pharmacy,
          },
          {
            section:
              "billing",

            summary:
              "Billing operational configuration was updated.",

            beforeValue:
              beforeOperations.billing,

            afterValue:
              updatedOperations.billing,
          },
        ]

        const newAuditRecords =
          auditDefinitions
            .filter(
              (definition) =>
                !settingsValuesAreEqual(
                  definition.beforeValue,
                  definition.afterValue
                )
            )
            .map(
              (definition) =>
                createSettingsAuditRecord({
                  section:
                    definition.section,

                  action: "updated",

                  recordId:
                    definition.section,

                  summary:
                    definition.summary,

                  beforeValue:
                    definition.beforeValue,

                  afterValue:
                    definition.afterValue,

                  actor,
                  occurredAt: now,
                })
            )

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              operations:
                updatedOperations,
            },
            actor,
            now
          )

        commitSettingsUpdate({
          nextSettings,
          newAuditRecords,
        })

        return updatedOperations
      },
      [commitSettingsUpdate]
    )

  const updateNotificationSettings =
    useCallback(
      (
        values:
          NotificationSettingsFormValues
      ): NotificationSettings => {
        const currentSettings =
          settingsRef.current

        const beforeNotifications =
          currentSettings.notifications

        const updatedNotifications:
          NotificationSettings = {
          channels: {
            ...values.channels,
          },

          events: {
            ...values.events,
          },
        }

        if (
          settingsValuesAreEqual(
            beforeNotifications,
            updatedNotifications
          )
        ) {
          return beforeNotifications
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              notifications:
                updatedNotifications,
            },
            actor,
            now
          )

        const auditRecord =
          createSettingsAuditRecord({
            section:
              "notifications",

            action: "updated",

            recordId:
              "notification-preferences",

            summary:
              "Notification channels and event preferences were updated.",

            beforeValue:
              beforeNotifications,

            afterValue:
              updatedNotifications,

            actor,
            occurredAt: now,
          })

        commitSettingsUpdate({
          nextSettings,

          newAuditRecords: [
            auditRecord,
          ],
        })

        return updatedNotifications
      },
      [commitSettingsUpdate]
    )

  const updateSecuritySettings =
    useCallback(
      (
        values:
          SecuritySettingsFormValues
      ): SecuritySettings => {
        const currentSettings =
          settingsRef.current

        const beforeSecurity =
          currentSettings.security

        const updatedSecurity:
          SecuritySettings = {
          sessionTimeoutMinutes:
            values.sessionTimeoutMinutes,

          idleWarningMinutes:
            values.idleWarningMinutes,

          maxFailedSignInAttempts:
            values.maxFailedSignInAttempts,

          requireMfaForPrivilegedRoles:
            values
              .requireMfaForPrivilegedRoles,

          passwordMinimumLength:
            values.passwordMinimumLength,

          passwordRequireNumber:
            values.passwordRequireNumber,

          passwordRequireSpecialCharacter:
            values
              .passwordRequireSpecialCharacter,
        }

        if (
          settingsValuesAreEqual(
            beforeSecurity,
            updatedSecurity
          )
        ) {
          return beforeSecurity
        }

        const actor =
          normalizeSettingsActor(
            values.updatedBy
          )

        const now =
          new Date().toISOString()

        const nextSettings =
          incrementSettingsRevision(
            {
              ...currentSettings,

              security:
                updatedSecurity,
            },
            actor,
            now
          )

        const auditRecord =
          createSettingsAuditRecord({
            section:
              "security",

            action:
              "security-changed",

            recordId:
              "security-configuration",

            summary:
              "Security and session-control configuration was updated.",

            beforeValue:
              beforeSecurity,

            afterValue:
              updatedSecurity,

            actor,
            occurredAt: now,
          })

        commitSettingsUpdate({
          nextSettings,

          newAuditRecords: [
            auditRecord,
          ],
        })

        return updatedSecurity
      },
      [commitSettingsUpdate]
    )

  const contextValue =
    useMemo<SettingsContextValue>(
      () => ({
        settings,
        auditRecords,

        updateOrganizationSettings,
        updateBranchSettings,

        saveDepartmentSettings,
        saveRoleSettings,

        updateOperationalSettings,
        updateNotificationSettings,
        updateSecuritySettings,
      }),
      [
        settings,
        auditRecords,

        updateOrganizationSettings,
        updateBranchSettings,

        saveDepartmentSettings,
        saveRoleSettings,

        updateOperationalSettings,
        updateNotificationSettings,
        updateSecuritySettings,
      ]
    )

  return (
    <SettingsContext.Provider
      value={contextValue}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context =
    useContext(
      SettingsContext
    )

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider."
    )
  }

  return context
}
