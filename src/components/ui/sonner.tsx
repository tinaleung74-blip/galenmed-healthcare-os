"use client"

import type { ComponentProps } from "react"
import { Toaster as Sonner } from "sonner"

function Toaster(props: ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      {...props}
    />
  )
}

export { Toaster }
