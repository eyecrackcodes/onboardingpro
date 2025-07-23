import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { Candidate, InterviewEvaluation } from "@/lib/types";
import { interviewService } from "@/lib/interview-service";
import InterviewScheduler from "./InterviewScheduler";
import { InterviewEvaluationForm } from "./InterviewEvaluationForm";
import { InterviewProgressIndicator } from "./InterviewProgressIndicator";

interface InterviewSectionProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => Promise<void>;
  autoShowScheduler?: boolean;
}

export function InterviewSection({
  candidate,
  onUpdate,
  autoShowScheduler,
}: InterviewSectionProps) {
  const [showScheduler, setShowScheduler] = useState(
    autoShowScheduler || false
  );
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interview = candidate.interview || {
    status: "Not Started" as const,
    evaluations: [],
  };

  // Get display information from the service
  const statusDisplay = interviewService.getStatusDisplay(interview);
  const nextAction = interviewService.getNextAction(interview);
  const meetsHiringCriteria = interviewService.meetsHiringCriteria(interview);

  const handleScheduleInterview = async (scheduleData: {
    scheduledDate: Date;
    calendarEventId: string;
    location: string;
    interviewerEmail?: string;
  }) => {
    try {
      setLoading(true);
      const updates = await interviewService.scheduleInterview(
        candidate,
        scheduleData
      );
      await onUpdate(updates);
      setShowScheduler(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to schedule interview"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      const updates = await interviewService.startInterview(candidate);
      await onUpdate(updates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start interview"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInterview = async () => {
    try {
      setLoading(true);
      const updates = await interviewService.completeInterview(candidate);
      await onUpdate(updates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete interview"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvaluation = async (
    evaluation: Omit<InterviewEvaluation, "id">
  ) => {
    try {
      setLoading(true);
      const updates = await interviewService.addEvaluation(
        candidate,
        evaluation
      );
      await onUpdate(updates);
      setShowEvaluationForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add evaluation");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    const iconName = statusDisplay.icon;
    switch (iconName) {
      case "Calendar":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "Clock":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "CheckCircle2":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "XCircle":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Interview Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Interview Status
              {getStatusIcon()}
            </div>
            <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Show scheduler if requested */}
          {showScheduler ? (
            <InterviewScheduler
              candidate={candidate}
              onSchedule={handleScheduleInterview}
              onClose={() => setShowScheduler(false)}
            />
          ) : (
            <>
              {/* Interview Controls based on status */}
              {interview.status === "Not Started" && (
                <Button
                  onClick={() => setShowScheduler(true)}
                  className="w-full"
                  disabled={loading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
              )}

              {interview.status === "Scheduled" && (
                <div className="space-y-4">
                  {interview.scheduledDate && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        Scheduled for:
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {format(new Date(interview.scheduledDate), "PPpp")}
                      </p>
                      {interview.calendarEventId && (
                        <p className="text-xs text-blue-600 mt-2">
                          Calendar Event ID: {interview.calendarEventId}
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={handleStartInterview}
                    className="w-full"
                    disabled={loading}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Start Interview
                  </Button>
                </div>
              )}

              {interview.status === "In Progress" && (
                <div className="space-y-4">
                  {interview.compositeScore !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Current Score:
                        </span>
                        <span
                          className={`text-xl font-bold ${
                            interview.compositeScore >= 4.0
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {interview.compositeScore.toFixed(1)}/5.0
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Minimum passing score: 4.0/5.0
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleCompleteInterview}
                    className="w-full"
                    variant="default"
                    disabled={
                      loading || (interview.evaluations?.length || 0) === 0
                    }
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Interview
                  </Button>
                  {(interview.evaluations?.length || 0) === 0 && (
                    <p className="text-xs text-amber-600 text-center">
                      Add at least one evaluation before completing
                    </p>
                  )}
                </div>
              )}

              {interview.status === "Completed" && (
                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-lg ${
                      interview.result === "Passed"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-600">
                      Interview Result
                    </div>
                    <div
                      className={`text-2xl font-bold mt-1 ${
                        interview.result === "Passed"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {interview.result}
                    </div>
                    {interview.completedDate && (
                      <div className="text-sm text-gray-500 mt-2">
                        Completed on{" "}
                        {format(new Date(interview.completedDate), "PPp")}
                      </div>
                    )}
                  </div>
                  {interview.result === "Passed" && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      Next Step: Background check has been initiated.
                    </div>
                  )}
                </div>
              )}

              {/* Composite Score Display */}
              {interview.compositeScore !== undefined &&
                interview.status === "Completed" && (
                  <div className="mt-4">
                    <InterviewProgressIndicator
                      interview={interview}
                      variant="detailed"
                    />
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Interview Evaluations */}
      {!showScheduler &&
        (interview.status === "In Progress" ||
          interview.status === "Completed") && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Interview Evaluations</CardTitle>
                {interview.status === "In Progress" && !showEvaluationForm && (
                  <Button size="sm" onClick={() => setShowEvaluationForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Evaluation
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showEvaluationForm ? (
                <InterviewEvaluationForm
                  onSubmit={handleAddEvaluation}
                  onCancel={() => setShowEvaluationForm(false)}
                />
              ) : (interview.evaluations?.length || 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No evaluations yet</p>
                  {interview.status === "In Progress" && (
                    <p className="text-sm mt-2">
                      Click &quot;Add Evaluation&quot; to submit an interview evaluation
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {interview.evaluations?.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {evaluation.managerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {evaluation.managerEmail}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(evaluation.evaluationDate), "PPp")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            evaluation.recommendation === "Strongly Recommend"
                              ? "default"
                              : evaluation.recommendation === "Recommend"
                              ? "secondary"
                              : evaluation.recommendation === "Do Not Recommend"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {evaluation.recommendation}
                        </Badge>
                      </div>

                      {/* Scores Grid */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Communication:</span>
                          <span className="font-medium">
                            {evaluation.scores.communication}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Problem Solving:
                          </span>
                          <span className="font-medium">
                            {evaluation.scores.problemSolving}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technical:</span>
                          <span className="font-medium">
                            {evaluation.scores.technical}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cultural Fit:</span>
                          <span className="font-medium">
                            {evaluation.scores.culturalFit}/5
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">
                            Average Score:
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              evaluation.averageScore >= 4.0
                                ? "text-green-600"
                                : "text-amber-600"
                            }`}
                          >
                            {evaluation.averageScore.toFixed(1)}/5.0
                          </span>
                        </div>
                      </div>

                      {evaluation.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                          {evaluation.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
