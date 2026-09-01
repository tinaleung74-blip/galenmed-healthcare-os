import {
  redirect,
} from "next/navigation"

export default function PatientPortalIndexPage() {
  redirect(
    "/patient/login"
  )
}
