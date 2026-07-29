import { Bell, Menu } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { GlobalPatientSearch } from "@/features/patients/components/global-patient-search"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
        <span className="sr-only">Open navigation</span>
      </Button>

      <GlobalPatientSearch className="hidden max-w-md flex-1 md:block" />

      <div className="ml-auto flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="size-5" aria-hidden="true" />
          <span
            className="absolute top-2 right-2 size-2 rounded-full bg-red-500"
            aria-hidden="true"
          />
          <span className="sr-only">Notifications</span>
        </Button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">
            Dr. Maria Santos
          </p>
          <p className="text-xs text-muted-foreground">
            Administrator
          </p>
        </div>

        <Avatar>
          <AvatarFallback className="bg-teal-100 text-teal-800">
            MS
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
