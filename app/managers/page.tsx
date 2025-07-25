"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { getCandidates, subscribeToCandidates } from "@/lib/firestore";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

interface ManagerInfo {
  code: string;
  name: string;
  role: string;
  location: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("scheduled");
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);

  useEffect(() => {
    // Check authentication
    const authData = sessionStorage.getItem("managerAuth");
    if (!authData) {
      router.push("/managers/login");
      return;
    }

    const auth = JSON.parse(authData);
    if (!auth.authenticated) {
      router.push("/managers/login");
      return;
    }

    setManagerInfo(auth.manager);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToCandidates((data) => {
      setCandidates(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("managerAuth");
    router.push("/managers/login");
  };

  // Filter candidates by interview status
  const scheduledInterviews = candidates.filter(
    (c) => c.interview?.status === "Scheduled"
  );
  const inProgressInterviews = candidates.filter(
    (c) => c.interview?.status === "In Progress"
  );
  const completedInterviews = candidates.filter(
    (c) => c.interview?.status === "Completed"
  );
  const needsScheduling = candidates.filter(
    (c) => c.interview?.status === "Not Started" || !c.interview?.status
  );

  // Calculate statistics
  const passRate =
    completedInterviews.length > 0
      ? Math.round(
          (completedInterviews.filter((c) => c.interview?.result === "Passed")
            .length /
            completedInterviews.length) *
            100
        )
      : 0;

  const avgScore =
    completedInterviews.length > 0
      ? (
          completedInterviews
            .filter((c) => c.interview?.compositeScore)
            .reduce((sum, c) => sum + (c.interview?.compositeScore || 0), 0) /
          completedInterviews.filter((c) => c.interview?.compositeScore).length
        ).toFixed(1)
      : "N/A";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading interview dashboard...</div>
      </div>
    );
  }

  const InterviewCard = ({ candidate }: { candidate: Candidate }) => {
    const isPassing = (candidate.interview?.compositeScore || 0) >= 4;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {candidate.personalInfo.name}
              </h3>
              <p className="text-sm text-gray-500">
                {candidate.personalInfo.email}
              </p>
              <p className="text-sm text-gray-500">
                {candidate.callCenter.replace("_", " ")} •{" "}
                {candidate.licenseStatus}
              </p>
            </div>
            {candidate.interview?.status === "Completed" && (
              <Badge
                variant={
                  candidate.interview.result === "Passed"
                    ? "default"
                    : "destructive"
                }
              >
                {candidate.interview.result}
              </Badge>
            )}
          </div>

          {/* Interview Details */}
          <div className="space-y-3">
            {candidate.interview?.scheduledDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  Scheduled: {formatDateTime(candidate.interview.scheduledDate)}
                </span>
              </div>
            )}

            {candidate.interview?.compositeScore && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-sm font-medium">Composite Score:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-bold ${
                      isPassing ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {candidate.interview.compositeScore.toFixed(1)}/5.0
                  </span>
                  {isPassing ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            )}

            {candidate.interview?.evaluations &&
              candidate.interview.evaluations.length > 0 && (
                <div className="text-sm text-gray-600">
                  {candidate.interview.evaluations.length} evaluation(s)
                  submitted
                </div>
              )}
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <Link href={`/managers/interview/${candidate.id}`}>
              <Button
                className="w-full"
                variant={
                  candidate.interview?.status === "Scheduled"
                    ? "default"
                    : candidate.interview?.status === "In Progress"
                    ? "secondary"
                    : "outline"
                }
              >
                {candidate.interview?.status === "Scheduled" &&
                  "Start Interview"}
                {candidate.interview?.status === "In Progress" &&
                  "Continue Interview"}
                {candidate.interview?.status === "Completed" && "View Results"}
                {(!candidate.interview?.status ||
                  candidate.interview.status === "Not Started") &&
                  "Schedule Interview"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Interview Management
        </h1>
        <p className="text-gray-500">
          Conduct interviews and evaluate candidates
        </p>
      </div>

      {/* Manager Info */}
      {managerInfo && (
        <Alert variant="default" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">
                {managerInfo.name} ({managerInfo.role})
              </p>
              <p className="text-sm text-gray-700">{managerInfo.location}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Scheduled Today
                </p>
                <p className="text-2xl font-bold">
                  {
                    scheduledInterviews.filter((c) => {
                      const scheduled = c.interview?.scheduledDate;
                      if (!scheduled) return false;
                      const today = new Date();
                      const schedDate = new Date(scheduled);
                      return schedDate.toDateString() === today.toDateString();
                    }).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {inProgressInterviews.length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold">{passRate}%</p>
                <p className="text-xs text-gray-500">Min score: 4.0/5.0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{avgScore}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for High-Scoring Candidates */}
      {completedInterviews.filter(
        (c) =>
          c.interview?.result === "Passed" &&
          (c.interview?.compositeScore || 0) >= 4
      ).length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  {
                    completedInterviews.filter(
                      (c) =>
                        c.interview?.result === "Passed" &&
                        (c.interview?.compositeScore || 0) >= 4
                    ).length
                  }{" "}
                  candidate(s) ready for next steps
                </p>
                <p className="text-sm text-green-700">
                  These candidates scored 4.0 or higher and are approved for
                  onboarding
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="needs-scheduling">
            Needs Scheduling ({needsScheduling.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledInterviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No scheduled interviews</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scheduledInterviews.map((candidate) => (
                <InterviewCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressInterviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No interviews in progress</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressInterviews.map((candidate) => (
                <InterviewCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="needs-scheduling" className="space-y-4">
          {needsScheduling.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No candidates need scheduling</p>
                <p className="text-sm text-gray-400 mt-2">
                  All active candidates have either been scheduled or completed
                  their interviews.
                </p>
                <Link href="/candidates/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    Add New Candidate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {needsScheduling.map((candidate) => (
                <InterviewCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedInterviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No completed interviews</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedInterviews
                .sort((a, b) => {
                  const dateA = a.interview?.completedDate || new Date(0);
                  const dateB = b.interview?.completedDate || new Date(0);
                  return new Date(dateB).getTime() - new Date(dateA).getTime();
                })
                .map((candidate) => (
                  <InterviewCard key={candidate.id} candidate={candidate} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
