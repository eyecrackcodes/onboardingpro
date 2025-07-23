"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { triggerManualCheck } from "@/lib/background-check-monitor";
import { checkBackgroundStatus } from "@/lib/ibr-api";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function BackgroundCheckStatusPage() {
  const [loading, setLoading] = useState(false);
  const [ibrId, setIbrId] = useState("6453714"); // Pre-filled for easier testing
  const [statusResults, setStatusResults] = useState<any[]>([]);
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const handleManualCheck = async () => {
    setLoading(true);
    setStatusResults([]);
    setCandidateResults([]);
    setLastCheck(null);
    try {
      await triggerManualCheck();
      setLastCheck("Manual check triggered.");
    } catch (error) {
      setLastCheck(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleCheck = async () => {
    if (!ibrId.trim()) {
      alert("Please enter an IBR ID");
      return;
    }

    setLoading(true);
    setStatusResults([]);
    setCandidateResults([]);
    setLastCheck(null);
    try {
      const statusResults = await checkBackgroundStatus([ibrId.trim()]);
      setStatusResults(statusResults);
      setLastCheck(`Results for IBR ID: ${ibrId}`);
    } catch (error) {
      setLastCheck(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCandidateInDb = async () => {
    if (!ibrId.trim()) {
      alert("Please enter an IBR ID");
      return;
    }

    setLoading(true);
    setStatusResults([]);
    setCandidateResults([]);
    setLastCheck(null);
    try {
      const candidatesRef = collection(db, "candidates");
      const q = query(
        candidatesRef,
        where("backgroundCheck.ibrId", "==", ibrId.trim())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setLastCheck(`❌ No candidate found with IBR ID: ${ibrId}`);
      } else {
        snapshot.forEach((doc) => {
          const candidate = doc.data();
          setCandidateResults((prev) => [...prev, candidate]);
          setLastCheck(`✅ Found candidate: ${candidate.personalInfo.name}`);
        });
      }
    } catch (error) {
      setLastCheck(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Background Check Status Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manual Status Check (All Pending)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This will check all candidates with pending background checks and
            update their status.
          </p>
          <Button onClick={handleManualCheck} disabled={loading}>
            {loading ? "Checking..." : "Run Manual Check"}
          </Button>
          {lastCheck && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              )}
              {lastCheck}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Single IBR ID Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ibrId">IBR ID</Label>
            <Input
              id="ibrId"
              value={ibrId}
              onChange={(e) => setIbrId(e.target.value)}
              placeholder="Enter IBR ID (e.g., 1234567)"
            />
          </div>
          <Button onClick={handleSingleCheck} disabled={loading}>
            {loading ? "Checking..." : "Check Status"}
          </Button>
          {lastCheck && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              )}
              {lastCheck}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check Candidate in Database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ibrId2">IBR ID</Label>
            <Input
              id="ibrId2"
              value={ibrId}
              onChange={(e) => setIbrId(e.target.value)}
              placeholder="Enter IBR ID (e.g., 6453714)"
            />
          </div>
          <Button onClick={handleCheckCandidateInDb} disabled={loading}>
            {loading ? "Checking..." : "Check in Firestore"}
          </Button>
          {lastCheck && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              )}
              {lastCheck}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  Status Results
                </h3>
                <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                  {JSON.stringify(statusResults, null, 2)}
                </pre>
              </div>
            )}
            {candidateResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Candidate Results
                </h3>
                <div className="space-y-2">
                  {candidateResults.map((candidate, index) => (
                    <div
                      key={index}
                      className="bg-green-50 p-3 rounded-md text-sm font-mono"
                    >
                      <p>
                        <strong>Name:</strong> {candidate.personalInfo.name}
                      </p>
                      <p>
                        <strong>IBR ID:</strong>{" "}
                        {candidate.backgroundCheck.ibrId}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {candidate.backgroundCheck.status}
                      </p>
                      <p>
                        <strong>Initiated:</strong>{" "}
                        {candidate.backgroundCheck.initiated}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
