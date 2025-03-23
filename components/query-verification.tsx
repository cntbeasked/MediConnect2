"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { doc, updateDoc } from "firebase/firestore"
import { updateDocument } from "@/lib/firestore-helpers"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, Edit, Loader2 } from "lucide-react"

interface Query {
  id: string
  userId: string
  question: string
  answer: string
  verified: boolean
  clinicianId: string | null
  clinicianName: string | null
  timestamp: string
  verifiedAt?: string
}

interface QueryVerificationProps {
  queries: Query[]
  clinicianId: string | undefined
  clinicianName: string | undefined
  onVerify: (queryId: string) => void
}

export function QueryVerification({ queries, clinicianId, clinicianName, onVerify }: QueryVerificationProps) {
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedAnswer, setEditedAnswer] = useState("")
  const [loadingVerify, setLoadingVerify] = useState<Record<string, boolean>>({})

  const handleEdit = (query: Query) => {
    setEditingId(query.id)
    setEditedAnswer(query.answer)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditedAnswer("")
  }

  const handleVerify = async (queryId: string, answer: string, isEdited: boolean) => {
    if (!clinicianId || !clinicianName) {
      toast({
        title: "Error",
        description: "Clinician information is missing",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingVerify((prev) => ({ ...prev, [queryId]: true }))

      // Update the query in Firestore
      await updateDocument<Query>(
        "queries", 
        queryId, 
        {
          verified: true,
          clinicianId,
          clinicianName,
          answer: isEdited ? answer : answer,
          verifiedAt: new Date().toISOString(),
        }
      )

      toast({
        title: "Query verified",
        description: isEdited ? "You have edited and verified this response" : "You have verified this response",
      })

      // Reset editing state
      setEditingId(null)
      setEditedAnswer("")

      // Notify parent component
      onVerify(queryId)
    } catch (error: any) {
      toast({
        title: "Error verifying query",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingVerify((prev) => ({ ...prev, [queryId]: false }))
    }
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">No queries awaiting verification.</p>
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
                <span className="font-medium">AI-Generated Response:</span>
                {editingId !== query.id && (
                  <Button variant="outline" size="sm" onClick={() => handleEdit(query)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {editingId === query.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="min-h-[200px] text-lg"
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleVerify(query.id, editedAnswer, true)}
                      disabled={loadingVerify[query.id]}
                    >
                      {loadingVerify[query.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Save & Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-lg whitespace-pre-wrap">{query.answer}</div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleVerify(query.id, query.answer, false)}
                      disabled={loadingVerify[query.id]}
                    >
                      {loadingVerify[query.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

