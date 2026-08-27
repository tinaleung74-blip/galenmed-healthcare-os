"use client"

import {
  ChevronDown,
  ShieldCheck,
} from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  STAFF_PORTALS,
  type StaffPortalCode,
} from "@/features/auth/constants/staff-portals"

interface StaffPortalSelectorProps {
  value:
    StaffPortalCode | null

  disabled?: boolean

  onChange: (
    portalCode:
      StaffPortalCode
  ) => void
}

export function StaffPortalSelector({
  value,
  disabled = false,
  onChange,
}: StaffPortalSelectorProps) {
  const selectedPortal =
    STAFF_PORTALS.find(
      (portal) =>
        portal.code === value
    ) ?? null

  return (
    <section className="space-y-3">
      <div>
        <Label
          htmlFor="staff-portal"
          className="text-sm font-semibold text-slate-800"
        >
          Staff portal
        </Label>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Choose the portal assigned
          to your GalenMed staff account.
        </p>
      </div>

      <div className="relative">
        <select
          id="staff-portal"
          value={value ?? ""}
          disabled={disabled}
          aria-describedby="staff-portal-description"
          className="h-14 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 pr-14 text-base font-semibold text-slate-900 shadow-sm outline-none transition-colors focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          onChange={(event) => {
            const portalCode =
              event.target
                .value as StaffPortalCode

            onChange(portalCode)
          }}
        >
          <option
            value=""
            disabled
          >
            Select your staff portal
          </option>

          {STAFF_PORTALS.map(
            (portal) => (
              <option
                key={portal.code}
                value={portal.code}
              >
                {portal.label}
              </option>
            )
          )}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-center text-slate-500">
          <ChevronDown
            className="size-5"
            aria-hidden="true"
          />
        </div>
      </div>

      <div
        id="staff-portal-description"
        className={
          selectedPortal
            ? "rounded-2xl border border-teal-200 bg-teal-50/70 p-4"
            : "rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4"
        }
      >
        {selectedPortal ? (
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
              <ShieldCheck
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-teal-950">
                {selectedPortal.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-teal-800">
                {
                  selectedPortal.description
                }
              </p>

              <p className="mt-2 text-xs font-medium text-teal-900">
                Your actual database role
                must match this portal.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-500">
            Select System Admin,
            Receptionist, Doctor,
            Laboratory, or Cashier before
            entering your credentials.
          </p>
        )}
      </div>
    </section>
  )
}
