import { createCandidate, createCohort, createTrainer } from "./firestore";
import type { Candidate, Cohort, Trainer } from "./types";

// Sample candidate data generator
export const createSampleCandidate = (
  index: number
): Omit<Candidate, "id" | "createdAt" | "updatedAt"> => {
  const isLicensed = Math.random() > 0.5;
  const bgCheckStatus = ["Pending", "In Progress", "Completed"][
    Math.floor(Math.random() * 3)
  ] as any;

  const interviewStatus = [
    "Not Started",
    "Scheduled",
    "In Progress",
    "Completed",
  ][Math.floor(Math.random() * 4)] as any;
  const interviewPassed =
    interviewStatus === "Completed" ? Math.random() > 0.2 : undefined;

  return {
    personalInfo: {
      name: `Test Candidate ${index}`,
      email: `candidate${index}@example.com`,
      phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(
        Math.floor(Math.random() * 9000) + 1000
      )}`,
      location: `City ${(index % 5) + 1}, State`,
    },
    licenseStatus: isLicensed ? "Licensed" : "Unlicensed",
    interview: {
      status: interviewStatus,
      result:
        interviewStatus === "Completed"
          ? interviewPassed
            ? "Passed"
            : "Failed"
          : undefined,
      scheduledDate:
        interviewStatus === "Scheduled"
          ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
          : undefined,
      completedDate:
        interviewStatus === "Completed"
          ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
          : undefined,
      evaluations:
        interviewStatus === "Completed"
          ? [
              {
                id: `eval-${index}-1`,
                managerId: `manager-${index}`,
                managerName: `Manager ${index}`,
                managerEmail: `manager${index}@example.com`,
                evaluationDate: new Date(
                  Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
                ),
                scores: {
                  communication: Math.floor(Math.random() * 3) + 3,
                  technicalSkills: Math.floor(Math.random() * 3) + 3,
                  customerService: Math.floor(Math.random() * 3) + 3,
                  problemSolving: Math.floor(Math.random() * 3) + 3,
                  cultureFit: Math.floor(Math.random() * 3) + 3,
                },
                averageScore: 4,
                notes: "Sample evaluation notes",
                recommendation: interviewPassed
                  ? "Recommend"
                  : "Do Not Recommend",
                strengths: "Good communication skills",
                concerns: interviewPassed
                  ? ""
                  : "Needs improvement in technical areas",
              },
            ]
          : [],
      compositeScore: interviewStatus === "Completed" ? 4 : undefined,
    },
    backgroundCheck: {
      initiated: bgCheckStatus !== "Pending",
      status: bgCheckStatus,
      passedAt:
        bgCheckStatus === "Completed"
          ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          : undefined,
      notes: "",
    },
    offers: {
      preLicenseOffer: {
        sent: bgCheckStatus === "Completed",
        sentAt:
          bgCheckStatus === "Completed"
            ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
            : undefined,
        signed: bgCheckStatus === "Completed" && Math.random() > 0.3,
        signedAt:
          bgCheckStatus === "Completed" && Math.random() > 0.3
            ? new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
            : undefined,
      },
      fullAgentOffer: {
        sent: isLicensed && Math.random() > 0.5,
        sentAt:
          isLicensed && Math.random() > 0.5
            ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
            : undefined,
        signed: isLicensed && Math.random() > 0.7,
        signedAt:
          isLicensed && Math.random() > 0.7
            ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
            : undefined,
      },
    },
    licensing: {
      licenseObtained: isLicensed,
      licensePassed: isLicensed,
      licensePassedAt: isLicensed
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        : undefined,
      examAttempts: isLicensed ? Math.floor(Math.random() * 3) + 1 : 0,
      notes: "",
    },
    classAssignment: {
      classType: isLicensed ? "AGENT" : "UNL",
      startDate:
        Math.random() > 0.5
          ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
          : undefined,
      startConfirmed: Math.random() > 0.5,
      preStartCallCompleted: Math.random() > 0.5,
      backgroundDisclosureCompleted: Math.random() > 0.5,
      badgeReceived: Math.random() > 0.5,
      itRequestCompleted: Math.random() > 0.5,
    },
    callCenter: Math.random() > 0.5 ? "CLT" : "ATX",
    status: "Active",
    notes: `Sample candidate ${index} for testing`,
    readyToGo: Math.random() > 0.7,
  };
};

// Sample trainer data generator
export const createSampleTrainer = (
  index: number
): Omit<Trainer, "id" | "createdAt" | "updatedAt"> => {
  const type = Math.random() > 0.5 ? "SSS" : "CAP";
  const callCenter = ["CLT", "ATX", "Both"][
    Math.floor(Math.random() * 3)
  ] as any;

  return {
    name: `Test Trainer ${index}`,
    type,
    email: `trainer${index}@callcenter.com`,
    phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(
      Math.floor(Math.random() * 9000) + 1000
    )}`,
    callCenter,
    currentAssignments: [],
    maxCapacity: Math.floor(Math.random() * 5) + 10,
    specializations: ["Customer Service", "Sales", "Technical Support"].slice(
      0,
      Math.floor(Math.random() * 3) + 1
    ),
    isActive: Math.random() > 0.2,
  };
};

