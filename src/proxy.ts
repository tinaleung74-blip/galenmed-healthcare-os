import {
  NextResponse,
  type NextRequest,
} from "next/server"

import {
  updateSession,
} from "@/lib/supabase/proxy"

const protectedPrefixes = [
  "/admin",
  "/reception",
  "/doctor",
  "/cashier",
] as const

function isProtectedStaffPath(
  pathname: string
): boolean {
  if (
    pathname === "/staff" ||
    pathname === "/staff/change-password" ||
    pathname.startsWith(
      "/staff/change-password/"
    )
  ) {
    return true
  }

  if (
    pathname ===
      "/laboratory/dashboard" ||
    pathname.startsWith(
      "/laboratory/dashboard/"
    )
  ) {
    return true
  }

  return protectedPrefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(
        `${prefix}/`
      )
  )
}

export async function proxy(
  request: NextRequest
) {
  const {
    response,
    authenticated,
  } = await updateSession(request)

  if (
    isProtectedStaffPath(
      request.nextUrl.pathname
    ) &&
    !authenticated
  ) {
    const loginUrl = new URL(
      "/staff/login",
      request.url
    )

    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname
    )

    return NextResponse.redirect(
      loginUrl
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
