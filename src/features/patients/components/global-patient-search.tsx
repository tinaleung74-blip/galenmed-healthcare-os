"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import { Search, UserRoundSearch } from "lucide-react"

import { Input } from "@/components/ui/input"
import { PatientStatusBadge } from "@/features/patients/components/patient-status-badge"
import { usePatients } from "@/features/patients/providers/patient-provider"
import type { Patient } from "@/features/patients/types/patient.types"
import {
  getPatientFullName,
  normalizePatientSearch,
} from "@/features/patients/utils/patient.utils"
import { cn } from "@/lib/utils"

interface GlobalPatientSearchProps {
  className?: string
}

const MAX_VISIBLE_RESULTS = 8

function getSearchablePatientText(
  patient: Patient
): string {
  return normalizePatientSearch(
    patient.medicalRecordNumber,
    patient.firstName,
    patient.middleName,
    patient.lastName,
    getPatientFullName(patient),
    patient.mobileNumber,
    patient.emailAddress,
    patient.branchName
  )
}

export function GlobalPatientSearch({
  className,
}: GlobalPatientSearchProps) {
  const router = useRouter()
  const { patients } = usePatients()

  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const normalizedQuery = normalizePatientSearch(query)

  const matchingPatients = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return []
    }

    return patients.filter((patient) =>
      getSearchablePatientText(patient).includes(
        normalizedQuery
      )
    )
  }, [patients, normalizedQuery])

  const visiblePatients = matchingPatients.slice(
    0,
    MAX_VISIBLE_RESULTS
  )

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const eventTarget = event.target

      if (
        eventTarget instanceof Node &&
        !containerRef.current?.contains(eventTarget)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    )

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      )
    }
  }, [])

  function openPatient(patient: Patient) {
    setQuery("")
    setIsOpen(false)
    setActiveIndex(-1)

    router.push(
      `/patients/${encodeURIComponent(
        patient.medicalRecordNumber
      )}`
    )
  }

  function handleKeyboardNavigation(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (visiblePatients.length === 0) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((currentIndex) =>
        Math.min(
          currentIndex + 1,
          visiblePatients.length - 1
        )
      )
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((currentIndex) =>
        Math.max(currentIndex - 1, 0)
      )
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()

      const selectedPatient =
        visiblePatients[
          activeIndex >= 0 ? activeIndex : 0
        ]

      if (selectedPatient) {
        openPatient(selectedPatient)
      }
    }
  }

  const showSearchPanel =
    isOpen && query.trim().length > 0

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget

        if (
          nextFocusedElement instanceof Node &&
          event.currentTarget.contains(nextFocusedElement)
        ) {
          return
        }

        setIsOpen(false)
        setActiveIndex(-1)
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        type="search"
        value={query}
        placeholder="Search patient name, MRN, mobile, or email..."
        className="pl-9"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-label="Global patient search"
        aria-autocomplete="list"
        aria-expanded={showSearchPanel}
        aria-controls="global-patient-search-results"
        aria-activedescendant={
          activeIndex >= 0 &&
          visiblePatients[activeIndex]
            ? `global-patient-result-${visiblePatients[activeIndex].id}`
            : undefined
        }
        onFocus={() => {
          if (query.trim().length > 0) {
            setIsOpen(true)
          }
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyboardNavigation}
      />

      {showSearchPanel ? (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[26rem] overflow-hidden rounded-xl border bg-background shadow-xl">
          {normalizedQuery.length < 2 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              Enter at least two characters to search
              patient records.
            </div>
          ) : visiblePatients.length === 0 ? (
            <div className="flex items-start gap-3 px-4 py-5">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                <UserRoundSearch
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  No patient found
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Check the patient name, MRN, mobile
                  number, or email address.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                id="global-patient-search-results"
                role="listbox"
                aria-label="Patient search results"
                className="max-h-96 overflow-y-auto p-1.5"
              >
                {visiblePatients.map(
                  (patient, index) => (
                    <button
                      key={patient.id}
                      id={`global-patient-result-${patient.id}`}
                      type="button"
                      role="option"
                      aria-selected={
                        activeIndex === index
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors",
                        activeIndex === index
                          ? "bg-teal-50"
                          : "hover:bg-slate-50 focus-visible:bg-teal-50"
                      )}
                      onMouseEnter={() =>
                        setActiveIndex(index)
                      }
                      onClick={() =>
                        openPatient(patient)
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {getPatientFullName(patient)}
                        </p>

                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {patient.medicalRecordNumber}
                        </p>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {patient.branchName}
                          {" · "}
                          {patient.mobileNumber ??
                            patient.emailAddress ??
                            "No contact information"}
                        </p>
                      </div>

                      <PatientStatusBadge
                        status={patient.status}
                      />
                    </button>
                  )
                )}
              </div>

              <div className="border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                Showing {visiblePatients.length} of{" "}
                {matchingPatients.length} matching patients
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
