"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DebugEnvPage() {
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    CHARLOTTE_CALENDAR_ID: process.env.NEXT_PUBLIC_CHARLOTTE_CALENDAR_ID,
    AUSTIN_CALENDAR_ID: process.env.NEXT_PUBLIC_AUSTIN_CALENDAR_ID,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Environment Debug</h1>
        <p className="text-gray-600 mt-2">
          Check if environment variables are loaded correctly
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(envVars).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <span className="font-mono text-sm">{key}</span>
              <Badge variant={value ? "default" : "destructive"}>
                {value ? `Set (${value.length} chars)` : "Not Set"}
              </Badge>
            </div>
          ))}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If variables are not set, make sure:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-yellow-700">
              <li>
                You have created a <code>.env.local</code> file in your project
                root
              </li>
              <li>
                The file contains the correct variable names (with NEXT_PUBLIC_
                prefix)
              </li>
              <li>
                You have restarted the development server after adding the
                variables
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample .env.local Content</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
            {`# Google Calendar API Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key-here

# Calendar IDs (use 'primary' for default calendar)
NEXT_PUBLIC_CHARLOTTE_CALENDAR_ID=primary
NEXT_PUBLIC_AUSTIN_CALENDAR_ID=primary`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
