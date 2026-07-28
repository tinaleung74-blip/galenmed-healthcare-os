import { Bell, Menu, Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="size-5" />
        <span className="sr-only">Open navigation</span>
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          type="search"
          placeholder="Search patients, records, or transactions..."
          className="pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">Dr. Maria Santos</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
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