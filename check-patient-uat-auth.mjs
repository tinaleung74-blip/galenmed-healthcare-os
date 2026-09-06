import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const email =
  "jans103174+galenmed-patient-uat-20260828@gmail.com"

const { data, error } =
  await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

if (error) {
  console.error("FAILED:", error.message)
  process.exit(1)
}

const user = data.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase()
)

if (!user) {
  console.log("PATIENT AUTH USER: NOT FOUND")
  process.exit(0)
}

console.log("PATIENT AUTH USER: FOUND")
console.log("EMAIL:", user.email)
console.log("CONFIRMED:", Boolean(user.email_confirmed_at))
console.log("BANNED:", Boolean(user.banned_until))
console.log("ACCOUNT TYPE:", user.app_metadata?.account_type ?? "none")
