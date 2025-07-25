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
    // Training completion tracking (for unlicensed agents)
    trainingCompleted?: boolean;
    trainingCompletedDate?: Date;
    graduatedToLicensing?: boolean; // Indicates they've moved to licensing phase
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
  participantProgress?: {
    [candidateId: string]: CohortParticipantProgress;
  };
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

// New interface for tracking individual participant progress within a cohort
export interface CohortParticipantProgress {
  participantId: string;
  currentStage: Cohort["currentStage"];
  stageProgress: {
    [stage: string]: {
      startedAt?: Date;
      completedAt?: Date;
      status: "not_started" | "in_progress" | "completed" | "failed";
      notes?: string;
      performanceMetrics?: {
        attendance?: number; // percentage
        assessmentScores?: number[];
        behavioralRatings?: number;
      };
    };
  };
  overallProgress: number; // 0-100 percentage
  isOnTrack: boolean;
  flaggedConcerns?: string[];
  lastUpdated: Date;
}

// Enhanced participant management interface
export interface ParticipantManagement {
  eligibilityCheck: (candidate: Candidate, cohort: Cohort) => boolean;
  addParticipant: (cohortId: string, candidateId: string) => Promise<void>;
  removeParticipant: (cohortId: string, candidateId: string) => Promise<void>;
  updateParticipantProgress: (
    cohortId: string,
    candidateId: string,
    progress: Partial<CohortParticipantProgress>
  ) => Promise<void>;
  getParticipantProgress: (
    cohortId: string,
    candidateId: string
  ) => Promise<CohortParticipantProgress | null>;
}

// ADP Integration Types
export interface ADPEmployee {
  associateOID: string; // ADP's unique identifier
  workerId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    preferredName?: string;
  };
  workAssignment: {
    assignedWorkLocation?: {
      nameCode?: {
        codeValue?: string;
        shortName?: string;
      };
    };
    jobTitle?: string;
    departmentCode?: string;
    reportsTo?: {
      associateOID: string;
      workerID: string;
    };
  };
  workRelationship: {
    hireDate?: string;
    terminationDate?: string;
    workRelationshipStatus?: {
      statusCode?: {
        codeValue: string; // Active, Terminated, etc.
      };
    };
  };
  compensation?: {
    basePay?: {
      payRate?: {
        rateValue?: number;
        currencyCode?: string;
      };
    };
  };
  businessCommunication: {
    emails?: Array<{
      emailUri: string;
      nameCode?: {
        codeValue: string; // WORK, PERSONAL, etc.
      };
    }>;
    landlines?: Array<{
      areaDialing?: string;
      dialNumber?: string;
      nameCode?: {
        codeValue: string;
      };
    }>;
  };
  customFieldGroup?: {
    stringFields?: Array<{
      nameCode: {
        codeValue: string;
      };
      stringValue?: string;
    }>;
  };
}

export interface ADPIntegration {
  syncEmployeeData: (candidateId: string) => Promise<ADPEmployee | null>;
  createEmployee: (candidate: Candidate) => Promise<string>; // Returns ADP associateOID
  updateEmployee: (
    associateOID: string,
    updates: Partial<ADPEmployee>
  ) => Promise<void>;
  getEmployee: (associateOID: string) => Promise<ADPEmployee | null>;
  searchEmployees: (searchCriteria: {
    firstName?: string;
    lastName?: string;
    email?: string;
    workLocation?: string;
  }) => Promise<ADPEmployee[]>;
}

export interface OrganizationManagement {
  adp: ADPIntegration;
  syncCandidateToADP: (candidateId: string) => Promise<void>;
  onboardNewHire: (candidateId: string, startDate: Date) => Promise<void>;
  updateEmployeeStatus: (candidateId: string, status: string) => Promise<void>;
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

// User roles and permissions
export type UserRole = "admin" | "recruiter" | "manager" | "viewer";

export interface UserPermissions {
  // Dashboard access
  viewDashboard: boolean;

  // Candidate management
  viewCandidates: boolean;
  editCandidates: boolean;
  deleteCandidates: boolean;

  // Interview management
  viewInterviews: boolean;
  scheduleInterviews: boolean;
  conduteInterviews: boolean;
  editEvaluations: boolean;

  // Cohort management
  viewCohorts: boolean;
  editCohorts: boolean;
  manageCohorts: boolean;

  // Trainer management
  viewTrainers: boolean;
  editTrainers: boolean;

  // Admin functions
  viewAdmin: boolean;
  manageUsers: boolean;
  manageSettings: boolean;

  // Manager portal
  viewManagerPortal: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  permissions: UserPermissions;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  createdBy?: string; // Admin who created/approved the user
}

// Role preset configurations
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    viewDashboard: true,
    viewCandidates: true,
    editCandidates: true,
    deleteCandidates: true,
    viewInterviews: true,
    scheduleInterviews: true,
    conduteInterviews: true,
    editEvaluations: true,
    viewCohorts: true,
    editCohorts: true,
    manageCohorts: true,
    viewTrainers: true,
    editTrainers: true,
    viewAdmin: true,
    manageUsers: true,
    manageSettings: true,
    viewManagerPortal: true,
  },
  recruiter: {
    viewDashboard: true,
    viewCandidates: true,
    editCandidates: true,
    deleteCandidates: true,
    viewInterviews: true,
    scheduleInterviews: true,
    conduteInterviews: true,
    editEvaluations: true,
    viewCohorts: true,
    editCohorts: true,
    manageCohorts: true,
    viewTrainers: true,
    editTrainers: true,
    viewAdmin: false,
    manageUsers: false,
    manageSettings: false,
    viewManagerPortal: false,
  },
  manager: {
    viewDashboard: true,
    viewCandidates: true,
    editCandidates: false,
    deleteCandidates: false,
    viewInterviews: true,
    scheduleInterviews: true,
    conduteInterviews: true,
    editEvaluations: true,
    viewCohorts: false,
    editCohorts: false,
    manageCohorts: false,
    viewTrainers: false,
    editTrainers: false,
    viewAdmin: false,
    manageUsers: false,
    manageSettings: false,
    viewManagerPortal: true,
  },
  viewer: {
    viewDashboard: true,
    viewCandidates: true,
    editCandidates: false,
    deleteCandidates: false,
    viewInterviews: false,
    scheduleInterviews: false,
    conduteInterviews: false,
    editEvaluations: false,
    viewCohorts: false,
    editCohorts: false,
    manageCohorts: false,
    viewTrainers: false,
    editTrainers: false,
    viewAdmin: false,
    manageUsers: false,
    manageSettings: false,
    viewManagerPortal: false,
  },
};

// Allowed domains
export const ALLOWED_DOMAINS = ["luminarylife.com", "digitalbga.com"];
