"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, CheckCircle, User } from "lucide-react"
import { formatDistanceToNow, format, isValid } from "date-fns"

interface Query {
  id: string
  userId?: string
  question: string
  answer: string
  verified: boolean
  clinicianId: string | null
  clinicianName: string | null
  timestamp: string | { seconds: number, nanoseconds: number } | any
  verifiedAt?: string | { seconds: number, nanoseconds: number } | any
  rating: number | null
}

interface VerifiedQueriesProps {
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
        <Card key={query.id} className="overflow-hidden shadow-md border-green-200 border-2">
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
                    (date: Date) => formatDistanceToNow(date, { addSuffix: true }),
                    "Recently"
                  )}
                </span>
              </div>
            </div>

            <div className="p-6 bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600 hover:bg-green-700 px-3 py-1">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Verified by you</span>
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

