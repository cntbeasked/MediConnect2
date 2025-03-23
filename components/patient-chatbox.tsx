"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Send, Loader2 } from "lucide-react"
import { addDocument } from "@/lib/firestore-helpers"
import { useToast } from "@/components/ui/use-toast"

// Add TypeScript definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface PatientChatboxProps {
  userId: string | undefined
}

export function PatientChatbox({ userId }: PatientChatboxProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Basic voice-to-text function
  const startVoiceToText = () => {
    // Check if browser supports speech recognition
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      })
      return
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    // Configure
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    
    // Handle result
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setMessage(transcript)
    }
    
    // Handle errors
    recognition.onerror = (event: any) => {
      toast({
        title: "Voice error",
        description: "Could not capture voice. Please try again.",
        variant: "destructive",
      })
    }
    
    // Start listening
    try {
      recognition.start()
      toast({
        title: "Listening...",
        description: "Speak now. Results will appear when you pause.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    if (!message.trim() || !userId) return

    try {
      setIsLoading(true)
      setResponse(null)

      // Call the API route to get AI response
      const aiResponse = await fetch("/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: message }),
      })
      
      const data = await aiResponse.json()

      if (!aiResponse.ok) {
        throw new Error(data.error || "Failed to generate response")
      }

      // Check if we got a valid response
      if (!data.response) {
        throw new Error("No response received from API")
      }

      // Store the query and response in Firestore
      try {
        const queryRef = await addDocument("queries", {
          userId,
          question: message,
          answer: data.response,
          verified: false,
          clinicianId: null,
          clinicianName: null,
          rating: null,
        })
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError)
        toast({
          title: "Database error",
          description: "Your question was answered, but we couldn't save it. Please try again.",
          variant: "destructive",
        })
      }

      setResponse(data.response)
      setIsVerified(false)
      setMessage("")

      toast({
        title: "Question submitted",
        description: "Your question has been submitted and answered by AI. A clinician will review it soon.",
      })
    } catch (error: any) {
      console.error("Error in handleSubmit:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="space-y-6">
      {response && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isVerified ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <span className="font-medium">{isVerified ? "Verified by Clinician" : "Awaiting Verification"}</span>
            </div>
            <div className="text-lg whitespace-pre-wrap">{response}</div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col space-y-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type your medical question or use voice input..."
          value={message}
          onChange={handleTextareaChange}
          className="min-h-[120px] text-lg p-4 resize-none"
          disabled={isLoading}
        />

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={startVoiceToText}
            disabled={isLoading}
            className="text-base"
            size="lg"
          >
            <Mic className="mr-2 h-5 w-5" />
            Voice Input
          </Button>

          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isLoading || !message.trim()} 
            className="text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

