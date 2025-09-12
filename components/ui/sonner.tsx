"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand
      closeButton
      duration={4000}
      richColors
      toastOptions={{
        className:
          "rounded-lg shadow-lg ring-1 ring-amber-300/30 dark:ring-amber-900/40",
        descriptionClassName: "opacity-90",
        duration: 4000,
      }}
      {...props}
    />
  )
}

export { Toaster }
