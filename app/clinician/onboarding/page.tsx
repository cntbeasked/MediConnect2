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
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { MediConnectLogo } from "@/components/logo"

export default function ClinicianOnboarding() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    fullName: "",
    specialization: "",
    licenseNumber: "",
    yearsOfExperience: "",
    hospital: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Save clinician details to Firestore
      await setDoc(doc(db, "clinicianDetails", user.uid), {
        ...formData,
        userId: user.uid,
        rating: 5.0, // Default rating
        verifiedResponses: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: "Your professional details have been saved",
      })

      // Redirect to clinician dashboard
      router.push("/clinician/dashboard")
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
          <CardTitle className="text-3xl font-bold text-center">Professional Information</CardTitle>
          <CardDescription className="text-center text-lg">
            Please provide your professional details to complete your clinician profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-lg">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-lg">
                  Specialization
                </Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => handleSelectChange("specialization", value)}
                >
                  <SelectTrigger className="text-lg p-3">
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                    <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Oncology">Oncology</SelectItem>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                    <SelectItem value="Rheumatology">Rheumatology</SelectItem>
                    <SelectItem value="General Practice">General Practice</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber" className="text-lg">
                  License Number
                </Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  placeholder="Enter your medical license number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience" className="text-lg">
                  Years of Experience
                </Label>
                <Input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  placeholder="Enter years of experience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hospital" className="text-lg">
                  Hospital/Clinic
                </Label>
                <Input
                  id="hospital"
                  name="hospital"
                  placeholder="Enter your hospital or clinic name"
                  value={formData.hospital}
                  onChange={handleChange}
                  required
                  className="text-lg p-3"
                />
              </div>
            </div>

            <Button type="submit" className="w-full text-lg py-3" disabled={loading}>
              {loading ? "Saving..." : "Save and Continue"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-muted-foreground text-center">
            Your information will be verified to ensure the quality of our platform
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

