import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  FileText,
  GraduationCap,
  Award,
  Calendar,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

interface FunnelStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  percentage: number;
  candidates: Candidate[];
  description: string;
  color: string;
  bgColor: string;
  nextAction?: string;
}

interface OnboardingFunnelProps {
  candidates: Candidate[];
}

export function OnboardingFunnel({ candidates }: OnboardingFunnelProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  // Calculate candidates at each stage
  const getFunnelStages = (): FunnelStage[] => {
    const total = candidates.length || 1; // Avoid division by zero

    // Interview Stage
    const interviewNotStarted = candidates.filter(
      (c) => !c.interview?.status || c.interview?.status === "Not Started"
    );
    const interviewScheduled = candidates.filter(
      (c) => c.interview?.status === "Scheduled"
    );
    const interviewInProgress = candidates.filter(
      (c) => c.interview?.status === "In Progress"
    );
    const interviewCompleted = candidates.filter(
      (c) => c.interview?.status === "Completed"
    );
    const interviewPassed = interviewCompleted.filter(
      (c) => c.interview?.result === "Passed"
    );
    const interviewFailed = interviewCompleted.filter(
      (c) => c.interview?.result === "Failed"
    );

    // Background Check Stage - only for those who passed interview
    const bgPending = candidates.filter(
      (c) =>
        c.interview?.result === "Passed" &&
        (!c.backgroundCheck.status || c.backgroundCheck.status === "Pending")
    );
    const bgInProgress = candidates.filter(
      (c) =>
        c.interview?.result === "Passed" &&
        c.backgroundCheck.status === "In Progress"
    );

    // Pre-License Offer Stage
    const preLicenseOfferPending = candidates.filter(
      (c) =>
        c.backgroundCheck.status === "Completed" &&
        !c.offers.preLicenseOffer.sent
    );
    const preLicenseOfferAwaitingSig = candidates.filter(
      (c) => c.offers.preLicenseOffer.sent && !c.offers.preLicenseOffer.signed
    );

    // Licensing Stage
    const inLicensing = candidates.filter(
      (c) =>
        c.offers.preLicenseOffer.signed &&
        c.licenseStatus === "Unlicensed" &&
        !c.licensing.licenseObtained
    );

    // Full Agent Offer Stage
    const fullOfferPending = candidates.filter(
      (c) => c.licenseStatus === "Licensed" && !c.offers.fullAgentOffer.sent
    );
    const fullOfferAwaitingSig = candidates.filter(
      (c) => c.offers.fullAgentOffer.sent && !c.offers.fullAgentOffer.signed
    );

    // Class Assignment Stage
    const awaitingClassAssignment = candidates.filter(
      (c) =>
        (c.offers.preLicenseOffer.signed || c.offers.fullAgentOffer.signed) &&
        !c.classAssignment.startDate
    );
    const inClassPrep = candidates.filter(
      (c) => c.classAssignment.startDate && !c.readyToGo
    );

    // Ready to Go
    const readyToGo = candidates.filter((c) => c.readyToGo);

    return [
      {
        id: "interview",
        name: "Interview Process",
        icon: <ClipboardList className="h-5 w-5" />,
        count:
          interviewNotStarted.length +
          interviewScheduled.length +
          interviewInProgress.length,
        percentage:
          ((interviewNotStarted.length +
            interviewScheduled.length +
            interviewInProgress.length) /
            total) *
          100,
        candidates: [
          ...interviewNotStarted,
          ...interviewScheduled,
          ...interviewInProgress,
        ],
        description: `${interviewNotStarted.length} not started, ${interviewScheduled.length} scheduled, ${interviewInProgress.length} in progress`,
        color: "bg-indigo-500",
        bgColor: "bg-indigo-100",
        nextAction: "Schedule interviews",
      },
      {
        id: "background-check",
        name: "Background Check",
        icon: <UserCheck className="h-5 w-5" />,
        count: bgPending.length + bgInProgress.length,
        percentage: ((bgPending.length + bgInProgress.length) / total) * 100,
        candidates: [...bgPending, ...bgInProgress],
        description: `${bgPending.length} pending, ${bgInProgress.length} in progress`,
        color: "bg-yellow-500",
        bgColor: "bg-yellow-100",
        nextAction: "Initiate checks",
      },
      {
        id: "pre-license-offer",
        name: "Pre-License Offer",
        icon: <FileText className="h-5 w-5" />,
        count:
          preLicenseOfferPending.length + preLicenseOfferAwaitingSig.length,
        percentage:
          ((preLicenseOfferPending.length + preLicenseOfferAwaitingSig.length) /
            total) *
          100,
        candidates: [...preLicenseOfferPending, ...preLicenseOfferAwaitingSig],
        description: `${preLicenseOfferPending.length} to send, ${preLicenseOfferAwaitingSig.length} awaiting signature`,
        color: "bg-orange-500",
        bgColor: "bg-orange-100",
        nextAction: "Send offers",
      },
      {
        id: "licensing",
        name: "Licensing Process",
        icon: <GraduationCap className="h-5 w-5" />,
        count: inLicensing.length,
        percentage: (inLicensing.length / total) * 100,
        candidates: inLicensing,
        description: `${inLicensing.length} in licensing`,
        color: "bg-purple-500",
        bgColor: "bg-purple-100",
        nextAction: "Track progress",
      },
      {
        id: "full-offer",
        name: "Full Agent Offer",
        icon: <Award className="h-5 w-5" />,
        count: fullOfferPending.length + fullOfferAwaitingSig.length,
        percentage:
          ((fullOfferPending.length + fullOfferAwaitingSig.length) / total) *
          100,
        candidates: [...fullOfferPending, ...fullOfferAwaitingSig],
        description: `${fullOfferPending.length} to send, ${fullOfferAwaitingSig.length} awaiting signature`,
        color: "bg-blue-500",
        bgColor: "bg-blue-100",
        nextAction: "Send offers",
      },
      {
        id: "class-assignment",
        name: "Class Assignment",
        icon: <Calendar className="h-5 w-5" />,
        count: awaitingClassAssignment.length + inClassPrep.length,
        percentage:
          ((awaitingClassAssignment.length + inClassPrep.length) / total) * 100,
        candidates: [...awaitingClassAssignment, ...inClassPrep],
        description: `${awaitingClassAssignment.length} need assignment, ${inClassPrep.length} preparing`,
        color: "bg-indigo-500",
        bgColor: "bg-indigo-100",
        nextAction: "Assign to class",
      },
      {
        id: "ready",
        name: "Ready to Go",
        icon: <Users className="h-5 w-5" />,
        count: readyToGo.length,
        percentage: (readyToGo.length / total) * 100,
        candidates: readyToGo,
        description: `${readyToGo.length} ready for class`,
        color: "bg-green-500",
        bgColor: "bg-green-100",
      },
    ];
  };

  const stages = getFunnelStages();
  const hasBlockedCandidates = stages.some(
    (s) => s.count > 0 && s.id !== "ready"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Onboarding Funnel</CardTitle>
          <Badge variant="outline">{candidates.length} Total Candidates</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visualization */}
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative">
              <div className="flex items-center gap-4">
                {/* Stage Icon & Count */}
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full text-white",
                    stage.color
                  )}
                >
                  {stage.icon}
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{stage.name}</h4>
                    <div className="flex items-center gap-2">
                      {stage.count > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => toggleStage(stage.id)}
                        >
                          {expandedStages.has(stage.id) ? (
                            <>
                              Hide Details{" "}
                              <ChevronUp className="ml-1 h-3 w-3" />
                            </>
                          ) : (
                            <>
                              Show Details{" "}
                              <ChevronDown className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      )}
                      {stage.nextAction && stage.count > 0 && (
                        <Link href="/candidates">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                          >
                            {stage.nextAction}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Custom Progress Bar with better contrast */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          stage.bgColor
                        )}
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-gray-800">
                        {stage.count} candidates • {stage.description}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Candidate List */}
                  {expandedStages.has(stage.id) && stage.count > 0 && (
                    <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                      {stage.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {candidate.personalInfo.name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {candidate.personalInfo.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {candidate.personalInfo.phone}
                              </span>
                            </div>
                          </div>
                          <Link href={`/candidates/${candidate.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 h-3" />
              )}
            </div>
          ))}
        </div>

        {/* Alerts Section */}
        {hasBlockedCandidates && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Action Required</p>
                <p className="text-sm text-amber-700 mt-1">
                  You have candidates waiting at various stages. Review each
                  stage to keep the onboarding process moving.
                </p>
                <Link href="/candidates">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    View All Candidates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(
                ((stages.find((s) => s.id === "ready")?.count || 0) /
                  candidates.length) *
                  100
              )}
              %
            </p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stages.reduce(
                (sum, stage) => sum + (stage.id !== "ready" ? stage.count : 0),
                0
              )}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {stages.find((s) => s.id === "ready")?.count || 0}
            </p>
            <p className="text-sm text-gray-600">Ready to Start</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
