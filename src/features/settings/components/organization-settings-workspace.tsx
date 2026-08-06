"use client"

import {
  Building2,
  GitBranch,
  History,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { OrganizationSettingsForm } from "@/features/settings/components/organization-settings-form"
import {
  useSettings,
} from "@/features/settings/providers/settings-provider"
import type {
  OrganizationSettingsFormValues,
} from "@/features/settings/schemas/settings.schema"
import {
  formatPatientDateTime,
} from "@/features/patients/utils/patient.utils"

export function OrganizationSettingsWorkspace() {
  const {
    settings,
    auditRecords,
    updateOrganizationSettings,
  } = useSettings()

  async function handleSubmitOrganization(
    values:
      OrganizationSettingsFormValues
  ) {
    const updatedOrganization =
      updateOrganizationSettings(
        values
      )

    toast.success(
      "Organization profile saved",
      {
        description: `${updatedOrganization.displayName} configuration was updated successfully.`,
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <Building2
              className="size-4 text-sky-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Organization
              </p>

              <p className="mt-1 font-semibold">
                {
                  settings.organization
                    .displayName
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <GitBranch
              className="size-4 text-violet-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Configuration revision
              </p>

              <p className="mt-1 text-xl font-semibold">
                {settings.revision}
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

            <div>
              <p className="text-xs text-muted-foreground">
                Audit records
              </p>

              <p className="mt-1 text-xl font-semibold">
                {auditRecords.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <ShieldCheck
              className="size-4 text-emerald-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-xs text-muted-foreground">
                Last updated
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatPatientDateTime(
                  settings.updatedAt
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {settings.updatedBy}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrganizationSettingsForm
        organization={
          settings.organization
        }
        onSubmitOrganization={
          handleSubmitOrganization
        }
      />
    </div>
  )
}
