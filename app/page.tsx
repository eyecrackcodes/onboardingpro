"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Plus,
  Building,
} from "lucide-react";
import Link from "next/link";
import { getCandidates, getCohorts, getTrainers } from "@/lib/firestore";
import { OnboardingFunnel } from "@/components/dashboard/OnboardingFunnel";
import { RecruiterAlerts } from "@/components/dashboard/RecruiterAlerts";
import { BackgroundCheckNotifications } from "@/components/dashboard/BackgroundCheckNotifications";
import type { Candidate, Cohort, Trainer } from "@/lib/types";

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<"all" | "CLT" | "ATX">(
    "all"
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [candidatesData, cohortsData, trainersData] = await Promise.all([
        getCandidates(),
        getCohorts(),
        getTrainers(),
      ]);
      setCandidates(candidatesData);
      setCohorts(cohortsData);
      setTrainers(trainersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  // Filter data based on selected center
  const filteredCandidates =
    selectedCenter === "all"
      ? candidates
      : candidates.filter((c) => c.callCenter === selectedCenter);

  const filteredCohorts =
    selectedCenter === "all"
      ? cohorts
      : cohorts.filter((c) => c.callCenter === selectedCenter);

  const filteredTrainers =
    selectedCenter === "all"
      ? trainers
      : trainers.filter(
          (t) => t.callCenter === selectedCenter || t.callCenter === "Both"
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Calculate stats
  const activeCandidates = filteredCandidates.filter(
    (c) => c.status === "Active"
  );
  const readyCandidates = filteredCandidates.filter((c) => c.readyToGo);
  const pendingBackgroundChecks = filteredCandidates.filter(
    (c) =>
      c.backgroundCheck.status === "Pending" ||
      c.backgroundCheck.status === "In Progress"
  );
  const pendingInterviews = filteredCandidates.filter(
    (c) =>
      c.interview?.status === "Scheduled" ||
      c.interview?.status === "In Progress"
  );
  const completedInterviews = filteredCandidates.filter(
    (c) => c.interview?.status === "Completed"
  );
  const passedInterviews = completedInterviews.filter(
    (c) => c.interview?.result === "Passed"
  );
  const activeCohorts = filteredCohorts.filter((c) => c.status === "Active");
  const activeTrainers = filteredTrainers.filter((t) => t.isActive);

  // Recent activity
  const recentCandidates = [...filteredCandidates]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Call Center Onboarding Overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/candidates/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </Link>
        </div>
      </div>

      {/* Call Center Tabs */}
      <Tabs
        value={selectedCenter}
        onValueChange={(value) =>
          setSelectedCenter(value as "all" | "CLT" | "ATX")
        }
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            All Centers
          </TabsTrigger>
          <TabsTrigger value="CLT" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Charlotte
          </TabsTrigger>
          <TabsTrigger value="ATX" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Austin
          </TabsTrigger>
        </TabsList>

        {/* Show current view */}
        <div className="mt-4">
          <Badge variant="secondary" className="text-sm">
            {selectedCenter === "all"
              ? "Viewing: All Call Centers"
              : selectedCenter === "CLT"
              ? "Viewing: Charlotte (EST)"
              : "Viewing: Austin (CST)"}
          </Badge>
        </div>
      </Tabs>

      {/* Interview Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Interview Pass Rate
                </p>
                <p className="text-2xl font-bold">
                  {completedInterviews.length > 0
                    ? Math.round(
                        (passedInterviews.length / completedInterviews.length) *
                          100
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {passedInterviews.length} of {completedInterviews.length}{" "}
                  passed
                  {selectedCenter !== "all" && ` in ${selectedCenter}`}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Interviews
                </p>
                <p className="text-2xl font-bold">{pendingInterviews.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Scheduled or in progress
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
                <p className="text-sm font-medium text-gray-600">
                  Avg Interview Score
                </p>
                <p className="text-2xl font-bold">
                  {completedInterviews.length > 0
                    ? (
                        completedInterviews
                          .filter((c) => c.interview?.compositeScore)
                          .reduce(
                            (sum, c) =>
                              sum + (c.interview?.compositeScore || 0),
                            0
                          ) /
                          completedInterviews.filter(
                            (c) => c.interview?.compositeScore
                          ).length || 0
                      ).toFixed(1)
                    : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Out of 5.0</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ready to Start
                </p>
                <p className="text-2xl font-bold">{readyCandidates.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Completed onboarding
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruiter Alerts - Show at the top for visibility */}
      <RecruiterAlerts candidates={filteredCandidates} />

      {/* Background Check Notifications */}
      <BackgroundCheckNotifications />

      {/* Onboarding Funnel */}
      <OnboardingFunnel candidates={activeCandidates} />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Candidates
                </p>
                <p className="text-2xl font-bold">{activeCandidates.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {readyCandidates.length} ready to start
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Cohorts
                </p>
                <p className="text-2xl font-bold">{activeCohorts.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCenter === "all"
                    ? "Across both centers"
                    : `In ${selectedCenter}`}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Trainers
                </p>
                <p className="text-2xl font-bold">{activeTrainers.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredTrainers.length} total
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending BG Checks
                </p>
                <p className="text-2xl font-bold">
                  {pendingBackgroundChecks.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInterviews.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {pendingInterviews.length} interview
                    {pendingInterviews.length > 1 ? "s" : ""} pending
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Review scheduled interviews and complete evaluations
                  </p>
                </div>
                <Link href="/candidates">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            )}

            {pendingBackgroundChecks.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    {pendingBackgroundChecks.length} pending background checks
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Review and initiate background checks for new candidates
                  </p>
                </div>
                <Link href="/candidates">
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </Link>
              </div>
            )}

            {readyCandidates.filter((c) => !c.classAssignment.startDate)
              .length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {
                      readyCandidates.filter(
                        (c) => !c.classAssignment.startDate
                      ).length
                    }{" "}
                    candidates ready for class
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Assign these candidates to upcoming cohorts
                  </p>
                </div>
                <Link href="/cohorts/new">
                  <Button size="sm" variant="outline">
                    Create Cohort
                  </Button>
                </Link>
              </div>
            )}

            {activeCohorts.filter((c) => c.weekNumber > 7).length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    {activeCohorts.filter((c) => c.weekNumber > 7).length}{" "}
                    cohorts nearing completion
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Prepare for graduation and final evaluations
                  </p>
                </div>
                <Link href="/cohorts">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Candidates</CardTitle>
            <Link href="/candidates">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{candidate.personalInfo.name}</p>
                    <p className="text-sm text-gray-500">
                      {candidate.callCenter.replace("_", " ")} •{" "}
                      {candidate.licenseStatus}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        candidate.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {candidate.status}
                    </Badge>
                    <Link href={`/candidates/${candidate.id}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {recentCandidates.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No candidates yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/candidates/new">
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </Link>
            <Link href="/cohorts/new">
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Cohort
              </Button>
            </Link>
            <Link href="/trainers/new">
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Trainer
              </Button>
            </Link>
            <Link href="/admin">
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Admin Tools
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
