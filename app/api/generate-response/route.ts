import { NextResponse } from "next/server"

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || ""
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

export async function POST(request: Request) {
  try {
    // Log that the API route was called
    console.log("API route /api/generate-response called")
    
    const { query } = await request.json()
    console.log("Received query:", query)

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
    const systemPrompt = "You are a helpful medical assistant providing information to elderly patients. Use simple language and avoid technical jargon when possible."
    console.log("Created prompt for GPT-3.5 Turbo")

    try {
      // Generate response using OpenAI GPT-3.5 Turbo
      console.log("Calling OpenAI API...")
      
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 256,
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

