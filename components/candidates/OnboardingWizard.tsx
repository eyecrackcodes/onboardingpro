import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge as StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Lock,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
  isLocked: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  requirements?: string[];
  completedAt?: Date;
}

interface OnboardingWizardProps {
  candidate: Candidate;
  onActionClick: (section: string, action?: string) => void;
}

export function OnboardingWizard({
  candidate,
  onActionClick,
}: OnboardingWizardProps) {
  // Background check status used throughout component
  const bgCheckStatus = candidate.backgroundCheck.status;
  const classAssigned = !!candidate.classAssignment.startDate;
  
  // Calculate which steps are complete, active, or locked
  const getSteps = (): OnboardingStep[] => {
    const interviewComplete =
      candidate.interview?.status === "Completed" &&
      candidate.interview?.result === "Passed";
    const bgCheckComplete = bgCheckStatus === "Completed";

    // Only log backgroundCheck for debugging when needed
    // console.log("[OnboardingWizard] Candidate backgroundCheck object:", candidate.backgroundCheck);
    const preLicenseOfferSent =
      candidate.offers?.preLicenseOffer?.sent || false;
    const preLicenseOfferSigned =
      candidate.offers?.preLicenseOffer?.signed || false;
    const isLicensed = candidate.licenseStatus === "Licensed";
    const fullOfferSent = candidate.offers?.fullAgentOffer?.sent || false;
    const fullOfferSigned = candidate.offers?.fullAgentOffer?.signed || false;
    // Only log step calculation when debugging
    // console.log("[OnboardingWizard] Step calculation:", {
    //   interviewComplete,
    //   interviewStatus: candidate.interview?.status,
    //   interviewResult: candidate.interview?.result,
    //   bgCheckComplete,
    //   bgCheckStatus: candidate.backgroundCheck.status,
    //   preLicenseOfferSent,
    //   preLicenseOfferSigned,
    //   isLicensed,
    //   licenseStatus: candidate.licenseStatus,
    //   fullOfferSent,
    //   fullOfferSigned,
    //   classAssigned,
    //   readyToGo: candidate.readyToGo,
    // });

    const steps: OnboardingStep[] = [
      {
        id: "interview",
        title: "Interview Process",
        description: "Complete candidate interview and evaluation",
        isComplete: interviewComplete,
        isActive: !interviewComplete,
        isLocked: false,
        action: !interviewComplete
          ? {
              label:
                candidate.interview?.status === "Not Started" ||
                !candidate.interview?.status
                  ? "Schedule Interview"
                  : candidate.interview?.status === "Scheduled"
                  ? "Start Interview"
                  : candidate.interview?.status === "In Progress"
                  ? "Complete Interview"
                  : "View Interview",
              onClick: () => {
                if (
                  candidate.interview?.status === "Not Started" ||
                  !candidate.interview?.status
                ) {
                  onActionClick("interview", "schedule");
                } else {
                  onActionClick("interview");
                }
              },
            }
          : undefined,
        requirements: ["Resume reviewed", "Initial screening completed"],
        completedAt: candidate.interview?.completedDate,
      },
      {
        id: "background",
        title: "Background Check",
        description:
          bgCheckStatus === "Failed"
            ? "Background check failed – review details"
            : "Complete background check process",
        isComplete: bgCheckComplete,
        isActive: interviewComplete && !bgCheckComplete,
        isLocked: !interviewComplete,
        action:
          interviewComplete && !bgCheckComplete
            ? {
                label:
                  candidate.backgroundCheck.initiated &&
                  bgCheckStatus === "Failed"
                    ? "View Details"
                    : candidate.backgroundCheck.initiated
                    ? "Check Status"
                    : "Initiate Check",
                onClick: () => onActionClick("background"),
              }
            : undefined,
        requirements: [
          "Interview passed (4.0+ score)",
          "Personal information verified",
          "Consent form signed",
        ],
        completedAt: candidate.backgroundCheck.passedAt,
      },
      {
        id: "pre-license-offer",
        title: "Pre-License Offer",
        description: "Send and receive signed pre-license offer",
        isComplete: preLicenseOfferSigned,
        isActive: bgCheckComplete && !preLicenseOfferSigned,
        isLocked: !bgCheckComplete,
        action:
          bgCheckComplete && !preLicenseOfferSigned
            ? {
                label: preLicenseOfferSent ? "Follow Up" : "Send Offer",
                onClick: () => onActionClick("offers"),
              }
            : undefined,
        requirements: ["Background check passed", "Candidate is unlicensed"],
        completedAt: candidate.offers.preLicenseOffer.signedAt,
      },
      // Training completion step for unlicensed candidates
      ...(!isLicensed && preLicenseOfferSigned
        ? [
            {
              id: "training-completion",
              title: "Complete UNL Training",
              description: candidate.classAssignment?.trainingCompleted
                ? "2-week training program completed"
                : "Complete 2-week unlicensed training program",
              isComplete: !!candidate.classAssignment?.trainingCompleted,
              isActive: preLicenseOfferSigned && !candidate.classAssignment?.trainingCompleted,
              isLocked: !preLicenseOfferSigned,
              action:
                preLicenseOfferSigned && !candidate.classAssignment?.trainingCompleted && classAssigned
                  ? {
                      label: "Mark Training Complete",
                      onClick: () => onActionClick("assignment", "training-complete"),
                    }
                  : !classAssigned
                  ? {
                      label: "Assign to Class",
                      onClick: () => onActionClick("assignment"),
                    }
                  : undefined,
              requirements: [
                "Pre-license offer signed",
                "Assigned to UNL cohort",
                "Completed 2-week training",
              ],
              completedAt: candidate.classAssignment?.trainingCompletedDate,
            },
          ]
        : []),
      // Licensing step only relevant for unlicensed track after training
      ...(!isLicensed && candidate.classAssignment?.trainingCompleted
        ? [
            {
              id: "licensing",
              title: "Licensing Milestone",
              description:
                "Confirm candidate has passed state exam and obtained license",
              isComplete: isLicensed,
              isActive:
                candidate.classAssignment?.trainingCompleted &&
                !isLicensed &&
                candidate.licenseStatus === "Unlicensed",
              isLocked: !candidate.classAssignment?.trainingCompleted,
              action:
                candidate.classAssignment?.trainingCompleted && !isLicensed
                  ? {
                      label: "Mark Licensed",
                      onClick: () => onActionClick("licensing", "mark"),
                    }
                  : undefined,
              requirements: [
                "Completed UNL training",
                "State exam scheduled & passed",
              ],
              completedAt: candidate.licensing?.licensePassedAt,
            },
          ]
        : []),
      {
        id: "full-offer",
        title: "Full Agent Offer",
        description: "Send and receive signed full agent offer",
        isComplete: fullOfferSigned,
        isActive: isLicensed && !fullOfferSigned,
        isLocked: !isLicensed,
        action:
          isLicensed && !fullOfferSigned
            ? {
                label: fullOfferSent ? "Follow Up" : "Send Offer",
                onClick: () => onActionClick("offers"),
              }
            : undefined,
        requirements: [
          "Background check passed",
          "License obtained",
          "Ready for licensed class",
        ],
        completedAt: candidate.offers.fullAgentOffer.signedAt,
      },
      {
        id: "class-assignment",
        title: "Class Assignment",
        description: getClassAssignmentDescription(),
        isComplete: candidate.readyToGo,
        isActive:
          (preLicenseOfferSigned || fullOfferSigned) && !candidate.readyToGo,
        isLocked: !preLicenseOfferSigned && !fullOfferSigned,
        action:
          (preLicenseOfferSigned || fullOfferSigned) && !classAssigned
            ? {
                label: "Assign to Class",
                onClick: () => onActionClick("assignment"),
              }
            : classAssigned && !candidate.readyToGo
            ? {
                label: "Complete Checklist",
                onClick: () => onActionClick("assignment"),
              }
            : undefined,
        requirements:
          candidate.licenseStatus === "Licensed"
            ? ["Full agent offer signed", "Training schedule confirmed"]
            : ["Pre-license offer signed", "Training schedule confirmed"],
        completedAt: candidate.readyToGo
          ? candidate.classAssignment.startDate
          : undefined,
      },
    ];

    function getClassAssignmentDescription() {
      if (!classAssigned) {
        return "Assign to training class and complete onboarding";
      }
      
      // Calculate onboarding progress
      const tasks = [
        candidate.classAssignment.preStartCallCompleted,
        candidate.classAssignment.startConfirmed,
        candidate.classAssignment.backgroundDisclosureCompleted,
        candidate.classAssignment.badgeReceived,
        candidate.classAssignment.itRequestCompleted,
      ];
      const completedTasks = tasks.filter(Boolean).length;
      const totalTasks = tasks.length;
      
      if (candidate.readyToGo) {
        return "All onboarding tasks completed - Ready to start!";
      } else {
        return `Onboarding in progress (${completedTasks}/${totalTasks} tasks completed)`;
      }
    }

    return steps;
  };

  const steps = getSteps();
  const completedSteps = steps.filter((s) => s.isComplete).length;
  const progress = (completedSteps / steps.length) * 100;
  const isLicensed = candidate.licenseStatus === "Licensed";

  // Find the current active step
  const activeStep = steps.find((s) => s.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Onboarding Progress</CardTitle>
          <StatusBadge variant={isLicensed ? "default" : "secondary"}>
            {isLicensed ? "Licensed Track" : "Unlicensed Track"}
          </StatusBadge>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {isLicensed
            ? "Candidate will join the licensed class directly"
            : "Candidate will start 2 weeks early for pre-licensing preparation"}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600">
            {progress === 100
              ? "Onboarding complete!"
              : activeStep
              ? `Current step: ${activeStep.title}`
              : "Review requirements to continue"}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "relative flex gap-4 pb-8",
                index === steps.length - 1 && "pb-0"
              )}
            >
              {/* Step Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Step Icon */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                {step.isComplete ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                ) : step.isActive ? (
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Circle className="h-6 w-6 text-white fill-white" />
                  </div>
                ) : step.isLocked ? (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Circle className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      "font-medium",
                      step.isComplete && "text-green-700",
                      step.isActive && "text-blue-700",
                      step.isLocked && "text-gray-400"
                    )}
                  >
                    {step.title}
                  </h4>
                  {step.id === "background" && (
                    <StatusBadge
                      variant={
                        bgCheckStatus === "Failed"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {bgCheckStatus}
                    </StatusBadge>
                  )}
                  {step.id === "class-assignment" && classAssigned && !candidate.readyToGo && (
                    <StatusBadge variant="secondary">
                      {(() => {
                        const tasks = [
                          candidate.classAssignment.preStartCallCompleted,
                          candidate.classAssignment.startConfirmed,
                          candidate.classAssignment.backgroundDisclosureCompleted,
                          candidate.classAssignment.badgeReceived,
                          candidate.classAssignment.itRequestCompleted,
                        ];
                        const completed = tasks.filter(Boolean).length;
                        return `${completed}/5`;
                      })()}
                    </StatusBadge>
                  )}
                  {step.completedAt && (
                    <span className="text-xs text-gray-500">
                      {formatDate(step.completedAt)}
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "text-sm",
                    step.isLocked ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {step.description}
                </p>

                {/* Requirements */}
                {step.isActive && step.requirements && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-500">
                      Requirements:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {step.requirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <Circle className="h-2 w-2" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                {step.action && (
                  <Button
                    size="sm"
                    onClick={step.action.onClick}
                    className="mt-3"
                  >
                    {step.action.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* Locked Message */}
                {step.isLocked && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <AlertCircle className="h-3 w-3" />
                    Complete previous steps to unlock
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps Alert */}
        {activeStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Next Action Required
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {activeStep.description}
                </p>
                {activeStep.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={activeStep.action.onClick}
                    className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {activeStep.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
