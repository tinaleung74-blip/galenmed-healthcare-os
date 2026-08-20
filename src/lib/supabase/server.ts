import {
  createServerClient,
} from "@supabase/ssr"
import {
  cookies,
} from "next/headers"

export async function createClient() {
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
    throw new Error(
      "GalenMed Supabase public environment variables are missing."
    )
  }

  const cookieStore =
    await cookies()

  return createServerClient(
    supabaseUrl,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },

        setAll(
          cookiesToSet
        ) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                )
              }
            )
          } catch {
            /*
             * Server Components cannot
             * always write cookies.
             * The Proxy refreshes and
             * persists the session.
             */
          }
        },
      },
    }
  )
}
