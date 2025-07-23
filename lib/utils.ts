import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Candidate } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Status color utilities
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    Active: "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    Dropped: "bg-red-100 text-red-800",
    "On Hold": "bg-yellow-100 text-yellow-800",
    Pending: "bg-gray-100 text-gray-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Failed: "bg-red-100 text-red-800",
  };
  return statusColors[status] || "bg-gray-200 text-gray-800";
}

// Pipeline stage utilities
export const getPipelineStages = (candidate: Candidate) => {
  const stageNames = [
    "I-9 Verify",
    "Interview",
    "Offer Sent",
    "BG Check",
    "Licensing",
    "Ready",
  ];

  const stages = stageNames.map((name) => ({
    name,
    completed: false,
    current: false,
  }));

  // I-9 Verification (first step)
  const i9Status = (candidate as any).i9Status;
  if (i9Status === "completed") {
    stages[0].completed = true;
  }

  // Interview
  if (candidate.interview?.status === "Completed") {
    stages[1].completed = true;
  }

  // Offer Sent (can only happen after I-9 is complete)
  const offerStatus = (candidate as any).offerStatus;
  if (offerStatus === "sent" || offerStatus === "signed") {
    stages[2].completed = true;
  }

  // Background Check
  if (candidate.backgroundCheck?.status === "Completed") {
    stages[3].completed = true;
  }

  // Licensing
  if (candidate.licenseStatus === "Licensed") {
    stages[4].completed = true;
  }

  // Ready
  if (candidate.readyToGo) {
    stages[5].completed = true;
  }

  // Find the first non-completed stage and mark it as current
  const currentStageIndex = stages.findIndex((stage) => !stage.completed);

  if (currentStageIndex !== -1) {
    stages[currentStageIndex].current = true;
  } else {
    // If all stages are completed, mark the last one as current
    stages[stages.length - 1].current = true;
  }

  return stages;
};

// Cohort progress utilities
export function getCohortProgress(currentStage: string): number {
  const stages = [
    "START",
    "WK_1",
    "WK_2",
    "WK_3_CSR",
    "WK_4_CSR",
    "WK_5_CSR",
    "WK_6_CSR",
    "WK_7_A_BAY",
    "WK_8_A_BAY",
    "WK_9_TEAM",
    "COMPLETED",
  ];

  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (stages.length - 1)) * 100);
}

export function getStageDisplayName(stage: string): string {
  const stageNames: Record<string, string> = {
    START: "Starting",
    WK_1: "Week 1",
    WK_2: "Week 2",
    WK_3_CSR: "Week 3 - CSR",
    WK_4_CSR: "Week 4 - CSR",
    WK_5_CSR: "Week 5 - CSR",
    WK_6_CSR: "Week 6 - CSR",
    WK_7_A_BAY: "Week 7 - A-Bay",
    WK_8_A_BAY: "Week 8 - A-Bay",
    WK_9_TEAM: "Week 9 - Team",
    COMPLETED: "Completed",
  };

  return stageNames[stage] || stage;
}

export function formatPhoneNumber(phoneNumberString: string) {
  const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
  // ... existing code ...
}
