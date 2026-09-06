import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.vercel-preview" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: "jans103174+galenmed-patient-uat-20260828@gmail.com",
  password: "GalenMed@PatientUAT26!"
})

if (error) {
  console.error("PREVIEW AUTH FAIL:", error.message)
  process.exit(1)
}

console.log("PREVIEW AUTH PASS")
console.log("USER:", data.user?.email)
