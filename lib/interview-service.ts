// Centralized Interview Service
// Handles all interview-related business logic and state management

import { Candidate, Interview, InterviewEvaluation } from "./types";
import { updateCandidate } from "./firestore";

export class InterviewService {
  // Interview status transitions and validation
  private static readonly STATUS_TRANSITIONS = {
    "Not Started": ["Scheduled"],
    Scheduled: ["In Progress", "Not Started"], // Can cancel back to Not Started
    "In Progress": ["Completed"],
    Completed: [], // Terminal state
  };

  // Minimum passing score
  private static readonly PASSING_SCORE = 4.0;

  /**
   * Check if a status transition is valid
   */
  static canTransitionTo(
    currentStatus: Interview["status"],
    newStatus: Interview["status"]
  ): boolean {
    const allowedTransitions = this.STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Schedule an interview
   */
  static async scheduleInterview(
    candidate: Candidate,
    scheduleData: {
      scheduledDate: Date;
      calendarEventId: string;
      location: string;
      interviewerEmail?: string;
    }
  ): Promise<Partial<Candidate>> {
    const currentStatus = candidate.interview?.status || "Not Started";

    if (!this.canTransitionTo(currentStatus, "Scheduled")) {
      throw new Error(
        `Cannot schedule interview from status: ${currentStatus}`
      );
    }

    return {
      interview: {
        ...candidate.interview,
        status: "Scheduled",
        scheduledDate: scheduleData.scheduledDate,
        calendarEventId: scheduleData.calendarEventId,
        location: scheduleData.location,
        interviewerEmail: scheduleData.interviewerEmail,
      },
    };
  }

  /**
   * Start an interview
   */
  static async startInterview(
    candidate: Candidate
  ): Promise<Partial<Candidate>> {
    const currentStatus = candidate.interview?.status || "Not Started";

    if (!this.canTransitionTo(currentStatus, "In Progress")) {
      throw new Error(`Cannot start interview from status: ${currentStatus}`);
    }

    return {
      interview: {
        ...candidate.interview,
        status: "In Progress",
      },
    };
  }

  /**
   * Complete an interview
   */
  static async completeInterview(
    candidate: Candidate,
    forceResult?: "Passed" | "Failed"
  ): Promise<Partial<Candidate>> {
    const currentStatus = candidate.interview?.status || "Not Started";

    if (!this.canTransitionTo(currentStatus, "Completed")) {
      throw new Error(
        `Cannot complete interview from status: ${currentStatus}`
      );
    }

    const evaluations = candidate.interview?.evaluations || [];
    if (evaluations.length === 0 && !forceResult) {
      throw new Error("Cannot complete interview without evaluations");
    }

    // Calculate composite score
    const compositeScore = this.calculateCompositeScore(evaluations);

    // Determine result based on score or forced result
    const result =
      forceResult ||
      (compositeScore >= this.PASSING_SCORE ? "Passed" : "Failed");

    const updates: Partial<Candidate> = {
      interview: {
        ...candidate.interview,
        status: "Completed",
        result,
        completedDate: new Date(),
        compositeScore,
      },
    };

    // If interview passed, automatically update background check status
    if (result === "Passed") {
      updates.backgroundCheck = {
        ...candidate.backgroundCheck,
        status: "Pending",
      };
    }

    return updates;
  }

  /**
   * Add an evaluation to an interview
   */
  static async addEvaluation(
    candidate: Candidate,
    evaluation: Omit<InterviewEvaluation, "id">
  ): Promise<Partial<Candidate>> {
    const currentStatus = candidate.interview?.status;

    if (currentStatus !== "In Progress" && currentStatus !== "Completed") {
      throw new Error(
        "Can only add evaluations to interviews in progress or completed"
      );
    }

    const evaluationWithId: InterviewEvaluation = {
      ...evaluation,
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedEvaluations = [
      ...(candidate.interview?.evaluations || []),
      evaluationWithId,
    ];

    const compositeScore = this.calculateCompositeScore(updatedEvaluations);

    return {
      interview: {
        ...candidate.interview,
        evaluations: updatedEvaluations,
        compositeScore,
      },
    };
  }

  /**
   * Calculate composite score from evaluations
   */
  static calculateCompositeScore(evaluations: InterviewEvaluation[]): number {
    if (evaluations.length === 0) return 0;

    const totalScore = evaluations.reduce(
      (sum, evaluation) => sum + evaluation.averageScore,
      0
    );

    return totalScore / evaluations.length;
  }

  /**
   * Get interview status display information
   */
  static getStatusDisplay(interview?: Interview) {
    const status = interview?.status || "Not Started";
    const result = interview?.result;

    return {
      label:
        status === "Completed" && result ? `${status} - ${result}` : status,
      variant: this.getStatusVariant(status, result),
      icon: this.getStatusIcon(status, result),
      color: this.getStatusColor(status, result),
    };
  }

  /**
   * Get badge variant for status
   */
  private static getStatusVariant(
    status: Interview["status"],
    result?: "Passed" | "Failed"
  ): "default" | "secondary" | "destructive" | "outline" {
    if (status === "Completed") {
      return result === "Passed" ? "default" : "destructive";
    }
    switch (status) {
      case "Not Started":
        return "secondary";
      case "Scheduled":
        return "outline";
      case "In Progress":
        return "secondary";
      default:
        return "outline";
    }
  }

  /**
   * Get icon name for status
   */
  private static getStatusIcon(
    status: Interview["status"],
    result?: "Passed" | "Failed"
  ): string {
    switch (status) {
      case "Not Started":
        return "Clock";
      case "Scheduled":
        return "Calendar";
      case "In Progress":
        return "Clock";
      case "Completed":
        return result === "Passed" ? "CheckCircle2" : "XCircle";
      default:
        return "Clock";
    }
  }

  /**
   * Get color classes for status
   */
  private static getStatusColor(
    status: Interview["status"],
    result?: "Passed" | "Failed"
  ): string {
    if (status === "Completed") {
      return result === "Passed"
        ? "text-green-600 bg-green-50"
        : "text-red-600 bg-red-50";
    }
    switch (status) {
      case "Not Started":
        return "text-gray-600 bg-gray-50";
      case "Scheduled":
        return "text-blue-600 bg-blue-50";
      case "In Progress":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  }

  /**
   * Check if interview meets hiring criteria
   */
  static meetsHiringCriteria(interview?: Interview): boolean {
    if (!interview || interview.status !== "Completed") return false;
    return (interview.compositeScore || 0) >= this.PASSING_SCORE;
  }

  /**
   * Get next action for interview
   */
  static getNextAction(interview?: Interview): {
    label: string;
    action: string;
  } | null {
    const status = interview?.status || "Not Started";

    switch (status) {
      case "Not Started":
        return { label: "Schedule Interview", action: "schedule" };
      case "Scheduled":
        return { label: "Start Interview", action: "start" };
      case "In Progress":
        return { label: "Complete Interview", action: "complete" };
      case "Completed":
        return null;
      default:
        return null;
    }
  }

  /**
   * Update interview in database
   */
  static async updateInterview(
    candidateId: string,
    updates: Partial<Candidate>
  ): Promise<void> {
    await updateCandidate(candidateId, updates);
  }
}

// Export singleton instance for convenience
export const interviewService = InterviewService;