// Sample cohort data generator
export const createSampleCohort = (
  index: number
): Omit<Cohort, "id" | "createdAt" | "updatedAt"> => {
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
  ] as const;
  const currentStageIndex = Math.floor(Math.random() * stages.length);
  const currentStage = stages[currentStageIndex];
  const startDate = new Date(
    Date.now() - currentStageIndex * 7 * 24 * 60 * 60 * 1000
  );

  return {
    name: `CLASS ${index} - ${new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`,
    callCenter: Math.random() > 0.5 ? "CLT" : "ATX",
    classType: Math.random() > 0.5 ? "UNL" : "AGENT",
    currentStage,
    weekNumber: currentStageIndex + 1,
    startDate,
    expectedEndDate: new Date(
      startDate.getTime() + 9 * 7 * 24 * 60 * 60 * 1000
    ),
    trainer: {
      name: `Trainer ${Math.floor(Math.random() * 5) + 1}`,
      type: Math.random() > 0.5 ? "SSS" : "CAP",
      contact: `trainer${Math.floor(Math.random() * 5) + 1}@callcenter.com`,
    },
    participants: [], // Will be populated with candidate IDs
    performance: {
      metrics:
        currentStageIndex > 2
          ? `${Math.floor(Math.random() * 30) + 70}%`
          : undefined,
      lastUpdated: currentStageIndex > 2 ? new Date() : undefined,
      notes: "",
    },
    milestones: stages.slice(0, currentStageIndex).map((stage, idx) => ({
      stage,
      completedAt: new Date(
        startDate.getTime() + idx * 7 * 24 * 60 * 60 * 1000
      ),
      notes: "",
    })),
    status: currentStage === "COMPLETED" ? "Completed" : "Active",
  };
};

// Function to populate sample data
export const populateSampleData = async () => {
  try {
    console.log("Creating sample trainers...");
    // Create trainers
    for (let i = 1; i <= 5; i++) {
      await createTrainer(createSampleTrainer(i));
    }

    console.log("Creating sample candidates...");
    // Create candidates
    for (let i = 1; i <= 20; i++) {
      await createCandidate(createSampleCandidate(i));
    }

    console.log("Creating sample cohorts...");
    // Create cohorts
    for (let i = 1; i <= 6; i++) {
      await createCohort(createSampleCohort(i));
    }

    console.log("Sample data created successfully!");
  } catch (error) {
    console.error("Error creating sample data:", error);
    throw error;
  }
};

// Generate test candidates for interview workflow
export const generateInterviewTestCandidates = async () => {
  const testCandidates = [
    {
      personalInfo: {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "(555) 123-4567",
        location: "New York, NY",
      },
      licenseStatus: "Unlicensed" as const,
      interview: {
        status: "Not Started" as const,
        evaluations: [],
      },
      backgroundCheck: {
        initiated: false,
        status: "Pending" as const,
        notes: "",
      },
      offers: {
        preLicenseOffer: {
          sent: false,
          signed: false,
        },
        fullAgentOffer: {
          sent: false,
          signed: false,
        },
      },
      licensing: {
        licenseObtained: false,
        licensePassed: false,
        examAttempts: 0,
        notes: "",
      },
      classAssignment: {
        startConfirmed: false,
        preStartCallCompleted: false,
        backgroundDisclosureCompleted: false,
        badgeReceived: false,
        itRequestCompleted: false,
      },
      callCenter: "CLT" as const,
      status: "Active" as const,
      notes: "New candidate ready for interview",
      readyToGo: false,
    },
    {
      personalInfo: {
        name: "Michael Chen",
        email: "michael.chen@example.com",
        phone: "(555) 234-5678",
        location: "Los Angeles, CA",
      },
      licenseStatus: "Licensed" as const,
      interview: {
        status: "Scheduled" as const,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        evaluations: [],
      },
      backgroundCheck: {
        initiated: false,
        status: "Pending" as const,
        notes: "",
      },
      offers: {
        preLicenseOffer: {
          sent: false,
          signed: false,
        },
        fullAgentOffer: {
          sent: false,
          signed: false,
        },
      },
      licensing: {
        licenseObtained: true,
        licensePassed: true,
        licensePassedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        examAttempts: 1,
        notes: "",
      },
      classAssignment: {
        startConfirmed: false,
        preStartCallCompleted: false,
        backgroundDisclosureCompleted: false,
        badgeReceived: false,
        itRequestCompleted: false,
      },
      callCenter: "ATX" as const,
      status: "Active" as const,
      notes: "Licensed candidate scheduled for interview",
      readyToGo: false,
    },
    {
      personalInfo: {
        name: "Emily Rodriguez",
        email: "emily.rodriguez@example.com",
        phone: "(555) 345-6789",
        location: "Chicago, IL",
      },
      licenseStatus: "Unlicensed" as const,
      interview: {
        status: "In Progress" as const,
        evaluations: [],
      },
      backgroundCheck: {
        initiated: false,
        status: "Pending" as const,
        notes: "",
      },
      offers: {
        preLicenseOffer: {
          sent: false,
          signed: false,
        },
        fullAgentOffer: {
          sent: false,
          signed: false,
        },
      },
      licensing: {
        licenseObtained: false,
        licensePassed: false,
        examAttempts: 0,
        notes: "",
      },
      classAssignment: {
        startConfirmed: false,
        preStartCallCompleted: false,
        backgroundDisclosureCompleted: false,
        badgeReceived: false,
        itRequestCompleted: false,
      },
      callCenter: "CLT" as const,
      status: "Active" as const,
      notes: "Interview currently in progress",
      readyToGo: false,
    },
  ];

  const promises = testCandidates.map((candidateData) =>
    createCandidate(candidateData)
  );

  return Promise.all(promises);
};
