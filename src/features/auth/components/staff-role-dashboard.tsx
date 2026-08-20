import {
  ArrowRight,
  Building2,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"

import { GalenMedLogo } from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  signOutStaff,
} from "@/features/auth/actions/staff-auth.actions"
import type {
  StaffContext,
} from "@/features/auth/types/staff-auth.types"
import { cn } from "@/lib/utils"

interface StaffDashboardAction {
  href: string
  title: string
  description: string
}

interface StaffRoleDashboardProps {
  context: StaffContext
  title: string
  description: string
  actions?: readonly StaffDashboardAction[]
}

export function StaffRoleDashboard({
  context,
  title,
  description,
  actions = [],
}: StaffRoleDashboardProps) {
  const primaryBranch =
    context.branches.find(
      (branch) =>
        branch.isPrimary
    ) ??
    context.branches[0] ??
    null

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <GalenMedLogo
              size="md"
              priority
              className="rounded-xl bg-white p-1 ring-1 ring-slate-200"
            />

            <div>
              <p className="font-semibold tracking-tight">
                GalenMed
              </p>

              <p className="text-xs text-muted-foreground">
                Secure Staff Portal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/staff/account/change-password"
              className={cn(
                buttonVariants({
                  variant: "outline",
                })
              )}
            >
              <KeyRound
                aria-hidden="true"
              />
              Change password
            </Link>

            <form action={signOutStaff}>
              <Button
                type="submit"
                variant="outline"
              >
                <LogOut
                  aria-hidden="true"
                />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex items-start gap-4">
          <GalenMedLogo
            size="lg"
            className="hidden rounded-2xl bg-white p-1.5 ring-1 ring-slate-200 sm:inline-flex"
          />

          <div>
            <p className="text-sm text-teal-700">
              Role-based workspace
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {title}
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <UserRound
                className="size-4 text-sky-700"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Signed in as
                </p>

                <p className="mt-1 break-words font-semibold">
                  {context.fullName}
                </p>

                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {context.workEmail}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <KeyRound
                className="size-4 text-violet-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Employee ID
                </p>

                <p className="mt-1 font-mono text-sm font-semibold">
                  {context.employeeId ??
                    "Not assigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <Building2
                className="size-4 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Primary branch
                </p>

                <p className="mt-1 font-semibold">
                  {primaryBranch?.name ??
                    "Not assigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">
                Effective permissions
              </p>

              <p className="mt-1 text-xl font-semibold">
                {context.permissions.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {actions.length > 0 ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">
                Administrative workspaces
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Open a protected GalenMed administrator module.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-xl border bg-white p-5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {action.title}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {action.description}
                      </p>
                    </div>

                    <ArrowRight
                      className="size-5 shrink-0 text-teal-700 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <GalenMedLogo
              size="xl"
              className="rounded-2xl bg-white p-2 ring-1 ring-teal-100"
            />

            <h2 className="mt-5 text-lg font-semibold">
              Authentication and role routing are active
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This protected dashboard confirms that the signed-in account, active status, role assignment, branch scope, and database authorization context were loaded successfully. Operational widgets for this role will be added in the next module phase.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
              <ShieldCheck
                className="size-3.5"
                aria-hidden="true"
              />
              Secure session verified
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
