"use server"

import {
  headers,
} from "next/headers"
import {
  redirect,
} from "next/navigation"

import {
  createClient,
} from "@/lib/supabase/server"

export async function signOutStaff() {
  const supabase =
    await createClient()

  const requestHeaders =
    await headers()

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims()

  if (
    claimsData?.claims?.sub
  ) {
    await supabase.rpc(
      "record_staff_session_event",
      {
        p_event_type: "logout",
        p_session_id: null,
        p_user_agent:
          requestHeaders.get(
            "user-agent"
          ),
        p_metadata: {
          source:
            "staff_dashboard",
        },
      }
    )
  }

  const {
    error: signOutError,
  } = await supabase.auth.signOut({
    scope: "local",
  })

  if (signOutError) {
    throw new Error(
      "Unable to sign out the current GalenMed session."
    )
  }

  redirect("/staff/login")
}
