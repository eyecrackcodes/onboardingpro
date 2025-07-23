"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Users,
  Calendar,
  Plus,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getCohorts, subscribeToCohorts } from "@/lib/firestore";
import {
  getCohortProgress,
  getStageDisplayName,
  formatDate,
} from "@/lib/utils";
import type { Cohort } from "@/lib/types";

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<
    "all" | "CLT" | "ATX"
  >("all");

  useEffect(() => {
    // Initial data fetch
    const fetchData = async () => {
      try {
        const data = await getCohorts();
        setCohorts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching cohorts:", error);
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener
    const unsubscribe = subscribeToCohorts(setCohorts);

    return () => unsubscribe();
  }, []);

  const filteredCohorts =
    selectedCenter === "all"
      ? cohorts
      : cohorts.filter((c) => c.callCenter === selectedCenter);

  const activeCohorts = filteredCohorts.filter((c) => c.status === "Active");
  const completedCohorts = filteredCohorts.filter(
    (c) => c.status === "Completed"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cohorts...</div>
      </div>
    );
  }

  const CohortCard = ({ cohort }: { cohort: Cohort }) => {
    const progress = getCohortProgress(cohort.currentStage);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{cohort.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {cohort.classType} • {cohort.callCenter}
              </p>
            </div>
            <Badge
              variant={cohort.status === "Active" ? "default" : "secondary"}
            >
              {cohort.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {getStageDisplayName(cohort.currentStage)}
              </span>
              <span className="text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>{cohort.participants.length} agents</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Week {cohort.weekNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <span>
                {cohort.trainer.name} ({cohort.trainer.type})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{formatDate(cohort.startDate)}</span>
            </div>
          </div>

          {/* Performance Metrics */}
          {cohort.performance.metrics && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Performance:</span>
                <span className="text-gray-600">
                  {cohort.performance.metrics}
                </span>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Link href={`/cohorts/${cohort.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cohorts</h1>
          <p className="text-gray-500">
            Manage training cohorts across call centers
          </p>
        </div>
        <Link href="/cohorts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Cohort
          </Button>
        </Link>
      </div>

      {/* Tabs for Call Centers */}
      <Tabs
        value={selectedCenter}
        onValueChange={(value) => setSelectedCenter(value as any)}
      >
        <TabsList>
          <TabsTrigger value="all">All Centers ({cohorts.length})</TabsTrigger>
                      <TabsTrigger value="CLT">
              Charlotte (
              {cohorts.filter((c) => c.callCenter === "CLT").length})
            </TabsTrigger>
            <TabsTrigger value="ATX">
              Austin (
              {cohorts.filter((c) => c.callCenter === "ATX").length})
            </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCenter} className="space-y-6 mt-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Cohorts
                    </p>
                    <p className="text-2xl font-bold">{activeCohorts.length}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Agents
                    </p>
                    <p className="text-2xl font-bold">
                      {activeCohorts.reduce(
                        (sum, c) => sum + c.participants.length,
                        0
                      )}
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
                      Completed
                    </p>
                    <p className="text-2xl font-bold">
                      {completedCohorts.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avg. Size
                    </p>
                    <p className="text-2xl font-bold">
                      {activeCohorts.length > 0
                        ? Math.round(
                            activeCohorts.reduce(
                              (sum, c) => sum + c.participants.length,
                              0
                            ) / activeCohorts.length
                          )
                        : 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Cohorts */}
          {activeCohorts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Cohorts</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeCohorts.map((cohort) => (
                  <CohortCard key={cohort.id} cohort={cohort} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Cohorts */}
          {completedCohorts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Completed Cohorts</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedCohorts.map((cohort) => (
                  <CohortCard key={cohort.id} cohort={cohort} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredCohorts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No cohorts found
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedCenter === "all"
                    ? "Get started by creating your first training cohort."
                    : `No cohorts found for ${selectedCenter.replace(
                        "_",
                        " "
                      )}.`}
                </p>
                {selectedCenter === "all" && (
                  <Link href="/cohorts/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Cohort
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
