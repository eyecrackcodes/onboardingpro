import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { checkBackgroundStatus } from "./ibr-api";
import type { Candidate } from "./types";

// Check interval - 5 minutes in milliseconds
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Status change events that should trigger notifications
const NOTIFICATION_EVENTS = {
  "In Progress": "Background check has started processing",
  Completed: "Background check has been completed",
  Failed: "Background check has failed or requires attention",
  Review: "Background check requires manual review",
};

interface BackgroundCheckUpdate {
  candidateId: string;
  candidateName: string;
  previousStatus: string;
  newStatus: string;
  ibrId: string;
  timestamp: Date;
  message: string;
}

// Store for monitoring intervals (to prevent duplicates)
const monitoringIntervals = new Map<string, NodeJS.Timeout>();

export async function startBackgroundCheckMonitoring() {
  console.log("[BackgroundCheckMonitor] Starting monitoring service...");

  // Check all pending background checks immediately
  await checkPendingBackgroundChecks();

  // Set up periodic checking every hour
  const intervalId = setInterval(async () => {
    await checkPendingBackgroundChecks();
  }, CHECK_INTERVAL);

  // Store the interval ID
  monitoringIntervals.set("main", intervalId);

  console.log(
    "[BackgroundCheckMonitor] Monitoring service started - checking every hour"
  );
}

export function stopBackgroundCheckMonitoring() {
  console.log("[BackgroundCheckMonitor] Stopping monitoring service...");

  // Clear all intervals
  monitoringIntervals.forEach((intervalId) => {
    clearInterval(intervalId);
  });
  monitoringIntervals.clear();

  console.log("[BackgroundCheckMonitor] Monitoring service stopped");
}

