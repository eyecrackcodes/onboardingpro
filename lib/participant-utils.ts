// Participant Management Utilities
// Consolidated logic for participant eligibility, workflow management, and progress tracking

import type { Candidate, Cohort, CohortParticipantProgress } from "./types";

// Centralized eligibility checking logic
export const checkParticipantEligibility = (
  candidate: Candidate,
  cohort: Cohort
): {
  isEligible: boolean;
  reasons: string[];
} => {
  const reasons: string[] = [];

  // Basic requirements
  if (candidate.callCenter !== cohort.callCenter) {
    reasons.push(
      `Call center mismatch: candidate is ${candidate.callCenter}, cohort requires ${cohort.callCenter}`
    );
  }

  if (candidate.status !== "Active") {
    reasons.push(`Candidate status is ${candidate.status}, must be Active`);
  }

  if (candidate.backgroundCheck.status !== "Completed") {
    reasons.push(
      `Background check status is ${candidate.backgroundCheck.status}, must be Completed`
    );
  }

  // Already in this cohort
  if (cohort.participants.includes(candidate.id)) {
    reasons.push("Candidate is already a participant in this cohort");
  }

  // Already confirmed for another cohort
  if (
    candidate.classAssignment?.startDate &&
    candidate.classAssignment?.startConfirmed
  ) {
    const assignedDate =
      candidate.classAssignment.startDate instanceof Date
        ? candidate.classAssignment.startDate
        : new Date(candidate.classAssignment.startDate);

    if (assignedDate.getTime() !== cohort.startDate.getTime()) {
      reasons.push(
        `Candidate is already confirmed for a different cohort starting ${assignedDate.toDateString()}`
      );
    }
  }

  // Class type specific requirements
  if (cohort.classType === "UNL") {
    if (candidate.licenseStatus !== "Unlicensed") {
      reasons.push(
        `Class type is UNL but candidate license status is ${candidate.licenseStatus}`
      );
    }
    if (!candidate.offers.preLicenseOffer.signed) {
      reasons.push("Pre-license offer must be signed for UNL class");
    }
  } else if (cohort.classType === "AGENT") {
    if (candidate.licenseStatus !== "Licensed") {
      reasons.push(
        `Class type is AGENT but candidate license status is ${candidate.licenseStatus}`
      );
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
};

// Calculate participant progress percentage based on current stage
export const calculateParticipantProgress = (
  currentStage: Cohort["currentStage"],
  stageProgress: CohortParticipantProgress["stageProgress"]
): number => {
  const allStages = [
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

  const currentStageIndex = allStages.indexOf(currentStage);
  if (currentStageIndex === -1) return 0;

  // Count completed stages
  let completedStages = 0;
  for (const stage of allStages.slice(0, currentStageIndex + 1)) {
    if (stageProgress[stage]?.status === "completed") {
      completedStages++;
    }
  }

  // If current stage is in progress, add partial credit
  if (stageProgress[currentStage]?.status === "in_progress") {
    completedStages += 0.5;
  }

  return Math.round((completedStages / allStages.length) * 100);
};

// Determine if participant is on track based on cohort timeline and individual progress
export const isParticipantOnTrack = (
  cohort: Cohort,
  participantProgress: CohortParticipantProgress
): boolean => {
  const today = new Date();
  const cohortStartDate =
    cohort.startDate instanceof Date
      ? cohort.startDate
      : new Date(cohort.startDate);
  const daysInCohort = Math.floor(
    (today.getTime() - cohortStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If cohort hasn't started yet, everyone is on track
  if (daysInCohort < 0) return true;

  // Expected progress based on time elapsed (assuming 9 weeks = 63 days)
  const expectedProgress = Math.min(100, (daysInCohort / 63) * 100);

  // Participant is on track if their progress is within 10% of expected
  return participantProgress.overallProgress >= expectedProgress - 10;
};

// Get stage display name for UI
export const getStageDisplayName = (stage: Cohort["currentStage"]): string => {
  const stageNames: Record<Cohort["currentStage"], string> = {
    START: "Orientation",
    WK_1: "Week 1 - Foundations",
    WK_2: "Week 2 - Products",
    WK_3_CSR: "Week 3 - CSR Training",
    WK_4_CSR: "Week 4 - CSR Training",
    WK_5_CSR: "Week 5 - CSR Training",
    WK_6_CSR: "Week 6 - CSR Training",
    WK_7_A_BAY: "Week 7 - A-Bay",
    WK_8_A_BAY: "Week 8 - A-Bay",
    WK_9_TEAM: "Week 9 - Team Assignment",
    COMPLETED: "Graduated",
  };

  return stageNames[stage] || stage;
};

// Generate participant milestone suggestions based on current stage
export const getParticipantMilestoneSuggestions = (
  currentStage: Cohort["currentStage"]
): Array<{ title: string; description: string; dueDate?: Date }> => {
  const suggestions: Record<
    Cohort["currentStage"],
    Array<{ title: string; description: string; dueDate?: Date }>
  > = {
    START: [
      {
        title: "Complete Orientation",
        description:
          "Attend orientation session and complete initial paperwork",
      },
      {
        title: "Set Up Workstation",
        description: "Receive equipment and set up workstation",
      },
      {
        title: "Meet Trainer",
        description: "Initial meeting with assigned trainer",
      },
    ],
    WK_1: [
      {
        title: "Complete Foundation Modules",
        description: "Finish all week 1 training modules",
      },
      {
        title: "First Assessment",
        description: "Complete week 1 knowledge assessment",
      },
    ],
    WK_2: [
      {
        title: "Product Knowledge Test",
        description: "Pass product knowledge assessment",
      },
      {
        title: "Shadow Experienced Agent",
        description: "Complete shadowing requirements",
      },
    ],
    WK_3_CSR: [
      {
        title: "CSR System Training",
        description: "Complete customer service system training",
      },
      {
        title: "Phone Handling Practice",
        description: "Practice phone handling techniques",
      },
    ],
    WK_4_CSR: [
      {
        title: "Customer Interaction Training",
        description: "Complete customer interaction modules",
      },
      { title: "CSR Assessment", description: "Pass CSR knowledge assessment" },
    ],
    WK_5_CSR: [
      {
        title: "Advanced CSR Skills",
        description: "Complete advanced CSR training modules",
      },
      {
        title: "Practice Customer Scenarios",
        description: "Handle practice customer scenarios",
      },
    ],
    WK_6_CSR: [
      { title: "CSR Certification", description: "Achieve CSR certification" },
      {
        title: "Prepare for A-Bay",
        description: "Complete A-Bay preparation modules",
      },
    ],
    WK_7_A_BAY: [
      {
        title: "A-Bay Orientation",
        description: "Complete A-Bay orientation and setup",
      },
      {
        title: "Live Call Practice",
        description: "Begin supervised live call practice",
      },
    ],
    WK_8_A_BAY: [
      {
        title: "Independent Calls",
        description: "Handle calls independently with minimal supervision",
      },
      {
        title: "A-Bay Assessment",
        description: "Pass A-Bay performance assessment",
      },
    ],
    WK_9_TEAM: [
      {
        title: "Team Assignment",
        description: "Receive final team assignment",
      },
      {
        title: "Final Evaluation",
        description: "Complete final training evaluation",
      },
    ],
    COMPLETED: [
      {
        title: "Graduation Certificate",
        description: "Receive training completion certificate",
      },
      {
        title: "Begin Production",
        description: "Start in assigned production team",
      },
    ],
  };

  return suggestions[currentStage] || [];
};

// Filter candidates for bulk operations
export const filterCandidatesForBulkActions = (
  candidates: Candidate[],
  filters: {
    callCenter?: "CLT" | "ATX";
    licenseStatus?: "Licensed" | "Unlicensed";
    readyForClass?: boolean;
    unassigned?: boolean;
  }
): Candidate[] => {
  return candidates.filter((candidate) => {
    if (filters.callCenter && candidate.callCenter !== filters.callCenter) {
      return false;
    }

    if (
      filters.licenseStatus &&
      candidate.licenseStatus !== filters.licenseStatus
    ) {
      return false;
    }

    if (filters.readyForClass) {
      const hasCompletedBackground =
        candidate.backgroundCheck.status === "Completed";
      const hasSignedOffer =
        filters.licenseStatus === "Unlicensed"
          ? candidate.offers.preLicenseOffer.signed
          : candidate.offers.fullAgentOffer.signed;

      if (!hasCompletedBackground || !hasSignedOffer) {
        return false;
      }
    }

    if (filters.unassigned) {
      const hasClassAssignment =
        candidate.classAssignment?.startDate &&
        candidate.classAssignment?.startConfirmed;
      if (hasClassAssignment) {
        return false;
      }
    }

    return true;
  });
};

// Validate cohort participant requirements
export const validateCohortParticipants = (
  cohort: Cohort,
  participants: Candidate[]
): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} => {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check if all participants meet requirements
  participants.forEach((participant) => {
    const eligibility = checkParticipantEligibility(participant, cohort);
    if (!eligibility.isEligible) {
      issues.push(
        `${participant.personalInfo.name}: ${eligibility.reasons.join(", ")}`
      );
    }
  });

  // Check for capacity concerns
  if (participants.length === 0) {
    warnings.push("Cohort has no participants assigned");
  } else if (participants.length > 20) {
    warnings.push(
      `Large cohort size (${participants.length} participants) may affect training quality`
    );
  }

  // Check for license type mix
  const licensedCount = participants.filter(
    (p) => p.licenseStatus === "Licensed"
  ).length;
  const unlicensedCount = participants.filter(
    (p) => p.licenseStatus === "Unlicensed"
  ).length;

  if (licensedCount > 0 && unlicensedCount > 0) {
    warnings.push(
      "Mixed license types in cohort - consider separating licensed and unlicensed agents"
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
};
