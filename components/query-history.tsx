"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, CheckCircle, User } from "lucide-react"
import { formatDistanceToNow, format, isValid } from "date-fns"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface Query {
  id: string
  question: string
  answer: string
  verified: boolean
  clinicianId: string | null
  clinicianName: string | null
  timestamp: string | { seconds: number, nanoseconds: number } | any
  verifiedAt?: string | { seconds: number, nanoseconds: number } | any
  rating: number | null
}

interface QueryHistoryProps {
  queries: Query[]
}

// Helper function to safely format dates from Firestore
const formatFirestoreTimestamp = (timestamp: any, formatFn: Function, defaultValue: string = "Recently") => {
  if (!timestamp) return defaultValue;
  
  try {
    // Handle Firestore timestamp objects
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      if (isValid(date)) {
        return formatFn(date);
      }
    }
    
    // Handle ISO string timestamps
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isValid(date)) {
        return formatFn(date);
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return defaultValue;
  }
};

export function QueryHistory({ queries }: QueryHistoryProps) {
  const { toast } = useToast()
  const [loadingRatings, setLoadingRatings] = useState<Record<string, boolean>>({})

  const handleRating = async (queryId: string, clinicianId: string | null, rating: number) => {
    try {
      setLoadingRatings((prev) => ({ ...prev, [queryId]: true }))

      // Update the rating in Firestore
      await updateDoc(doc(db, "queries", queryId), {
        rating,
      })

      // If there's a clinician ID, update their rating
      if (clinicianId) {
        // Call the API to update clinician rating
        await fetch("/api/update-rating", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clinicianId }),
        })
      }

      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      })
    } catch (error: any) {
      toast({
        title: "Error submitting rating",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingRatings((prev) => ({ ...prev, [queryId]: false }))
    }
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">You haven't asked any questions yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {queries.map((query) => (
        <Card key={query.id} className={`overflow-hidden shadow-md border-2 ${
          query.verified ? "border-green-200" : "border-yellow-200"
        }`}>
          <CardContent className="p-0">
            <div className="p-6 border-b bg-slate-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-sm uppercase text-muted-foreground font-semibold mb-1 block">Patient Question:</span>
                  <h3 className="font-bold text-xl">{query.question}</h3>
                </div>
                <span className="text-sm bg-slate-200 px-2 py-1 rounded-md text-slate-700 font-medium">
                  {formatFirestoreTimestamp(
                    query.timestamp,
                    (date: Date) => formatDistanceToNow(date, { addSuffix: true })
                  )}
                </span>
              </div>
            </div>

            <div className={`p-6 ${query.verified ? "bg-green-50" : "bg-yellow-50"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {query.verified ? (
                    <>
                      <Badge className="bg-green-600 hover:bg-green-700 px-3 py-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Verified by {query.clinicianName || "Clinician"}</span>
                      </Badge>
                      
                      {query.verifiedAt && (
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          {formatFirestoreTimestamp(
                            query.verifiedAt,
                            (date: Date) => format(date, "MMM d, h:mm a"),
                            "Recently"
                          )}
                        </span>
                      )}
                    </>
                  ) : (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1">
                      <span className="text-sm font-medium">Awaiting Verification</span>
                    </Badge>
                  )}
                </div>

                {query.rating !== null && (
                  <Badge variant={query.rating === 1 ? "default" : "destructive"} className="px-3 py-1">
                    {query.rating === 1 ? (
                      <><ThumbsUp className="h-4 w-4 mr-1" /> Helpful</>
                    ) : (
                      <><ThumbsDown className="h-4 w-4 mr-1" /> Not Helpful</>
                    )}
                  </Badge>
                )}
              </div>

              <div className="text-lg whitespace-pre-wrap p-4 border border-green-200 rounded-md bg-white mb-4">{query.answer}</div>

              <div className="flex justify-between items-center mt-4">
                {query.verified && query.rating === null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">Was this helpful?</span>
                    <button
                      onClick={() => handleRating(query.id, query.clinicianId, 1)}
                      disabled={loadingRatings[query.id]}
                      className="flex items-center bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Yes
                    </button>
                    <button
                      onClick={() => handleRating(query.id, query.clinicianId, 0)}
                      disabled={loadingRatings[query.id]}
                      className="flex items-center bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full text-sm"
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      No
                    </button>
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2 text-green-600" />
                  <span>Patient feedback: </span>
                  {query.rating === null ? (
                    <span className="ml-1 text-slate-500">No feedback yet</span>
                  ) : (
                    <span className={`ml-1 font-medium ${query.rating === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {query.rating === 1 ? 'Patient found this helpful' : 'Patient found this unhelpful'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

