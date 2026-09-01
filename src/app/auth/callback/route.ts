import {
  NextResponse,
  type NextRequest,
} from "next/server"

import {
  createClient,
} from "@/lib/supabase/server"

function getSafeNextPath(
  value:
    string | null
): string {
  if (
    value &&
    value.startsWith(
      "/"
    ) &&
    !value.startsWith(
      "//"
    )
  ) {
    return value
  }

  return "/staff/account/change-password"
}

function getRecoveryErrorPath(
  nextPath: string
): string {
  return nextPath.startsWith(
    "/patient/"
  )
    ? "/patient/login"
    : "/staff/login"
}

export async function GET(
  request:
    NextRequest
) {
  const code =
    request.nextUrl.searchParams.get(
      "code"
    )

  const nextPath =
    getSafeNextPath(
      request.nextUrl.searchParams.get(
        "next"
      )
    )

  if (code) {
    const supabase =
      await createClient()

    const {
      error,
    } =
      await supabase.auth.exchangeCodeForSession(
        code
      )

    if (!error) {
      const successUrl =
        request.nextUrl.clone()

      successUrl.pathname =
        nextPath

      successUrl.search =
        ""

      return NextResponse.redirect(
        successUrl
      )
    }
  }

  const errorUrl =
    request.nextUrl.clone()

  errorUrl.pathname =
    getRecoveryErrorPath(
      nextPath
    )

  errorUrl.search =
    "?error=password-reset"

  return NextResponse.redirect(
    errorUrl
  )
}
