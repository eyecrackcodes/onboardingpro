"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, AlertCircle, CheckCircle } from "lucide-react";
import { RouteGuard } from "@/components/auth/AuthProvider";
import { fixUserDocumentIds } from "@/lib/firestore";

export default function FixUserIdsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFix = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      await fixUserDocumentIds();
      setResult({
        success: true,
        message: "User document IDs have been successfully fixed. Users should now be able to log in and update their roles properly."
      });
    } catch (error) {
      console.error("Error fixing user IDs:", error);
      setResult({
        success: false,
        message: `Failed to fix user document IDs: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard requiredPermission="manageSettings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Fix User Document IDs
          </h1>
          <p className="text-gray-600 mt-1">
            Repair mismatched user document IDs in Firestore
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              User Document ID Repair Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>What this tool does:</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Scans all user documents in Firestore</li>
                  <li>Identifies documents where the document ID doesn't match the user's Firebase Auth ID</li>
                  <li>Creates new documents with the correct ID</li>
                  <li>Deletes the old mismatched documents</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This operation will modify user documents in Firestore. 
                Make sure you have a backup of your data before proceeding.
              </AlertDescription>
            </Alert>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleFix}
                disabled={loading}
                size="lg"
                className="min-w-[200px]"
              >
                {loading ? "Fixing..." : "Fix User Document IDs"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why This Happens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This issue occurs when user documents are created with auto-generated IDs instead of 
              using the Firebase Auth UID. This causes a mismatch that prevents proper user role 
              updates and other operations that rely on the document ID matching the auth ID.
            </p>
            <p className="text-gray-600 mt-2">
              After running this fix, users will be able to:
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-600">
              <li>Have their roles updated properly</li>
              <li>Be found by their Firebase Auth ID</li>
              <li>Have consistent data across the system</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
} 