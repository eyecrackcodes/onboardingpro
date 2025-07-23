"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Users, Calendar, GraduationCap } from "lucide-react";
import Link from "next/link";
import {
  createCohort,
  getTrainers,
  getCandidates,
  updateCandidate,
} from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import { getAllCohortOptions, COHORT_START_DATES } from "@/lib/cohort-dates";
import type { Cohort, Trainer, Candidate } from "@/lib/types";

export default function NewCohortPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const cohortOptions = getAllCohortOptions();

  const [formData, setFormData] = useState({
    name: "",
    callCenter: "CLT" as "CLT" | "ATX",
    classType: "UNL" as "UNL" | "AGENT",
    trainerId: "",
    startDate: "", // Will be set from predefined options
  });

  useEffect(() => {
    fetchData();
  }, [formData.callCenter, formData.classType]);

  const fetchData = async () => {
    try {
      console.log("[CohortCreation] Fetching trainers for:", {
        callCenter: formData.callCenter,
        isActive: true,
      });

      // Fetch trainers for the selected call center
      const trainersData = await getTrainers({
        callCenter: formData.callCenter,
        isActive: true,
      });

      console.log("[CohortCreation] Fetched trainers:", trainersData);
      setTrainers(trainersData);

      // Fetch candidates that are ready for class assignment (optional)
      const candidatesData = await getCandidates({
        callCenter: formData.callCenter,
        status: "Active",
      });

      // Filter candidates based on class type and readiness
      const eligibleCandidates = candidatesData.filter((c) => {
        // Check if candidate has a matching class assignment
        const hasMatchingClassType =
          c.classAssignment?.classType === formData.classType;

        if (formData.classType === "UNL") {
          return (
            hasMatchingClassType &&
            c.licenseStatus === "Unlicensed" &&
            c.backgroundCheck.status === "Completed" &&
            c.offers.preLicenseOffer.signed &&
            !c.classAssignment.startDate // Not already assigned to a specific date
          );
        } else {
          return (
            hasMatchingClassType &&
            c.licenseStatus === "Licensed" &&
            c.offers.fullAgentOffer.signed &&
            !c.classAssignment.startDate // Not already assigned to a specific date
          );
        }
      });

      setCandidates(eligibleCandidates);
      console.log(
        "[CohortCreation] Found eligible candidates:",
        eligibleCandidates.length
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate) {
      alert("Please select a start date from the predefined options");
      return;
    }

    if (!formData.trainerId) {
      alert("Please select a trainer for the cohort");
      return;
    }

    setLoading(true);

    try {
      // Find the selected trainer
      const trainer = trainers.find((t) => t.id === formData.trainerId);
      if (!trainer) {
        throw new Error("Trainer not found");
      }

      // Use the predefined start date
      const startDate = new Date(formData.startDate + "T00:00:00");

      // Calculate expected end date (9 weeks from start)
      const expectedEndDate = new Date(startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 63); // 9 weeks

      // Create the cohort
      const newCohort: Omit<Cohort, "id" | "createdAt" | "updatedAt"> = {
        name: formData.name,
        callCenter: formData.callCenter,
        classType: formData.classType,
        currentStage: "START",
        weekNumber: 1,
        startDate,
        expectedEndDate,
        trainer: {
          name: trainer.name,
          type: trainer.type,
          contact: trainer.email,
        },
        participants: selectedCandidates,
        performance: {
          metrics: "",
          notes: "",
        },
        milestones: [],
        status: "Active",
      };

      console.log("[CohortCreation] Creating cohort:", {
        name: formData.name,
        startDate: startDate.toLocaleDateString(),
        classType: formData.classType,
        trainer: trainer.name,
        participantCount: selectedCandidates.length,
      });

      const cohortId = await createCohort(newCohort);

      // Update each selected candidate with class assignment
      for (const candidateId of selectedCandidates) {
        await updateCandidate(candidateId, {
          classAssignment: {
            startDate: startDate,
            startConfirmed: true,
          },
        } as any);
      }

      console.log(
        "[CohortCreation] ✅ Cohort created successfully with ID:",
        cohortId
      );
      alert(
        `Cohort created successfully! ${selectedCandidates.length} candidates assigned.`
      );
      router.push("/cohorts");
    } catch (error) {
      console.error("Error creating cohort:", error);
      alert("Failed to create cohort. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelection = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates((prev) => [...prev, candidateId]);
    } else {
      setSelectedCandidates((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  // Filter cohort options based on class type
  const availableStartDates = cohortOptions.filter(
    (option) => option.classType === formData.classType
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cohorts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Cohort
            </h1>
            <p className="text-gray-500">
              Set up a new training cohort with predefined start dates
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Cohort Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Cohort Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., UNL-August-2025-CLT"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callCenter">Call Center</Label>
                <Select
                  value={formData.callCenter}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      callCenter: value as "CLT" | "ATX",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">Charlotte (CLT)</SelectItem>
                    <SelectItem value="ATX">Austin (ATX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classType">Class Type</Label>
                <Select
                  value={formData.classType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      classType: value as "UNL" | "AGENT",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNL">Unlicensed (UNL)</SelectItem>
                    <SelectItem value="AGENT">
                      Licensed Agent (AGENT)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Select
                  value={formData.startDate}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, startDate: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select from predefined dates" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStartDates.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label.replace(
                          `${
                            formData.classType === "AGENT"
                              ? "Licensed"
                              : "Unlicensed"
                          } Agent - `,
                          ""
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  These are the predefined class start dates. You cannot create
                  custom dates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trainer Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Trainer Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trainers.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="trainer">Select Trainer</Label>
                <Select
                  value={formData.trainerId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, trainerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name} ({trainer.type}) - {trainer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  No trainers available for {formData.callCenter}
                </p>
                <Link href="/trainers/new">
                  <Button variant="outline" className="mt-2">
                    Add Trainer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Selection (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Candidate Assignment (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidates.length > 0 ? (
              <div className="space-y-2">
                <Label>Select Candidates for this Cohort</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        id={candidate.id}
                        checked={selectedCandidates.includes(candidate.id)}
                        onCheckedChange={(checked) =>
                          handleCandidateSelection(
                            candidate.id,
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor={candidate.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span>{candidate.personalInfo.name}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {candidate.licenseStatus}
                            </Badge>
                            <Badge variant="secondary">
                              {candidate.callCenter}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.personalInfo.email}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {selectedCandidates.length} candidate(s) selected. You can add
                  more candidates later.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  No eligible candidates found for {formData.classType} in{" "}
                  {formData.callCenter}.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  You can create the cohort now and add candidates later when
                  they&apos;re ready.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/cohorts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Cohort"}
          </Button>
        </div>
      </form>
    </div>
  );
}
