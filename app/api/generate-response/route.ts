import { NextResponse } from "next/server"
import { addDocument } from "@/lib/firestore-helpers"

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || ""
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

export async function POST(request: Request) {
  try {
    // Log that the API route was called
    console.log("API route /api/generate-response called")
    
    const requestData = await request.json()
    const { query, conversationHistory = [], userId } = requestData
    
    console.log("Received query:", query)
    console.log("Conversation history length:", conversationHistory.length)

    if (!query) {
      console.error("Missing query parameter")
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    // Log the API key (first few characters for security)
    const apiKeyPrefix = OPENAI_API_KEY?.substring(0, 5) + "..."
    console.log("Using OpenAI API with key prefix:", apiKeyPrefix)

    // Create a medical context prompt
    const systemPrompt = "You are a helpful medical assistant providing information to elderly patients. Use simple language and avoid technical jargon when possible. Your answers should be accurate and helpful. When appropriate, reference previous parts of the conversation to provide continuity and context."
    console.log("Created prompt for GPT-3.5 Turbo")

    try {
      // Prepare message array with conversation history
      const messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ]
      
      // Add conversation history (up to 5 previous exchanges)
      if (conversationHistory && conversationHistory.length > 0) {
        // Add up to 5 previous exchanges for context
        const recentHistory = conversationHistory.slice(0, 5)
        
        for (const exchange of recentHistory) {
          messages.push({
            role: "user",
            content: exchange.question
          })
          
          messages.push({
            role: "assistant", 
            content: exchange.answer
          })
        }
      }
      
      // Add the current query
      messages.push({
        role: "user",
        content: query
      })
      
      // Generate response using OpenAI GPT-3.5 Turbo
      console.log("Calling OpenAI API with conversation context...")
      
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          max_tokens: 500, // Increased token limit for more comprehensive answers
          temperature: 0.2,
        })
      });
      
      // Check if the API call was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenAI API error status:", response.status, errorData);
        
        if (response.status === 401) {
          return NextResponse.json({ 
            error: "Authentication error with OpenAI API. Please check your API key."
          }, { status: 500 });
        } else if (response.status === 429) {
          return NextResponse.json({ 
            error: "Rate limit exceeded with OpenAI API. Please try again later."
          }, { status: 500 });
        } else {
          return NextResponse.json({ 
            error: `OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`,
            details: JSON.stringify(errorData)
          }, { status: 500 });
        }
      }

      // Parse the response
      const data = await response.json();
      console.log("OpenAI API call successful");
      
      // Extract the response
      const aiResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      console.log("Generated response:", aiResponse?.substring(0, 50) + "...");

      // Create a timestamp for the query
      const currentTimestamp = new Date().toISOString();
      console.log("Created timestamp:", currentTimestamp);
      
      // Always store the query in Firestore regardless if userId is provided
      // This ensures all questions are saved for doctor verification
      try {
        // Define query document with proper typing
        const queryDocument: {
          question: string;
          answer: string;
          verified: boolean;
          clinicianId: null;
          clinicianName: null;
          rating: null;
          timestamp: string;
          userId?: string; // Make userId optional
        } = {
          question: query,
          answer: aiResponse,
          verified: false,
          clinicianId: null,
          clinicianName: null,
          rating: null,
          timestamp: currentTimestamp,
        };
        
        // Add userId if provided
        if (userId) {
          console.log("Adding userId to query:", userId);
          queryDocument.userId = userId;
        } else {
          console.log("No userId provided, saving as anonymous query");
        }
        
        console.log("Storing query in Firestore:", queryDocument);
        const queryRef = await addDocument("queries", queryDocument);
        console.log("Successfully stored query with ID:", queryRef.id);
      } catch (firestoreError: any) {
        console.error("Firestore error:", firestoreError);
        // Continue and return the response even if storage fails
        console.log("Continuing despite Firestore error to provide response to user");
      }

      return NextResponse.json({ response: aiResponse });
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      
      return NextResponse.json({ 
        error: "OpenAI API error: " + apiError.message,
        details: apiError.toString()
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("General error in API route:", error);
    return NextResponse.json({ 
      error: "Failed to generate response: " + error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

