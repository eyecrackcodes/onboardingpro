"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Users } from "lucide-react";
import { generateInterviewTestCandidates } from "@/lib/sampleData";

export default function GenerateTestDataPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTestCandidates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await generateInterviewTestCandidates();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate test data"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Generate Test Data</h1>
        <p className="text-gray-500">
          Create test candidates for interview workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Test Candidates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create 3 test candidates in different interview states:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Sarah Johnson - Ready for interview scheduling</li>
            <li>Michael Chen - Interview scheduled for 2 days from now</li>
            <li>Emily Rodriguez - Interview currently in progress</li>
          </ul>

          <div className="pt-4">
            <Button
              onClick={handleGenerateTestCandidates}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Generate Test Candidates
                </>
              )}
            </Button>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>Test candidates created successfully!</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After generating test candidates, go to the{" "}
          <a href="/managers" className="underline font-medium">
            Interview Management
          </a>{" "}
          page to see them in different tabs based on their interview status.
        </p>
      </div>
    </div>
  );
}
