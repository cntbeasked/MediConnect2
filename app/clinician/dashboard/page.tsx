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
      // This will fetch ALL pending queries regardless of clinician, so they can be verified by any clinician
      console.log("Fetching pending queries for clinician...");
      const pendingSnapshot = await queryDocuments<Query>(
        "queries", 
        where("verified", "==", false), 
        orderBy("timestamp", "desc")
      )

      console.log(`Found ${pendingSnapshot.docs.length} pending queries`);
      
      // If there are no pending queries, let's do a broader search to debug
      if (pendingSnapshot.empty) {
        console.log("No pending queries found, checking if any queries exist at all...");
        const allQueriesSnapshot = await queryDocuments<Query>("queries");
        console.log(`Total queries in database: ${allQueriesSnapshot.docs.length}`);
        if (!allQueriesSnapshot.empty) {
          const sample = allQueriesSnapshot.docs[0].data();
          console.log("Sample query data:", JSON.stringify({
            verified: sample.verified,
            timestamp: sample.timestamp,
            hasUserId: !!sample.userId
          }));
        }
      }

      const pendingData = pendingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as Omit<Query, 'id'>
      }))

      setPendingQueries(pendingData)

      // Fetch verified queries by this clinician
      console.log("Fetching verified queries for clinician ID:", user.uid);
      
      // First try with the composite query
      try {
        const verifiedSnapshot = await queryDocuments<Query>(
          "queries",
          where("clinicianId", "==", user.uid),
          where("verified", "==", true),
          orderBy("timestamp", "desc")
        );
        
        console.log(`Found ${verifiedSnapshot.docs.length} verified queries by this clinician`);
        
        const verifiedData = verifiedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data() as Omit<Query, 'id'>
        }));
        
        setVerifiedQueries(verifiedData);
      } catch (queryError) {
        console.error("Error with composite query:", queryError);
        
        // If that fails, fall back to a simpler query
        console.log("Falling back to simpler query...");
        try {
          const verifiedSnapshot = await queryDocuments<Query>(
            "queries",
            where("clinicianId", "==", user.uid)
          );
          
          console.log(`Found ${verifiedSnapshot.docs.length} queries with this clinician ID`);
          
          // Filter verified ones in JavaScript
          const verifiedData = verifiedSnapshot.docs
            .filter(doc => doc.data().verified === true)
            .map((doc) => ({
              id: doc.id,
              ...doc.data() as Omit<Query, 'id'>
            }));
          
          console.log(`After filtering, found ${verifiedData.length} verified queries`);
          setVerifiedQueries(verifiedData);
        } catch (fallbackError: any) {
          console.error("Error with fallback query:", fallbackError);
          toast({
            title: "Error fetching verified queries",
            description: fallbackError.message,
            variant: "destructive",
          });
        }
      }
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