async function checkPendingBackgroundChecks() {
  console.log("[BackgroundCheckMonitor] Checking pending background checks...");

  try {
    // Query for candidates with initiated background checks that aren't completed
    const candidatesRef = collection(db, "candidates");
    const q = query(
      candidatesRef,
      where("backgroundCheck.initiated", "==", true),
      // Temporarily check ALL statuses to debug
      where("backgroundCheck.ibrId", "!=", null)
    );

    console.log(
      "[BackgroundCheckMonitor] DEBUG: Checking ALL candidates with IBR IDs (not just pending)"
    );

    const snapshot = await getDocs(q);
    const pendingChecks: { candidate: Candidate; docId: string }[] = [];

    snapshot.forEach((doc) => {
      const candidate = { id: doc.id, ...doc.data() } as Candidate;
      console.log(
        `[BackgroundCheckMonitor] Found candidate ${candidate.personalInfo.name} with status ${candidate.backgroundCheck.status}, IBR ID: ${candidate.backgroundCheck?.ibrId}`
      );

      if (candidate.backgroundCheck?.ibrId) {
        // Only add to pending if status suggests it needs checking
        const needsCheck = !["Completed", "Failed"].includes(
          candidate.backgroundCheck.status
        );

        if (needsCheck) {
          console.log(
            `  ✅ Adding to pending checks: ${candidate.backgroundCheck.ibrId}`
          );
          pendingChecks.push({ candidate, docId: doc.id });
        } else {
          console.log(
            `  ⏭️  Skipping (status: ${candidate.backgroundCheck.status}): ${candidate.backgroundCheck.ibrId}`
          );
        }
      } else {
        console.log(`  ❌ No IBR ID found for ${candidate.personalInfo.name}`);
      }
    });

    // Log all IBR IDs that will be checked
    const allIbrIds = pendingChecks.map(
      (check) => check.candidate.backgroundCheck.ibrId
    );
    console.log(
      `[BackgroundCheckMonitor] All IBR IDs to be checked:`,
      allIbrIds
    );

    console.log(
      `[BackgroundCheckMonitor] Found ${pendingChecks.length} pending background checks`
    );

    if (pendingChecks.length === 0) {
      console.log("[BackgroundCheckMonitor] No pending checks found, exiting");
      return;
    }

    // Get all IBR IDs to check
    const ibrIds = pendingChecks.map(
      (check) => check.candidate.backgroundCheck.ibrId!
    );

    console.log("[BackgroundCheckMonitor] IBR IDs to check:", ibrIds);
    // Check status with IBR
    const statusResults = await checkBackgroundStatus(ibrIds);
    console.log(
      "[BackgroundCheckMonitor] Status results from IBR:",
      statusResults
    );

    // Process each status update
    const updates: BackgroundCheckUpdate[] = [];

    for (const statusResult of statusResults) {
      const pendingCheck = pendingChecks.find(
        (check) => check.candidate.backgroundCheck.ibrId === statusResult.id
      );

      if (!pendingCheck) continue;

      const { candidate, docId } = pendingCheck;
      const previousStatus = candidate.backgroundCheck.status;
      const newStatus = mapIBRStatusToAppStatus(statusResult.status);

      console.log(
        `[BackgroundCheckMonitor] Processing ${candidate.personalInfo.name}:`
      );
      console.log(`  IBR ID: ${statusResult.id}`);
      console.log(`  Previous status: ${previousStatus}`);
      console.log(`  IBR status: ${statusResult.status}`);
      console.log(`  Mapped status: ${newStatus}`);
      console.log(`  Status result object:`, statusResult);

      // Check if status has changed
      if (previousStatus !== newStatus) {
        console.log(
          `[BackgroundCheckMonitor] Status change detected for ${candidate.personalInfo.name}: ${previousStatus} -> ${newStatus}`
        );

        // Update the candidate's background check status
        const candidateRef = doc(db, "candidates", docId);
        const updateData: any = {
          "backgroundCheck.status": newStatus,
          "backgroundCheck.lastCheckedAt": serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Store extended statuses & report url
        if (statusResult.extended) {
          updateData["backgroundCheck.extendedStatuses"] =
            statusResult.extended;
        }
        if (statusResult.reportUrl) {
          updateData["backgroundCheck.reportUrl"] = statusResult.reportUrl;
        }
        if (statusResult.timestamps) {
          updateData["backgroundCheck.timestamps"] = statusResult.timestamps;
        }

        // Determine pass boolean: Completed with Fail status should be false, Pass true
        if (statusResult.extended) {
          // If we got explicit Fail extended statuses treat as failed
          const hasFail = Object.values(statusResult.extended || {}).includes(
            "Fail"
          );
          const hasReview = Object.values(statusResult.extended || {}).includes(
            "Review"
          );

          // Only mark as passed if no fails and no reviews (or if overall status is explicitly Pass)
          updateData["backgroundCheck.passed"] =
            statusResult.status === "Pass" && !hasFail;

          if (hasFail || statusResult.status === "Fail") {
            updateData["backgroundCheck.failedAt"] = serverTimestamp();
          } else if (statusResult.status === "Pass" && !hasFail) {
            updateData["backgroundCheck.passedAt"] = serverTimestamp();
          }
        } else if (newStatus === "Failed") {
          updateData["backgroundCheck.passed"] = false;
          updateData["backgroundCheck.failedAt"] = serverTimestamp();
        } else if (newStatus === "Completed") {
          updateData["backgroundCheck.passed"] = statusResult.status === "Pass";
          if (statusResult.status === "Pass") {
            updateData["backgroundCheck.passedAt"] = serverTimestamp();
          } else {
            updateData["backgroundCheck.failedAt"] = serverTimestamp();
          }
        }

        await updateDoc(candidateRef, updateData);

        // Create notification record
        updates.push({
          candidateId: candidate.id,
          candidateName: candidate.personalInfo.name,
          previousStatus,
          newStatus,
          ibrId: statusResult.id,
          timestamp: new Date(),
          message:
            NOTIFICATION_EVENTS[
              newStatus as keyof typeof NOTIFICATION_EVENTS
            ] || `Status changed to ${newStatus}`,
        });
      }
    }

    // Send notifications for all updates
    if (updates.length > 0) {
      await sendNotifications(updates);
    }

    console.log(
      `[BackgroundCheckMonitor] Check completed. ${updates.length} status changes found.`
    );
  } catch (error) {
    console.error(
      "[BackgroundCheckMonitor] Error checking background statuses:",
      error
    );
  }
}

// Map IBR status to our app status
function mapIBRStatusToAppStatus(ibrStatus: string): string {
  const statusMap: Record<string, string> = {
    Pending: "In Progress",
    Processing: "In Progress",
    Complete: "Completed",
    Completed: "Completed",
    Pass: "Completed",
    Passed: "Completed",
    Failed: "Failed",
    Fail: "Failed",
    Review: "Review",
    "Review Required": "Review",
    Cancelled: "Failed",
    // Case variations
    pending: "In Progress",
    processing: "In Progress",
    complete: "Completed",
    completed: "Completed",
    pass: "Completed",
    passed: "Completed",
    failed: "Failed",
    fail: "Failed",
    review: "Review",
    cancelled: "Failed",
  };

  // Try exact match first, then case-insensitive
  const mapped = statusMap[ibrStatus] || statusMap[ibrStatus.toLowerCase()];
  console.log(
    `[BackgroundCheckMonitor] Mapping "${ibrStatus}" -> "${
      mapped || ibrStatus
    }"`
  );
  return mapped || ibrStatus;
}

// Send notifications (this can be extended to send emails, SMS, etc.)
async function sendNotifications(updates: BackgroundCheckUpdate[]) {
  console.log(
    "[BackgroundCheckMonitor] Sending notifications for status updates..."
  );

  // For now, we'll store notifications in Firestore
  // In production, this could send emails, SMS, push notifications, etc.

  try {
    const notificationsRef = collection(db, "notifications");

    for (const update of updates) {
      await addDoc(notificationsRef, {
        type: "background_check_update",
        candidateId: update.candidateId,
        candidateName: update.candidateName,
        previousStatus: update.previousStatus,
        newStatus: update.newStatus,
        ibrId: update.ibrId,
        message: update.message,
        read: false,
        createdAt: serverTimestamp(),
        // Add recipient info - this could be dynamic based on roles
        recipientRole: "recruiter",
        priority: update.newStatus === "Failed" ? "high" : "normal",
      });

      console.log(
        `[BackgroundCheckMonitor] Notification created for ${update.candidateName}: ${update.message}`
      );
    }
  } catch (error) {
    console.error(
      "[BackgroundCheckMonitor] Error sending notifications:",
      error
    );
  }
}

// Monitor a specific candidate (can be called when a new check is initiated)
export async function monitorCandidate(candidateId: string, ibrId: string) {
  console.log(
    `[BackgroundCheckMonitor] Starting monitoring for candidate ${candidateId} (IBR: ${ibrId})`
  );

  // Check immediately
  await checkSpecificCandidate(candidateId, ibrId);

  // Then check every hour
  const intervalId = setInterval(async () => {
    await checkSpecificCandidate(candidateId, ibrId);
  }, CHECK_INTERVAL);

  // Store the interval ID
  monitoringIntervals.set(candidateId, intervalId);
}

async function checkSpecificCandidate(candidateId: string, ibrId: string) {
  try {
    const candidateRef = doc(db, "candidates", candidateId);
    const candidateSnap = await getDoc(candidateRef);

    if (!candidateSnap.exists()) {
      console.log(
        `[BackgroundCheckMonitor] Candidate ${candidateId} not found, stopping monitoring`
      );
      stopMonitoringCandidate(candidateId);
      return;
    }

    const candidate = {
      id: candidateSnap.id,
      ...candidateSnap.data(),
    } as Candidate;

    // If check is already completed or failed, stop monitoring
    if (
      ["Completed", "Failed", "Passed"].includes(
        candidate.backgroundCheck?.status || ""
      )
    ) {
      console.log(
        `[BackgroundCheckMonitor] Candidate ${candidateId} check is ${candidate.backgroundCheck.status}, stopping monitoring`
      );
      stopMonitoringCandidate(candidateId);
      return;
    }

    // Check status
    const [statusResult] = await checkBackgroundStatus([ibrId]);

    if (statusResult) {
      const previousStatus = candidate.backgroundCheck.status;
      const newStatus = mapIBRStatusToAppStatus(statusResult.status);

      if (previousStatus !== newStatus) {
        // Status changed - update will be handled by the main check
        console.log(
          `[BackgroundCheckMonitor] Status change detected for ${candidate.personalInfo.name}: ${previousStatus} -> ${newStatus}`
        );
      }
    }
  } catch (error) {
    console.error(
      `[BackgroundCheckMonitor] Error checking candidate ${candidateId}:`,
      error
    );
  }
}

export function stopMonitoringCandidate(candidateId: string) {
  const intervalId = monitoringIntervals.get(candidateId);
  if (intervalId) {
    clearInterval(intervalId);
    monitoringIntervals.delete(candidateId);
    console.log(
      `[BackgroundCheckMonitor] Stopped monitoring candidate ${candidateId}`
    );
  }
}

// Export function to manually trigger a check
export async function triggerManualCheck() {
  console.log("[BackgroundCheckMonitor] Manual check triggered");
  await checkPendingBackgroundChecks();
}

// Import this if needed
import { addDoc, getDoc } from "firebase/firestore";
