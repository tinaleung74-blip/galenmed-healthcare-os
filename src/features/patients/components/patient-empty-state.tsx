import { SearchX, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

interface PatientEmptyStateProps {
  variant: "registry-empty" | "no-results"
  onResetFilters?: () => void
}

export function PatientEmptyState({
  variant,
  onResetFilters,
}: PatientEmptyStateProps) {
  const isRegistryEmpty = variant === "registry-empty"

  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 rounded-2xl bg-teal-50 p-4 text-teal-700">
        {isRegistryEmpty ? (
          <Users className="size-7" aria-hidden="true" />
        ) : (
          <SearchX className="size-7" aria-hidden="true" />
        )}
      </div>

      <h2 className="text-base font-semibold">
        {isRegistryEmpty
          ? "No patients registered"
          : "No matching patients"}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isRegistryEmpty
          ? "Patient registration records will appear here once they are added to the system."
          : "Try changing your search term or resetting one or more filters."}
      </p>

      {!isRegistryEmpty && onResetFilters ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={onResetFilters}
        >
          Reset filters
        </Button>
      ) : null}
    </div>
  )
}
