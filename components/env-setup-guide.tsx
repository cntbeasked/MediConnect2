"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react"

export function EnvSetupGuide() {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const envVarTemplate = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envVarTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="flex items-center justify-between w-full">
          <span>Environment Variables Setup Guide</span>
          {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Setting Up Environment Variables</CardTitle>
            <CardDescription>
              Follow these steps to set up the required environment variables for MediConnect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vercel">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vercel">Vercel Deployment</TabsTrigger>
                <TabsTrigger value="local">Local Development</TabsTrigger>
              </TabsList>
              <TabsContent value="vercel" className="mt-4 space-y-4">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to your Vercel project dashboard</li>
                  <li>Navigate to Settings &gt; Environment Variables</li>
                  <li>Add each of the required environment variables</li>
                  <li>Click "Save" and redeploy your application</li>
                </ol>
              </TabsContent>
              <TabsContent value="local" className="mt-4 space-y-4">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Create a <code>.env.local</code> file in the root of your project
                  </li>
                  <li>Copy the template below and replace with your actual values</li>
                  <li>Restart your development server</li>
                </ol>
                <div className="bg-muted p-4 rounded-md relative">
                  <pre className="text-sm whitespace-pre-wrap">{envVarTemplate}</pre>
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              You can obtain Firebase configuration from the Firebase Console and an OpenAI API key from your
              OpenAI account dashboard at https://platform.openai.com/api-keys.
            </p>
          </CardFooter>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}

