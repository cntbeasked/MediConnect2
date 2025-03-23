"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, Send, Loader2, CheckCircle, Clock } from "lucide-react"
import { addDocument, queryDocuments, getDocument, getDoc } from "@/lib/firestore-helpers"
import { useToast } from "@/components/ui/use-toast"
import { where, orderBy, limit } from "firebase/firestore"
import { formatDistanceToNow, isValid } from "date-fns"

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

interface UserQuery {
  id: string;
  userId: string;
  question: string;
  answer: string;
  verified: boolean;
  clinicianId: string | null;
  clinicianName: string | null;
  timestamp: any;
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

export function PatientChatbox({ userId }: PatientChatboxProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [lastQueryId, setLastQueryId] = useState<string | null>(null)
  const [clinicianName, setClinicianName] = useState<string | null>(null)
  const [previousQueries, setPreviousQueries] = useState<UserQuery[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null) // Store the speech recognition instance
  const { toast } = useToast()

  // Cleanup function for speech recognition
  useEffect(() => {
    // Cleanup the speech recognition when component unmounts
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Fetch latest user query and check verification status
  useEffect(() => {
    if (!userId || !lastQueryId) return;
    
    // Function to fetch and update verification status
    const fetchVerificationStatus = async () => {
      try {
        // Get the query document
        const queryDocRef = getDocument("queries", lastQueryId);
        const querySnapshot = await getDoc(queryDocRef);
        
        if (querySnapshot.exists()) {
          const data = querySnapshot.data();
          setIsVerified(data.verified || false);
          setClinicianName(data.clinicianName || null);
          
          if (data.answer && !response) {
            setResponse(data.answer);
          }
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
      }
    };
    
    // Check immediately and then set up interval
    fetchVerificationStatus();
    
    // Check every 10 seconds for updates
    const intervalId = setInterval(fetchVerificationStatus, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, lastQueryId, response]);

  // Add a refresh function to fetch latest query status
  const refreshUserQueries = async () => {
    if (!userId) return;
    
    try {
      // Get user's queries, most recent first
      const queriesSnapshot = await queryDocuments<UserQuery>(
        "queries",
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10) // Get last 10 queries for context
      );
      
      if (!queriesSnapshot.empty) {
        // Extract all queries for context
        const queriesList = queriesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id
          };
        });
        
        // Set most recent query as current
        const latestQuery = queriesList[0];
        setLastQueryId(latestQuery.id);
        setResponse(latestQuery.answer);
        setIsVerified(latestQuery.verified || false);
        setClinicianName(latestQuery.clinicianName || null);
        
        // Store previous queries for context (excluding the most recent one)
        setPreviousQueries(queriesList.slice(1));
      }
    } catch (error) {
      console.error("Error fetching user queries:", error);
    }
  };

  // Initial load - fetch the user's most recent query and previous conversation history
  useEffect(() => {
    refreshUserQueries();
  }, [userId]);

  // Function to reset speech recognition state
  const resetSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  // Voice-to-text with improved debugging and feedback
  const startVoiceToText = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Please try using Chrome.",
        variant: "destructive",
      })
      return
    }

    // Stop any existing recognition session
    resetSpeechRecognition();

    // Initialize speech recognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition // Store reference
    
    // Configure with more feedback
    recognition.lang = 'en-US'
    recognition.interimResults = true // Get interim results for better feedback
    recognition.continuous = true     // Try continuous mode for better recognition
    recognition.maxAlternatives = 1
    
    // Add a timeout to prevent hanging
    const recognitionTimeout = setTimeout(() => {
      console.log("Recognition timeout - resetting");
      if (isRecording) {
        resetSpeechRecognition();
        toast({
          title: "Recognition timeout",
          description: "Speech recognition timed out. Please try again.",
        });
      }
    }, 10000); // 10 second timeout
    
    // Handle interim and final results
    recognition.onresult = (event: any) => {
      try {
        console.log("Speech recognition result received", event);
        
        // Result could be in different positions based on continuous mode
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update with combined transcript
        if (finalTranscript) {
          setMessage(finalTranscript);
          if (!recognition.continuous) {
            resetSpeechRecognition();
            toast({
              title: "Voice captured",
              description: "Your speech has been converted to text.",
            });
          }
        } else if (interimTranscript) {
          setMessage(interimTranscript + " (listening...)");
        }
      } catch (error) {
        console.error("Error processing speech result:", error);
      }
    }
    
    // Add more event handlers for better debugging
    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
      toast({
        title: "Listening...",
        description: "Speak now. Your words will appear as you speak.",
      });
    };
    
    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
      clearTimeout(recognitionTimeout);
    };
    
    // Handle errors with more specific feedback
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error occurred");
      
      // Log the complete event object for debugging
      console.log("Error event details:", {
        error: event.error,
        message: event.message,
        eventType: event.type,
        timeStamp: event.timeStamp,
        target: event.target
      });
      
      let errorMsg = "Could not capture voice. ";
      
      // If event.error is undefined, check for browser-specific issues
      if (!event.error) {
        const ua = navigator.userAgent.toLowerCase();
        
        if (ua.indexOf('chrome') === -1) {
          errorMsg += "Speech recognition works best in Chrome. Please try using Chrome browser.";
        } else if (ua.indexOf('android') > -1 || ua.indexOf('mobile') > -1) {
          errorMsg += "Some mobile browsers have limited speech recognition support. Try using a desktop browser.";
        } else {
          errorMsg += "Make sure your microphone is connected and you've granted permission to use it.";
        }
        
        toast({
          title: "Voice input issue",
          description: errorMsg,
          variant: "destructive",
        });
        
        // Force state reset in case of error
        setIsRecording(false);
        return;
      }
      
      switch (event.error) {
        case 'no-speech':
          errorMsg += "No speech was detected. Please try again.";
          break;
        case 'audio-capture':
          errorMsg += "Could not access microphone. Please check your device settings.";
          break;
        case 'not-allowed':
          errorMsg += "Microphone permission was denied. Please allow access in your browser settings.";
          break;
        case 'network':
          errorMsg += "Network error occurred. Please check your internet connection.";
          break;
        case 'aborted':
          errorMsg += "Speech recognition was aborted.";
          break;
        case 'language-not-supported':
          errorMsg += "The language is not supported.";
          break;
        case 'service-not-allowed':
          errorMsg += "The service is not allowed. Try reloading the page.";
          break;
        default:
          errorMsg += "Please try again or use text input instead.";
      }
      
      toast({
        title: "Voice input error",
        description: errorMsg,
        variant: "destructive",
      });
    }
    
    // Start listening
    try {
      recognition.start();
      console.log("Started speech recognition");
    } catch (error) {
      console.error("Error starting speech recognition", error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check browser permissions.",
        variant: "destructive",
      });
    }
  }

  const handleSubmit = async () => {
    if (!message.trim() || !userId) return

    try {
      setIsLoading(true)
      setResponse(null)

      // Prepare conversation history for context
      let conversationHistory = previousQueries.map(q => ({
        question: q.question,
        answer: q.answer
      }));
      
      // Include up to 5 most recent conversations for context
      conversationHistory = conversationHistory.slice(0, 5);

      // Call the API route to get AI response with conversation history
      const aiResponse = await fetch("/api/generate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: message,
          conversationHistory: conversationHistory,
          userId: userId  // Include userId in the API call
        }),
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
          timestamp: new Date().toISOString()
        })
        
        // Save the query ID for verification status updates
        setLastQueryId(queryRef.id);
        
        // Update previous queries (for future context)
        const newQuery = {
          id: queryRef.id,
          userId: userId,
          question: message,
          answer: data.response,
          verified: false,
          clinicianId: null,
          clinicianName: null,
          timestamp: new Date().toISOString()
        };
        
        setPreviousQueries([
          newQuery,
          ...previousQueries.slice(0, 8) // Keep only most recent 9 queries (+ current one = 10)
        ]);
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
      setClinicianName(null)
      setMessage("")

      toast({
        title: "Question submitted",
        description: "Your question has been submitted and answered by AI. A clinician will review it soon.",
      })
      
      // Refresh queries to update the query history
      setTimeout(() => {
        refreshUserQueries();
      }, 1000);
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
              {isVerified ? (
                <div className="flex items-center gap-1 font-medium text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified by {clinicianName || "Clinician"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 font-medium text-yellow-700">
                  <Clock className="h-4 w-4" />
                  <span>Awaiting Verification</span>
                </div>
              )}
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
          {isRecording ? (
            <Button
              type="button"
              variant="destructive"
              onClick={resetSpeechRecognition}
              className="text-base"
              size="lg"
            >
              <Mic className="mr-2 h-5 w-5 animate-pulse" />
              Stop Recording
            </Button>
          ) : (
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
          )}

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

