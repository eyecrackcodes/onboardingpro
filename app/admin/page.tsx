"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  UserPlus,
  Database,
  AlertTriangle,
  Calendar,
  FileText,
  Shield,
} from "lucide-react";
import {
  createAustinHouserTrainer,
  getCandidates,
  deleteCandidate,
  getTrainers,
  fixAustinHouserCallCenter,
} from "@/lib/firestore";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";

export default function AdminPage() {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleCreateAustinHouser = async () => {
    setCreating(true);
    setResult("");
    try {
      console.log("[Admin] Starting Austin Houser creation...");

      // First check if he already exists
      const allTrainers = await getTrainers();
      const existingAustin = allTrainers.find(
        (t) => t.name === "Austin Houser"
      );

      if (existingAustin) {
        setResult(
          `✅ Austin Houser already exists!\n\nID: ${existingAustin.id}\nCall Center: ${existingAustin.callCenter}\nActive: ${existingAustin.isActive}`
        );
        return;
      }

      console.log("[Admin] Austin Houser not found, creating...");
      const trainerId = await createAustinHouserTrainer();

      // Verify creation by fetching again
      const updatedTrainers = await getTrainers();
      const newAustin = updatedTrainers.find((t) => t.name === "Austin Houser");

      if (newAustin) {
        setResult(
          `✅ Austin Houser trainer created successfully!\n\n` +
            `ID: ${trainerId}\n` +
            `Name: ${newAustin.name}\n` +
            `Call Center: ${newAustin.callCenter}\n` +
            `Type: ${newAustin.type}\n` +
            `Active: ${newAustin.isActive}\n` +
            `Max Capacity: ${newAustin.maxCapacity}\n` +
            `Email: ${newAustin.email}\n\n` +
            `✅ Verification: Trainer can be found in getTrainers() results`
        );
      } else {
        setResult(
          `⚠️ Trainer creation returned ID ${trainerId} but trainer not found in subsequent query.\n\n` +
            `This might indicate a database sync issue.`
        );
      }
    } catch (error) {
      console.error("Error creating trainer:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      setResult(`❌ Error creating trainer: ${errorMessage}${errorStack ? `\n\nStack: ${errorStack}` : ''}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTestCandidates = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all test candidates?\n\n" +
        "This will delete candidates with names like 'Test Candidate X'.\n" +
        "Type 'DELETE TESTS' to confirm:"
    );

    if (!confirmed) return;

    const confirmText = window.prompt(
      "Please type 'DELETE TESTS' to confirm deletion of test candidates:"
    );

    if (confirmText !== "DELETE TESTS") {
      alert(
        "Deletion cancelled. You must type exactly 'DELETE TESTS' to confirm."
      );
      return;
    }

    setDeleting(true);
    setResult("");
    try {
      const candidates = await getCandidates();
      const testCandidates = candidates.filter((c) =>
        c.personalInfo.name.includes("Test Candidate")
      );

      console.log(
        `[Admin] Found ${testCandidates.length} test candidates to delete`
      );

      let deletedCount = 0;
      for (const candidate of testCandidates) {
        try {
          await deleteCandidate(candidate.id);
          deletedCount++;
          console.log(`[Admin] Deleted: ${candidate.personalInfo.name}`);
        } catch (error) {
          console.error(
            `[Admin] Failed to delete ${candidate.personalInfo.name}:`,
            error
          );
        }
      }

      setResult(
        `✅ Successfully deleted ${deletedCount} of ${testCandidates.length} test candidates`
      );
    } catch (error) {
      console.error("Error deleting test candidates:", error);
      setResult(`❌ Error deleting test candidates: ${error}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCleanOrphanedNotifications = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clean orphaned notifications?\n\n" +
        "This will delete notifications for candidates that no longer exist.\n" +
        "Type 'CLEAN NOTIFICATIONS' to confirm:"
    );

    if (!confirmed) return;

    const confirmText = window.prompt(
      "Please type 'CLEAN NOTIFICATIONS' to confirm cleanup:"
    );

    if (confirmText !== "CLEAN NOTIFICATIONS") {
      alert(
        "Cleanup cancelled. You must type exactly 'CLEAN NOTIFICATIONS' to confirm."
      );
      return;
    }

    setCleaning(true);
    setResult("");
    try {
      // Get all candidates
      const candidates = await getCandidates();
      const candidateIds = new Set(candidates.map((c) => c.id));

      // Get all notifications
      const notificationsSnapshot = await getDocs(
        collection(db, "notifications")
      );
      const allNotifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; candidateId?: string; [key: string]: any }>;

      // Find orphaned notifications
      const orphanedNotifications = allNotifications.filter(
        (notification) =>
          notification.candidateId &&
          !candidateIds.has(notification.candidateId)
      );

      console.log(
        `[Admin] Found ${orphanedNotifications.length} orphaned notifications`
      );
      setResult(
        `Found ${orphanedNotifications.length} orphaned notifications to clean...`
      );

      // Delete orphaned notifications
      let deletedCount = 0;
      for (const notification of orphanedNotifications) {
        try {
          await deleteDoc(doc(db, "notifications", notification.id));
          deletedCount++;
          console.log(
            `[Admin] Deleted orphaned notification for candidate: ${notification.candidateId}`
          );
        } catch (error) {
          console.error(
            `[Admin] Failed to delete notification ${notification.id}:`,
            error
          );
        }
      }

      setResult(
        `✅ Cleanup complete!\n` +
          `Total notifications: ${allNotifications.length}\n` +
          `Orphaned notifications: ${orphanedNotifications.length}\n` +
          `Successfully deleted: ${deletedCount}\n` +
          `Active candidates: ${candidates.length}`
      );
    } catch (error) {
      console.error("Error cleaning orphaned notifications:", error);
      setResult(`❌ Error cleaning notifications: ${error}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleDebugTrainers = async () => {
    setDebugging(true);
    setResult("");
    try {
      console.log("[Admin] Starting trainer debug...");

      // First, check if trainers collection exists at all
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      const trainersSnapshot = await getDocs(collection(db, "trainers"));
      console.log("[Admin] Raw trainers collection:", {
        empty: trainersSnapshot.empty,
        size: trainersSnapshot.size,
      });

      // Get all trainers using our function
      const allTrainers = await getTrainers();

      // Get ATX trainers specifically
      const atxTrainers = await getTrainers({
        callCenter: "ATX",
        isActive: true,
      });

      console.log("[Admin] All trainers:", allTrainers);
      console.log("[Admin] ATX trainers:", atxTrainers);

      const austinHouser = allTrainers.find((t) => t.name === "Austin Houser");

      // Also check raw documents
      const rawTrainers = trainersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; name?: string; callCenter?: string; type?: string; isActive?: boolean; [key: string]: any }>;

      setResult(
        `🔍 Trainer Debug Results:\n\n` +
          `Raw Firestore Collection:\n` +
          `- Collection exists: ${
            !trainersSnapshot.empty || trainersSnapshot.size > 0
              ? "✅ YES"
              : "❌ NO"
          }\n` +
          `- Document count: ${trainersSnapshot.size}\n\n` +
          `Processed Results:\n` +
          `- Total trainers: ${allTrainers.length}\n` +
          `- ATX active trainers: ${atxTrainers.length}\n\n` +
          `Austin Houser Search:\n` +
          `- Found via getTrainers(): ${austinHouser ? "✅ YES" : "❌ NO"}\n` +
          (austinHouser
            ? `- ID: ${austinHouser.id}\n` +
              `- Call Center: ${austinHouser.callCenter}\n` +
              `- Type: ${austinHouser.type}\n` +
              `- Active: ${austinHouser.isActive}\n` +
              `- Max Capacity: ${austinHouser.maxCapacity}\n` +
              `- Current Assignments: ${
                austinHouser.currentAssignments?.length || 0
              }\n\n`
            : "\n") +
          `Raw Documents in Collection:\n` +
          (rawTrainers.length === 0
            ? "❌ No documents found in trainers collection"
            : rawTrainers
                .map(
                  (t) =>
                    `- ${t.name || "NO NAME"} (${
                      t.callCenter || "NO CENTER"
                    }, ${t.type || "NO TYPE"}, Active: ${
                      t.isActive || "NO STATUS"
                    })`
                )
                .join("\n")) +
          `\n\n` +
          `All Processed Trainers:\n` +
          (allTrainers.length === 0
            ? "❌ No trainers returned by getTrainers()"
            : allTrainers
                .map(
                  (t) =>
                    `- ${t.name} (${t.callCenter}, ${t.type}, Active: ${t.isActive})`
                )
                .join("\n"))
      );
    } catch (error) {
      console.error("Error debugging trainers:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      setResult(
        `❌ Error debugging trainers: ${errorMessage}${errorStack ? `\n\nStack: ${errorStack}` : ''}`
      );
    } finally {
      setDebugging(false);
    }
  };

  const handleFixAustinCallCenter = async () => {
    setFixing(true);
    setResult("");
    try {
      console.log("[Admin] Fixing Austin Houser's call center...");
      const trainerId = await fixAustinHouserCallCenter();

      // Verify the fix
      const allTrainers = await getTrainers();
      const austin = allTrainers.find((t) => t.name === "Austin Houser");

      if (austin && austin.callCenter === "ATX") {
        setResult(
          `✅ Austin Houser's call center fixed successfully!\n\n` +
            `ID: ${trainerId}\n` +
            `Name: ${austin.name}\n` +
            `Call Center: ${austin.callCenter} ✅\n` +
            `Type: ${austin.type}\n` +
            `Active: ${austin.isActive}\n` +
            `Max Capacity: ${austin.maxCapacity}\n\n` +
            `✅ Austin should now appear in ATX cohort creation!`
        );
      } else {
        setResult(
          `⚠️ Fix applied but verification failed.\n` +
            `Austin found: ${austin ? "Yes" : "No"}\n` +
            `Call Center: ${austin?.callCenter || "N/A"}`
        );
      }
    } catch (error) {
      console.error("Error fixing Austin's call center:", error);
      setResult(`❌ Error fixing call center: ${error}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500">
          System administration and data management
        </p>
      </div>

      {/* Trainer Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Trainer Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium">Create Austin Houser Trainer</h3>
              <p className="text-sm text-gray-600">
                Creates Austin Houser as a trainer for Austin (ATX) location if
                he doesn&apos;t exist
              </p>
            </div>
            <Button
              onClick={handleCreateAustinHouser}
              disabled={creating}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {creating ? "Creating..." : "Create Trainer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-800">
                Delete Test Candidates
              </h3>
              <p className="text-sm text-red-600">
                Removes all candidates with &quot;Test Candidate&quot; in their name and
                associated data
              </p>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-500">
                  This action cannot be undone
                </span>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteTestCandidates}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Test Data"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <h3 className="font-medium text-yellow-800">
                Clean Orphaned Notifications
              </h3>
              <p className="text-sm text-yellow-600">
                Removes notifications for candidates that no longer exist in the
                database
              </p>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-yellow-500">
                  This will clean up background check notifications
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCleanOrphanedNotifications}
              disabled={cleaning}
              className="flex items-center gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <Database className="h-4 w-4" />
              {cleaning ? "Cleaning..." : "Clean Notifications"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Debug Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h3 className="font-medium text-blue-800">
                Debug Trainer System
              </h3>
              <p className="text-sm text-blue-600">
                Shows all trainers and checks why Austin Houser might not be
                appearing
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDebugTrainers}
              disabled={debugging}
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <UserPlus className="h-4 w-4" />
              {debugging ? "Debugging..." : "Debug Trainers"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <h3 className="font-medium text-green-800">
                Fix Austin Houser Call Center
              </h3>
              <p className="text-sm text-green-600">
                Forces Austin Houser&apos;s call center to &quot;ATX&quot; if it&apos;s not already.
                This is often needed to ensure he&apos;s included in ATX cohort
                creation.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <AlertTriangle className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-500">
                  This action cannot be undone
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleFixAustinCallCenter}
              disabled={fixing}
              className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-100"
            >
              <Database className="h-4 w-4" />
              {fixing ? "Fixing..." : "Fix Call Center"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Testing & Development Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin/generate-test-data">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Generate Test Data
              </Button>
            </Link>

            <Link href="/admin/documents">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Signed Documents
              </Button>
            </Link>

            <Link href="/admin/ssn-viewer">
              <Button variant="destructive" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                SSN Viewer (Restricted)
              </Button>
            </Link>

            <Link href="/admin/debug-env">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Debug Environment
              </Button>
            </Link>

            <Link href="/admin/ibr-test">
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                IBR API Test
              </Button>
            </Link>

            <Link href="/admin/test-pdf-coordinates">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                PDF Coordinate Tester
              </Button>
            </Link>

            <Link href="/admin/test-digitalbga-coordinates">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                DigitalBGA Coordinate Tester
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Cohort Start Dates Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cohort Start Dates Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">
                Licensed Agent (AGENT) Classes
              </h3>
              <div className="text-sm text-green-600 space-y-1">
                <p>• July 21, 2025</p>
                <p>• August 18, 2025</p>
                <p>• September 22, 2025</p>
                <p>• October 20, 2025</p>
                <p>• November 17, 2025</p>
                <p>• December 15, 2025</p>
                <p>• January 19, 2026</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Unlicensed Agent (UNL) Classes
              </h3>
              <div className="text-sm text-blue-600 space-y-1">
                <p>• August 4, 2025</p>
                <p>• September 8, 2025</p>
                <p>• October 6, 2025</p>
                <p>• November 3, 2025</p>
                <p>• December 1, 2025</p>
                <p>• January 5, 2026</p>
                <p>• February 2, 2026</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> The system automatically selects the next
              available start date based on the candidate&apos;s class type (AGENT
              for licensed, UNL for unlicensed).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-3 rounded-md overflow-auto">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
