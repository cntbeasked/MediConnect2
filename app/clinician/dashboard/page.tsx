"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, where, orderBy, doc, getDoc } from "firebase/firestore"
import { getDocument, queryDocuments } from "@/lib/firestore-helpers"
import { ClinicianHeader } from "@/components/clinician-header"
import { QueryVerification } from "@/components/query-verification"
import { VerifiedQueries } from "@/components/verified-queries"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface Query {
  id: string
  userId: string
  question: string
  answer: string
  verified: boolean
  clinicianId: string | null
  clinicianName: string | null
  timestamp: string
  rating: number | null
}

export default function ClinicianDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pendingQueries, setPendingQueries] = useState<Query[]>([])
  const [verifiedQueries, setVerifiedQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [clinicianDetails, setClinicianDetails] = useState<any>(null)

  const fetchClinicianData = async () => {
    if (!user) return

    try {
      // Fetch clinician details
      const clinicianDocRef = getDocument("clinicianDetails", user.uid)
      const clinicianDoc = await getDoc(clinicianDocRef)

      if (clinicianDoc.exists()) {
        setClinicianDetails(clinicianDoc.data())
      }

      // Fetch pending queries (not verified)
      const pendingSnapshot = await queryDocuments<Query>(
        "queries", 
        where("verified", "==", false), 
        orderBy("timestamp", "desc")
      )

      const pendingData = pendingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Omit<Query, 'id'>
      }))

      setPendingQueries(pendingData)

      // Fetch verified queries by this clinician
      const verifiedSnapshot = await queryDocuments<Query>(
        "queries",
        where("clinicianId", "==", user.uid),
        where("verified", "==", true),
        orderBy("timestamp", "desc")
      )

      const verifiedData = verifiedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Omit<Query, 'id'>
      }))

      setVerifiedQueries(verifiedData)
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClinicianData()
  }, [user, toast])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-xl">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ClinicianHeader clinicianDetails={clinicianDetails} />

      <main className="flex-1 container mx-auto p-4 md:p-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="pending" className="text-lg py-3">
              Pending Verification
            </TabsTrigger>
            <TabsTrigger value="verified" className="text-lg py-3">
              Verified by You
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Queries Awaiting Verification</CardTitle>
                <CardDescription className="text-lg">
                  Review and verify AI-generated responses to patient queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QueryVerification
                  queries={pendingQueries}
                  clinicianId={user?.uid}
                  clinicianName={clinicianDetails?.fullName}
                  onVerify={(queryId) => {
                    setPendingQueries((prev) => prev.filter((q) => q.id !== queryId))
                    // Refresh verified queries
                    fetchClinicianData()
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Queries Verified by You</CardTitle>
                <CardDescription className="text-lg">View the queries you have previously verified</CardDescription>
              </CardHeader>
              <CardContent>
                <VerifiedQueries queries={verifiedQueries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

