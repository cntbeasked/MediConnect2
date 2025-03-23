"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
// Fallback navigation component in case PatientNav isn't available
import { LogOut, User, MessageSquare, Calendar, Home } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

// Simple fallback navigation component
function SimplePatientNav() {
  const pathname = usePathname()
  const router = useRouter()
  
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/patient/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "/patient/dashboard/profile",
      icon: <User className="h-5 w-5" />,
    }
  ]
  
  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <Link href="/patient/dashboard" className="font-semibold text-lg mr-6">
          MediConnect
        </Link>
        <div className="flex items-center gap-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="ml-auto">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  )
}

export default function PatientProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
    medicalConditions: ""
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        // Populate email from auth
        setFormData(prev => ({
          ...prev,
          email: currentUser.email || "",
          fullName: currentUser.displayName || ""
        }))
        
        // Fetch existing profile data from Firestore
        try {
          const docRef = doc(db, "patients", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({
              ...prev,
              fullName: data.fullName || prev.fullName,
              phoneNumber: data.phoneNumber || "",
              dateOfBirth: data.dateOfBirth || "",
              address: data.address || "",
              emergencyContact: data.emergencyContact || "",
              medicalConditions: data.medicalConditions || ""
            }));
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Save the profile data to Firestore
      const userDocRef = doc(db, "patients", user.uid);
      await setDoc(userDocRef, {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        medicalConditions: formData.medicalConditions,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: error.message || "There was an error saving your profile information.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SimplePatientNav />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and medical details.</p>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.photoURL || ""} alt={formData.fullName} />
                  <AvatarFallback className="text-2xl">{formData.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{formData.fullName || "Patient"}</CardTitle>
                  <CardDescription>{formData.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    id="phoneNumber" 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    name="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input 
                  id="emergencyContact" 
                  name="emergencyContact" 
                  value={formData.emergencyContact} 
                  onChange={handleInputChange} 
                  placeholder="Name and phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea 
                  id="medicalConditions" 
                  name="medicalConditions" 
                  value={formData.medicalConditions} 
                  onChange={handleInputChange} 
                  placeholder="List any pre-existing conditions, allergies, or medications"
                  className="h-32"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
} 