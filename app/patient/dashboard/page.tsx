"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PatientHeader } from "@/components/patient-header"
import { PatientChatbox } from "@/components/patient-chatbox"
import { QueryHistory } from "@/components/query-history"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface Query {
  id: string
  question: string
  answer: string
  verified: boolean
  clinicianId: string | null
  clinicianName: string | null
  timestamp: string
  rating: number | null
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [patientDetails, setPatientDetails] = useState<any>(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!user) return

      try {
        // Fetch patient details
        const patientDoc = await getDocs(query(collection(db, "patientDetails"), where("userId", "==", user.uid)))

        if (!patientDoc.empty) {
          setPatientDetails(patientDoc.docs[0].data())
        }

        // Fetch patient queries
        const queriesSnapshot = await getDocs(
          query(collection(db, "queries"), where("userId", "==", user.uid), orderBy("timestamp", "desc")),
        )

        const queriesData = queriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Query[]

        setQueries(queriesData)
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

    fetchPatientData()
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
      <PatientHeader patientDetails={patientDetails} />

      <main className="flex-1 container mx-auto p-4 md:p-6">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="chat" className="text-lg py-3">
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="text-lg py-3">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Ask a Medical Question</CardTitle>
                <CardDescription className="text-lg">
                  Get AI-generated answers verified by real clinicians
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientChatbox userId={user?.uid} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Your Query History</CardTitle>
                <CardDescription className="text-lg">View your previous questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <QueryHistory queries={queries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

