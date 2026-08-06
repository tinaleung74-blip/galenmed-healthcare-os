"use client"

import {
  useState,
} from "react"
import {
  Building2,
  GitBranch,
  History,
  Settings2,
  ShieldCheck,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { BranchSettingsWorkspace } from "@/features/settings/components/branch-settings-workspace"
import { DepartmentSettingsWorkspace } from "@/features/settings/components/department-settings-workspace"
import { NotificationSettingsWorkspace } from "@/features/settings/components/notification-settings-workspace"
import { OperationalSettingsWorkspace } from "@/features/settings/components/operational-settings-workspace"
import { OrganizationSettingsWorkspace } from "@/features/settings/components/organization-settings-workspace"
import { RoleSettingsWorkspace } from "@/features/settings/components/role-settings-workspace"
import { SecuritySettingsWorkspace } from "@/features/settings/components/security-settings-workspace"
import { SettingsAuditHistory } from "@/features/settings/components/settings-audit-history"
import { SettingsSectionNavigation } from "@/features/settings/components/settings-section-navigation"
import {
  SETTINGS_AUDIT_NOTICE,
  SETTINGS_SYNTHETIC_NOTICE,
} from "@/features/settings/constants/settings.constants"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import {
  SETTINGS_NOTIFICATION_EVENTS,
  type SettingsSection,
} from "@/features/settings/types/settings.types"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

function renderSettingsSection(
  section: SettingsSection
) {
  switch (section) {
    case "organization":
      return (
        <OrganizationSettingsWorkspace />
      )

    case "branches":
      return (
        <BranchSettingsWorkspace />
      )

    case "departments":
      return (
        <DepartmentSettingsWorkspace />
      )

    case "roles-permissions":
      return (
        <RoleSettingsWorkspace />
      )

    case "appointments":
      return (
        <OperationalSettingsWorkspace
          section="appointments"
        />
      )

    case "clinical":
      return (
        <OperationalSettingsWorkspace
          section="clinical"
        />
      )

    case "laboratory":
      return (
        <OperationalSettingsWorkspace
          section="laboratory"
        />
      )

    case "radiology":
      return (
        <OperationalSettingsWorkspace
          section="radiology"
        />
      )

    case "pharmacy":
      return (
        <OperationalSettingsWorkspace
          section="pharmacy"
        />
      )

    case "billing":
      return (
        <OperationalSettingsWorkspace
          section="billing"
        />
      )

    case "notifications":
      return (
        <NotificationSettingsWorkspace />
      )

    case "security":
      return (
        <SecuritySettingsWorkspace />
      )

    case "audit-history":
      return (
        <SettingsAuditHistory />
      )
  }
}

export function SettingsDashboardWorkspace() {
  const {
    settings,
    auditRecords,
  } = useSettings()

  const [
    selectedSection,
    setSelectedSection,
  ] = useState<SettingsSection>(
    "organization"
  )

  const activeBranchCount =
    settings.branches.filter(
      (branch) =>
        branch.active
    ).length

  const activeRoleCount =
    settings.roles.filter(
      (role) =>
        role.active
    ).length

  const enabledNotificationCount =
    SETTINGS_NOTIFICATION_EVENTS.filter(
      (eventName) =>
        settings.notifications.events[
          eventName
        ]
    ).length

  const navigationCounts: Partial<
    Record<
      SettingsSection,
      number
    >
  > = {
    organization: 1,

    branches:
      settings.branches.length,

    departments:
      settings.departments.length,

    "roles-permissions":
      settings.roles.length,

    appointments: 5,
    clinical: 4,
    laboratory: 4,
    radiology: 4,
    pharmacy: 5,
    billing: 6,

    notifications:
      enabledNotificationCount,

    security: 7,

    "audit-history":
      auditRecords.length,
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
          <Settings2
            className="size-5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Organization and operational
            configuration
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Settings Management
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Configure organization identity,
            branches, departments, roles,
            clinical workflows,
            notifications, security, and
            configuration audit history.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">
            Configuration Revision Summary
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Current persistent development
            configuration and audit-ledger
            status.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-sky-200 bg-sky-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <GitBranch
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-sky-700">
                  Configuration revision
                </p>

                <p className="mt-1 text-xl font-semibold text-sky-900">
                  {settings.revision}
                </p>

                <p className="mt-1 text-xs text-sky-700">
                  Schema version{" "}
                  {settings.schemaVersion}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <Building2
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-emerald-700">
                  Active branches
                </p>

                <p className="mt-1 text-xl font-semibold text-emerald-900">
                  {activeBranchCount}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  {settings.branches.length}
                  {" configured"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 bg-violet-50/40 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-violet-700">
                  Active roles
                </p>

                <p className="mt-1 text-xl font-semibold text-violet-900">
                  {activeRoleCount}
                </p>

                <p className="mt-1 text-xs text-violet-700">
                  {settings.roles.length}
                  {" configured"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <History
                className="size-4 text-amber-700"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Audit records
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {auditRecords.length}
                </p>

                <p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  Updated{" "}
                  {formatPatientDateTime(
                    settings.updatedAt
                  )}
                  {" by "}
                  {settings.updatedBy}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <SettingsSectionNavigation
            selectedSection={
              selectedSection
            }
            onSelectSection={
              setSelectedSection
            }
            counts={
              navigationCounts
            }
          />
        </aside>

        <main className="min-w-0">
          {renderSettingsSection(
            selectedSection
          )}
        </main>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-800">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {SETTINGS_SYNTHETIC_NOTICE}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <History
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />

          <p>
            {SETTINGS_AUDIT_NOTICE}
          </p>
        </div>
      </div>
    </section>
  )
}
