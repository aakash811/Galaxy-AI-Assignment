import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Weavy - AI Workflow Builder",
  description: "Build and run AI-powered workflows with a visual node-based interface",
}

export const viewport: Viewport = {
  themeColor: "#1a1625",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "oklch(0.65 0.25 285)",
          colorBackground: "oklch(0.13 0.01 285)",
          colorInputBackground: "oklch(0.17 0.01 285)",
          colorInputText: "oklch(0.95 0 0)",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${geist.className} ${geistMono.className} antialiased overflow-hidden`}
        >
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
