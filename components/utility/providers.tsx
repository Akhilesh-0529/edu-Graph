"use client"

import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes/dist/types"
import { FC } from "react"

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error
  console.error = (...args: any[]) => {
    const msg = args.map(a => String(a)).join(" ")
    if (msg.includes("Accessing element.ref was removed in React 19")) {
      return
    }
    originalError(...args)
  }

  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const msg = args.map(a => String(a)).join(" ")
    if (msg.includes("Accessing element.ref was removed in React 19")) {
      return
    }
    originalWarn(...args)
  }
}

export const Providers: FC<ThemeProviderProps> = ({ children, ...props }) => {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  )
}
