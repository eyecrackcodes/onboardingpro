"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function IBRTestPage() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runConnectivityTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/ibr/test");
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">IBR Integration Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>API Connectivity Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will test the connection to the IBR API using test credentials
            and data.
          </p>

          <Button onClick={runConnectivityTest} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Run Connectivity Test"
            )}
          </Button>

          {testResult && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">
                      Connection Successful
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-600">
                      Connection Failed
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={testResult.success ? "default" : "destructive"}
                  >
                    {testResult.status || "N/A"} {testResult.statusText || ""}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Credentials:</span>
                  <Badge variant="secondary">
                    Username: {testResult.credentials?.username || "Not set"}
                  </Badge>
                  <Badge variant="secondary">
                    Password: {testResult.credentials?.password || "Not set"}
                  </Badge>
                </div>
              </div>

              {testResult.error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="font-medium text-red-900 mb-2">
                    Error Details:
                  </p>
                  <pre className="text-xs overflow-auto whitespace-pre-wrap text-red-800">
                    {typeof testResult.error === "string"
                      ? testResult.error
                      : JSON.stringify(testResult.error, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.response && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">
                    API Response:
                  </p>
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">
                    {testResult.response}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Test Information:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Uses IBR development API endpoint</li>
              <li>• Test SSN: 555-00-1234</li>
              <li>• Test candidate: Test User</li>
              <li>• Credentials from environment variables or defaults</li>
            </ul>
          </div>

          <div className="mt-4 bg-amber-50 p-4 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-2">Common Issues:</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>
                • <strong>401 Unauthorized:</strong> Check username/password
              </li>
              <li>
                • <strong>Network error:</strong> Check internet connection
              </li>
              <li>
                • <strong>Invalid XML:</strong> Check XML formatting
              </li>
              <li>
                • <strong>CORS error:</strong> Using API proxy routes correctly
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
