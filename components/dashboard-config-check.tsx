"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export function DashboardConfigCheck() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const requiredVars = [
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
  }, [])

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