"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { MediConnectLogo } from "@/components/logo"

export default function PatientOnboarding() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    age: "",
    height: "",
    weight: "",
    bloodGroup: "",
    existingConditions: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Save patient medical details to Firestore
      await setDoc(doc(db, "patientDetails", user.uid), {
        ...formData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Your medical details have been saved",
      })

      // Redirect to patient dashboard
      router.push("/patient/dashboard")
    } catch (error: any) {
      toast({
        title: "Error saving details",
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Medical Information</CardTitle>
          <CardDescription className="text-center text-lg">
            Please provide your basic medical information to help us serve you better
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-lg">
                  Age
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup" className="text-lg">
                  Blood Group
                </Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => handleSelectChange("bloodGroup", value)}>
                  <SelectTrigger className="text-lg p-3">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-lg">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  placeholder="Enter your height in cm"
                  value={formData.height}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-lg">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  placeholder="Enter your weight in kg"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="existingConditions" className="text-lg">
                Existing Medical Conditions (if any)
              </Label>
              <Textarea
                id="existingConditions"
                name="existingConditions"
                placeholder="Please list any existing medical conditions, allergies, or medications"
                value={formData.existingConditions}
                onChange={handleChange}
                className="min-h-[120px] text-lg p-3"
              />
            </div>

            <Button type="submit" className="w-full text-lg py-3" disabled={loading}>
              {loading ? "Saving..." : "Save and Continue"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-center">
            Your information is secure and will only be used to provide better medical assistance
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

