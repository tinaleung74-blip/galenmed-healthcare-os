import {
  FileText,
  FlaskConical,
  Home,
  LogOut,
  ReceiptText,
  Settings2,
} from "lucide-react"
import Link from "next/link"

import {
  GalenMedLogo,
} from "@/components/brand/galenmed-logo"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  signOutPatientPortal,
} from "@/features/patient-portal/actions/patient-auth.actions"
import {
  cn,
} from "@/lib/utils"

export function PatientPortalHeader() {
  return (
    <header className="border-b bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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
              Secure Patient Portal
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/patient/dashboard"
            className={cn(
              buttonVariants({
                variant:
                  "outline",
                size:
                  "sm",
              })
            )}
          >
            <Home
              aria-hidden="true"
            />
            Dashboard
          </Link>

          <Link
            href="/patient/prescriptions"
            className={cn(
              buttonVariants({
                variant:
                  "outline",
                size:
                  "sm",
              })
            )}
          >
            <FileText
              aria-hidden="true"
            />
            Prescriptions
          </Link>

          <Link
            href="/patient/laboratory-results"
            className={cn(
              buttonVariants({
                variant:
                  "outline",
                size:
                  "sm",
              })
            )}
          >
            <FlaskConical
              aria-hidden="true"
            />
            Laboratory
          </Link>

          <Link
            href="/patient/billing"
            className={cn(
              buttonVariants({
                variant:
                  "outline",
                size:
                  "sm",
              })
            )}
          >
            <ReceiptText
              aria-hidden="true"
            />
            Billing
          </Link>

          <Link
            href="/patient/settings"
            className={cn(
              buttonVariants({
                variant:
                  "outline",
                size:
                  "sm",
              })
            )}
          >
            <Settings2
              aria-hidden="true"
            />
            Settings
          </Link>

          <form
            action={
              signOutPatientPortal
            }
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
            >
              <LogOut
                aria-hidden="true"
              />
              Sign out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  )
}
