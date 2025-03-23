"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { MediConnectLogo } from "@/components/logo"

export default function SelectRole() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<"patient" | "clinician">("patient")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to select a role",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Store user role in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
      })

      // Redirect based on role
      if (role === "patient") {
        router.push("/patient/onboarding")
      } else if (role === "clinician") {
        router.push("/clinician/onboarding")
      }
    } catch (error: any) {
      toast({
        title: "Error saving role",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/40">
      <div className="mb-8">
        <MediConnectLogo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Select Your Role</CardTitle>
          <CardDescription className="text-center text-lg">Choose how you want to use MediConnect</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as "patient" | "clinician")}
              className="flex flex-col space-y-4"
            >
              <div 
                className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                  role === "patient" 
                    ? "bg-blue-100 border-blue-500 border-2 shadow-sm" 
                    : "hover:bg-muted/50 border-input"
                }`}
                onClick={() => setRole("patient")}
              >
                <input 
                  type="radio" 
                  name="role" 
                  id="patient"
                  value="patient"
                  checked={role === "patient"}
                  onChange={() => setRole("patient")}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <Label 
                    htmlFor="patient" 
                    className={`text-xl ${role === "patient" ? "font-bold text-blue-800" : "font-medium"}`}
                  >
                    Patient
                  </Label>
                  <p className="text-muted-foreground text-lg">
                    I want to ask medical questions and receive verified answers
                  </p>
                </div>
              </div>
              <div 
                className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                  role === "clinician" 
                    ? "bg-blue-100 border-blue-500 border-2 shadow-sm" 
                    : "hover:bg-muted/50 border-input"
                }`}
                onClick={() => setRole("clinician")}
              >
                <input 
                  type="radio" 
                  name="role" 
                  id="clinician"
                  value="clinician"
                  checked={role === "clinician"}
                  onChange={() => setRole("clinician")}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <Label 
                    htmlFor="clinician" 
                    className={`text-xl ${role === "clinician" ? "font-bold text-blue-800" : "font-medium"}`}
                  >
                    Clinician
                  </Label>
                  <p className="text-muted-foreground text-lg">
                    I am a healthcare professional who wants to verify medical information
                  </p>
                </div>
              </div>
            </RadioGroup>

            <Button type="submit" className="w-full text-lg py-3" disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

