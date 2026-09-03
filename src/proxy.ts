import {
  NextResponse,
  type NextRequest,
} from "next/server"

import {
  classifyPortalRoute,
} from "@/lib/auth/portal-route-policy"
import {
  updateSession,
} from "@/lib/supabase/proxy"

function createRedirectResponse(
  request:
    NextRequest,

  sessionResponse:
    NextResponse,

  destination:
    string,

  includeNextPath =
    false
): NextResponse {
  const redirectUrl =
    new URL(
      destination,
      request.url
    )

  if (includeNextPath) {
    redirectUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )
  }

  const redirectResponse =
    NextResponse.redirect(
      redirectUrl
    )

  sessionResponse.cookies
    .getAll()
    .forEach(
      (cookie) => {
        redirectResponse.cookies.set(
          cookie
        )
      }
    )

  return redirectResponse
}

export async function proxy(
  request: NextRequest
) {
  const routeKind =
    classifyPortalRoute(
      request.nextUrl.pathname
    )

  const {
    response,
    authenticated,
    accountType,
  } = await updateSession(
    request
  )

  if (
    routeKind ===
    "legacy-staff-quarantine"
  ) {
    if (!authenticated) {
      return createRedirectResponse(
        request,
        response,
        "/staff/login",
        true
      )
    }

    if (
      accountType ===
      "patient"
    ) {
      return createRedirectResponse(
        request,
        response,
        "/patient/dashboard"
      )
    }

    return createRedirectResponse(
      request,
      response,
      "/staff"
    )
  }

  if (
    routeKind ===
    "staff-protected"
  ) {
    if (!authenticated) {
      return createRedirectResponse(
        request,
        response,
        "/staff/login",
        true
      )
    }

    if (
      accountType ===
      "patient"
    ) {
      return createRedirectResponse(
        request,
        response,
        "/patient/dashboard"
      )
    }
  }

  if (
    routeKind ===
    "patient-protected"
  ) {
    if (!authenticated) {
      return createRedirectResponse(
        request,
        response,
        "/patient/login",
        true
      )
    }

    if (
      accountType ===
      "staff"
    ) {
      return createRedirectResponse(
        request,
        response,
        "/staff"
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
