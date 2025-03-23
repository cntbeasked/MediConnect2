"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { usePathname } from "next/navigation"

export function ConfigCheck() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const pathname = usePathname()
  
  // Check if we're on a public page (landing, login, register) or authenticated route
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/select-role'

  useEffect(() => {
    // Public pages only need to check for Firebase public variables
    // Authenticated pages need to check for all variables
    const requiredVars = isPublicPage
      ? [
          "NEXT_PUBLIC_FIREBASE_API_KEY",
          "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
          "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
          "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
          "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
          "NEXT_PUBLIC_FIREBASE_APP_ID",
        ]
      : [
          "NEXT_PUBLIC_FIREBASE_API_KEY",
          "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
          "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
          "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
          "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
          "NEXT_PUBLIC_FIREBASE_APP_ID",
          "OPENAI_API_KEY",
        ]

    const missing = requiredVars.filter((varName) => !process.env[varName])
    setMissingVars(missing)
    setChecked(true)
  }, [isPublicPage])

  // Don't show anything if we're on a public page and only the non-public vars are missing
  if (isPublicPage && missingVars.includes("OPENAI_API_KEY") && missingVars.length === 1) {
    return null
  }

  if (!checked) return null

  if (missingVars.length === 0) {
    return (
      <Alert className="mb-6 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">Configuration Complete</AlertTitle>
        <AlertDescription className="text-green-600">All required environment variables are set.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Configuration</AlertTitle>
      <AlertDescription>
        <p>The following environment variables are missing:</p>
        <ul className="list-disc pl-5 mt-2">
          {missingVars.map((varName) => (
            <li key={varName}>{varName}</li>
          ))}
        </ul>
        <p className="mt-2">Please add these environment variables to your project.</p>
      </AlertDescription>
    </Alert>
  )
}

