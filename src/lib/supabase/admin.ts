import "server-only"

import {
  createClient,
} from "@supabase/supabase-js"

export function createAdminClient() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const secretKey =
    process.env
      .SUPABASE_SECRET_KEY

  if (
    !supabaseUrl ||
    !secretKey
  ) {
    throw new Error(
      "GalenMed Supabase server environment variables are missing."
    )
  }

  if (
    !secretKey.startsWith(
      "sb_secret_"
    )
  ) {
    throw new Error(
      "SUPABASE_SECRET_KEY must use a Supabase sb_secret_ key."
    )
  }

  return createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}
