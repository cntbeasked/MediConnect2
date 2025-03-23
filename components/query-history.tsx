"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

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

interface QueryHistoryProps {
  queries: Query[]
}

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
        <Card key={query.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl">{query.question}</h3>
                <span className="text-sm text-muted-foreground">
                  {query.timestamp ? formatDistanceToNow(new Date(query.timestamp), { addSuffix: true }) : "Recently"}
                </span>
              </div>
            </div>

            <div className="p-6 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${query.verified ? "bg-green-500" : "bg-yellow-500"}`}></div>
                <span className="font-medium">
                  {query.verified ? `Verified by ${query.clinicianName || "Clinician"}` : "Awaiting Verification"}
                </span>
              </div>
              <div className="text-lg whitespace-pre-wrap mb-4">{query.answer}</div>

              <div className="flex justify-end gap-2">
                <Button
                  variant={query.rating === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRating(query.id, query.clinicianId, 1)}
                  disabled={loadingRatings[query.id] || query.rating !== null}
                >
                  <ThumbsUp className="h-5 w-5" />
                </Button>
                <Button
                  variant={query.rating === -1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRating(query.id, query.clinicianId, -1)}
                  disabled={loadingRatings[query.id] || query.rating !== null}
                >
                  <ThumbsDown className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

