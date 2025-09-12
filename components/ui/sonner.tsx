"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand
      closeButton
      duration={3500}
      toastOptions={{
        className:
          "border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-gray-900 text-amber-900 dark:text-amber-100 shadow-lg",
        descriptionClassName: "text-amber-800/80 dark:text-amber-300/80",
        duration: 3500,
      }}
      style={{
        "--normal-bg": "transparent",
        "--normal-text": "inherit",
        "--normal-border": "transparent",
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
