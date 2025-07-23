// Type definitions for the Onboarding Tracker application

export interface Candidate {
  id: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    altPhone?: string;
    location: string;
  };
  callCenter: "CLT" | "ATX";
  licenseStatus: "Licensed" | "Unlicensed";
  resumeUrl?: string;
  interview: {
    status: "Not Started" | "Scheduled" | "In Progress" | "Completed";
    result?: "Passed" | "Failed";
    scheduledDate?: Date;
    completedDate?: Date;
    evaluations: InterviewEvaluation[];
    compositeScore?: number;
    calendarEventId?: string;
    location?: string;
    interviewerEmail?: string;
  };
  backgroundCheck: {
    initiated: boolean;
    status: "Pending" | "In Progress" | "Completed" | "Failed";
    passed?: boolean;
    passedAt?: Date;
    failedAt?: Date;
    completedAt?: Date;
    lastCheckedAt?: Date;
    notes?: string;
    ibrId?: string; // IBR system ID for tracking
    extendedStatuses?: {
      credit?: "Pass" | "Fail" | "Review";
      federal?: "Pass" | "Fail" | "Review";
      state?: "Pass" | "Fail" | "Review";
      social?: "Pass" | "Fail" | "Review";
      pdb?: "Pass" | "Fail" | "Review"; // Patriot Database
      sex_offender?: "Pass" | "Fail" | "Review";
      drug?: "Pass" | "Fail" | "Review";
      employment?: "Pass" | "Fail" | "Review";
      education?: "Pass" | "Fail" | "Review";
    };
    reportUrl?: string; // Direct link to IBR report PDF
    timestamps?: {
      submitted?: string;
      completed?: string;
    };
  };
  offers: {
    preLicenseOffer: {
      sent: boolean;
      sentAt?: Date;
      signed: boolean;
      signedAt?: Date;
    };
    fullAgentOffer: {
      sent: boolean;
      sentAt?: Date;
      signed: boolean;
      signedAt?: Date;
    };
  };
  licensing: {
    licenseObtained: boolean;
    licensePassed: boolean;
    licensePassedAt?: Date;
    examAttempts: number;
    notes?: string;
  };
  classAssignment: {
    classType?: "UNL" | "AGENT";
    startDate?: Date;
    startConfirmed: boolean;
    preStartCallCompleted: boolean;
    backgroundDisclosureCompleted: boolean;
    badgeReceived: boolean;
    itRequestCompleted: boolean;
  };
  readyToGo: boolean;
  status: "Active" | "Completed" | "Dropped" | "On Hold";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewEvaluation {
  id: string;
  managerId: string;
  managerName: string;
  managerEmail: string;
  evaluationDate: Date;
  scores: {
    communication: number; // 1-5
    technicalSkills: number; // 1-5
    customerService: number; // 1-5
    problemSolving: number; // 1-5
    cultureFit: number; // 1-5
  };
  averageScore: number;
  notes: string;
  recommendation:
    | "Strongly Recommend"
    | "Recommend"
    | "Neutral"
    | "Do Not Recommend";
  strengths: string;
  concerns: string;
}

export interface Cohort {
  id: string;
  name: string; // e.g., "CLASS 1 - July 2025"
  callCenter: "CLT" | "ATX";
  classType: "UNL" | "AGENT";
  currentStage:
    | "START"
    | "WK_1"
    | "WK_2"
    | "WK_3_CSR"
    | "WK_4_CSR"
    | "WK_5_CSR"
    | "WK_6_CSR"
    | "WK_7_A_BAY"
    | "WK_8_A_BAY"
    | "WK_9_TEAM"
    | "COMPLETED";
  weekNumber: number;
  startDate: Date;
  expectedEndDate: Date;
  trainer: {
    name: string;
    type: "SSS" | "CAP";
    contact?: string;
  };
  participants: string[]; // Array of candidate IDs
  performance: {
    metrics?: string; // e.g., "16%,1100AP,60%"
    lastUpdated?: Date;
    notes?: string;
  };
  milestones: {
    stage: string;
    completedAt?: Date;
    notes?: string;
  }[];
  status: "Active" | "Completed" | "On Hold";
  createdAt: Date;
  updatedAt: Date;
}

export interface Trainer {
  id: string;
  name: string;
  type: "SSS" | "CAP";
  email: string;
  phone?: string;
  callCenter: "CLT" | "ATX" | "Both";
  currentAssignments: string[]; // Array of cohort IDs
  maxCapacity: number;
  specializations: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export type CandidateStatus = Candidate["status"];
export type CallCenter = Candidate["callCenter"];
export type LicenseStatus = Candidate["licenseStatus"];
export type ClassType = Cohort["classType"];
export type CohortStage = Cohort["currentStage"];
export type TrainerType = Trainer["type"];
