import {
  createServerClient,
} from "@supabase/ssr"
import {
  NextResponse,
  type NextRequest,
} from "next/server"

export interface SessionUpdateResult {
  response: NextResponse
  authenticated: boolean
}

export async function updateSession(
  request: NextRequest
): Promise<SessionUpdateResult> {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const publishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (
    !supabaseUrl ||
    !publishableKey
  ) {
    return {
      response:
        NextResponse.next({
          request,
        }),

      authenticated: false,
    }
  }

  let supabaseResponse =
    NextResponse.next({
      request,
    })

  const supabase =
    createServerClient(
      supabaseUrl,
      publishableKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                )
              }
            )

            supabaseResponse =
              NextResponse.next({
                request,
              })

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                )
              }
            )
          },
        },
      }
    )

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims()

  return {
    response: supabaseResponse,

    authenticated:
      !claimsError &&
      Boolean(
        claimsData?.claims?.sub
      ),
  }
}
