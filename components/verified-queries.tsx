"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface VerifiedQueriesProps {
  queries: Query[]
}

export function VerifiedQueries({ queries }: VerifiedQueriesProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">You haven't verified any queries yet.</p>
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="font-medium">Verified by you</span>
                </div>

                {query.rating !== null && (
                  <Badge variant={query.rating === 1 ? "default" : "destructive"}>
                    {query.rating === 1 ? "Helpful" : "Not Helpful"}
                  </Badge>
                )}
              </div>

              <div className="text-lg whitespace-pre-wrap">{query.answer}</div>

              {query.rating !== null && (
                <div className="flex justify-end mt-4">
                  {query.rating === 1 ? (
                    <ThumbsUp className="h-5 w-5 text-primary" />
                  ) : (
                    <ThumbsDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

