"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Star,
  User,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import Link from "next/link";
import {
  getCandidate,
  updateCandidate,
  subscribeToCandidateUpdates,
} from "@/lib/firestore";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Candidate } from "@/lib/types";
import { InterviewEvaluationForm } from "@/components/candidates/InterviewEvaluationForm";
import InterviewScheduler from "@/components/candidates/InterviewScheduler";
import type { InterviewEvaluation } from "@/lib/types";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [quickNotes, setQuickNotes] = useState("");

  useEffect(() => {
    if (!candidateId) return;

    const unsubscribe = subscribeToCandidateUpdates(
      candidateId,
      (updatedCandidate) => {
        setCandidate(updatedCandidate);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [candidateId]);

  const handleUpdate = async (updates: Partial<Candidate>) => {
    if (!candidate) return;

    try {
      await updateCandidate(candidate.id, updates);
    } catch (error) {
      console.error("Error updating candidate:", error);
      alert("Failed to update candidate");
    }
  };

  const handleInterviewUpdate = async (field: string, value: any) => {
    if (!candidate) return;

    const updates: any = {};
    const fieldParts = field.split(".");

    if (fieldParts[0] === "interview") {
      const updatedInterview = { ...candidate.interview };
      if (fieldParts.length === 2) {
        updatedInterview[fieldParts[1] as keyof typeof updatedInterview] =
          value;
      }
      updates.interview = updatedInterview;
    } else {
      updates[field] = value;
    }

    await handleUpdate(updates);
  };

  const handleScheduleInterview = (interviewData: {
    scheduledDate: Date;
    calendarEventId: string;
    location: string;
    interviewerEmail?: string;
  }) => {
    handleUpdate({
      interview: {
        ...candidate!.interview,
        status: "Scheduled",
        scheduledDate: interviewData.scheduledDate,
        calendarEventId: interviewData.calendarEventId,
        location: interviewData.location,
        interviewerEmail: interviewData.interviewerEmail,
      },
    });
    setShowScheduler(false);
  };

  const handleStartInterview = () => {
    handleInterviewUpdate("interview.status", "In Progress");
  };

  const handleCompleteInterview = (result: "Passed" | "Failed") => {
    const interview = candidate?.interview || { evaluations: [] };

    // Calculate composite score from evaluations
    const evaluations = interview.evaluations || [];
    if (evaluations.length > 0) {
      const totalScore = evaluations.reduce(
        (sum, evaluation) => sum + evaluation.averageScore,
        0
      );
      const compositeScore = totalScore / evaluations.length;

      // Determine pass/fail based on 4.0 threshold
      const finalResult = compositeScore >= 4.0 ? "Passed" : "Failed";

      handleUpdate({
        interview: {
          ...interview,
          status: "Completed",
          result: finalResult,
          completedDate: new Date(),
          compositeScore: compositeScore,
        },
      });

      // Show success message
      alert(
        `Interview completed. Result: ${finalResult} (Score: ${compositeScore.toFixed(
          1
        )}/5.0)`
      );

      // Redirect back to manager dashboard
      setTimeout(() => router.push("/managers"), 2000);
    } else {
      alert(
        "Please add at least one evaluation before completing the interview."
      );
    }
  };

  const handleAddEvaluation = (
    newEvaluation: Omit<InterviewEvaluation, "id">
  ) => {
    if (!candidate) return;

    const evaluationWithId: InterviewEvaluation = {
      ...newEvaluation,
      id: `eval-${Date.now()}`,
    };

    const currentEvaluations = candidate.interview?.evaluations || [];
    const updatedEvaluations = [...currentEvaluations, evaluationWithId];

    // Calculate new composite score
    const totalScore = updatedEvaluations.reduce(
      (sum, evaluation) => sum + evaluation.averageScore,
      0
    );
    const compositeScore = totalScore / updatedEvaluations.length;

    handleUpdate({
      interview: {
        ...candidate.interview,
        evaluations: updatedEvaluations,
        compositeScore: compositeScore,
      },
    });

    setShowEvaluationForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading interview...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Candidate not found</div>
      </div>
    );
  }

  const interview = candidate.interview || {
    status: "Not Started" as const,
    evaluations: [],
  };

  const isPassing = (interview.compositeScore || 0) >= 4.0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/managers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Interview: {candidate.personalInfo.name}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge
                variant={
                  interview.status === "Completed"
                    ? interview.result === "Passed"
                      ? "default"
                      : "destructive"
                    : interview.status === "In Progress"
                    ? "secondary"
                    : "outline"
                }
              >
                {interview.status === "Completed" && interview.result
                  ? `${interview.status} - ${interview.result}`
                  : interview.status}
              </Badge>
              {interview.compositeScore && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span
                    className={`font-bold ${
                      isPassing ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {interview.compositeScore.toFixed(1)}/5.0
                  </span>
                  {isPassing && (
                    <Badge variant="default" className="bg-green-600">
                      Meets Hiring Threshold
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Candidate Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-medium">{candidate.personalInfo.name}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <p className="text-sm flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {candidate.personalInfo.email}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Phone</Label>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {candidate.personalInfo.phone}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Call Center</Label>
                <p className="text-sm flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {candidate.callCenter.replace("_", " ")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">License Status</Label>
                <Badge variant="outline">{candidate.licenseStatus}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Take notes during the interview..."
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Interview Management */}
        <div className="md:col-span-2 space-y-6">
          {/* Interview Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {interview.status === "Not Started" && (
                <>
                  {showScheduler ? (
                    <InterviewScheduler
                      candidate={candidate}
                      onScheduled={handleScheduleInterview}
                      onCancel={() => setShowScheduler(false)}
                    />
                  ) : (
                    <Button
                      onClick={() => setShowScheduler(true)}
                      className="w-full"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Interview
                    </Button>
                  )}
                </>
              )}

              {interview.status === "Scheduled" && !showScheduler && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Interview Scheduled
                    </p>
                    {interview.scheduledDate && (
                      <p className="text-sm text-blue-700 mt-1">
                        {formatDateTime(interview.scheduledDate)}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleStartInterview} className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    Start Interview
                  </Button>
                </div>
              )}

              {interview.status === "In Progress" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">
                      Interview In Progress
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Add evaluations below before completing
                    </p>
                  </div>

                  {(interview.evaluations?.length || 0) > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Current Score:
                        </span>
                        <span
                          className={`text-xl font-bold ${
                            (interview.compositeScore || 0) >= 4.0
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {interview.compositeScore?.toFixed(1) || "N/A"}/5.0
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Minimum passing score: 4.0/5.0
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => handleCompleteInterview("Passed")}
                    className="w-full"
                    variant="default"
                    disabled={(interview.evaluations?.length || 0) === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Interview
                  </Button>
                </div>
              )}

              {interview.status === "Completed" && (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${
                      interview.result === "Passed"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {interview.result === "Passed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p
                          className={`font-medium ${
                            interview.result === "Passed"
                              ? "text-green-900"
                              : "text-red-900"
                          }`}
                        >
                          Interview {interview.result}
                        </p>
                        <p
                          className={`text-sm ${
                            interview.result === "Passed"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          Final Score: {interview.compositeScore?.toFixed(1)}
                          /5.0
                        </p>
                      </div>
                    </div>
                  </div>

                  {interview.result === "Passed" && isPassing && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">
                            Ready for Next Steps
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            This candidate meets the hiring threshold (4.0+) and
                            is approved for onboarding. The recruiter has been
                            notified to proceed with background check.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluations Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Interview Evaluations</CardTitle>
                {(interview.status === "In Progress" ||
                  interview.status === "Completed") &&
                  !showEvaluationForm && (
                    <Button
                      size="sm"
                      onClick={() => setShowEvaluationForm(true)}
                      variant={
                        interview.status === "In Progress"
                          ? "default"
                          : "outline"
                      }
                    >
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
                      Add evaluations to score the candidate
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(interview.evaluations || []).map((evaluation) => (
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
                            {formatDateTime(evaluation.evaluationDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              evaluation.averageScore >= 4.0
                                ? "default"
                                : evaluation.averageScore >= 3.0
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {evaluation.averageScore.toFixed(1)}/5.0
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {evaluation.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(evaluation.scores).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="font-medium">{value}/5</span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Notes */}
                      {evaluation.notes && (
                        <div className="border-t pt-3">
                          <p className="text-sm text-gray-600">
                            {evaluation.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
