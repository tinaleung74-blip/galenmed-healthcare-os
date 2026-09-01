import "server-only"

import {
  redirect,
} from "next/navigation"

import {
  patientPortalContextSchema,
} from "@/features/patient-portal/schemas/patient-portal.schema"
import type {
  PatientPortalContext,
} from "@/features/patient-portal/types/patient-portal.types"
import {
  createClient,
} from "@/lib/supabase/server"

interface PatientPortalAuthState {
  context:
    PatientPortalContext | null
}

async function getCurrentPatientPortalAuthState(): Promise<
  PatientPortalAuthState
> {
  const supabase =
    await createClient()

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims()

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      context: null,
    }
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_current_patient_portal_context"
  )

  if (error) {
    return {
      context: null,
    }
  }

  const parsedContext =
    patientPortalContextSchema.safeParse(
      data
    )

  return {
    context:
      parsedContext.success
        ? parsedContext.data
        : null,
  }
}

function validatePatientPortalContext(
  context:
    PatientPortalContext | null
): PatientPortalContext {
  if (!context) {
    redirect(
      "/patient/login"
    )
  }

  if (
    context.accountStatus !==
      "active" ||
    context.patient.status !==
      "active"
  ) {
    redirect(
      "/patient/login?error=inactive"
    )
  }

  return context
}

export async function requirePatientPortal(): Promise<
  PatientPortalContext
> {
  const authState =
    await getCurrentPatientPortalAuthState()

  const context =
    validatePatientPortalContext(
      authState.context
    )

  if (
    context.mustChangePassword
  ) {
    redirect(
      "/patient/change-password"
    )
  }

  return context
}

export async function requirePatientPasswordChange(): Promise<
  PatientPortalContext
> {
  const authState =
    await getCurrentPatientPortalAuthState()

  const context =
    validatePatientPortalContext(
      authState.context
    )

  if (
    !context.mustChangePassword
  ) {
    redirect(
      "/patient/dashboard"
    )
  }

  return context
}
