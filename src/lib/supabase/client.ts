import {
  createBrowserClient,
} from "@supabase/ssr"

export function createClient() {
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

  return createBrowserClient(
    supabaseUrl,
    publishableKey
  )
}
