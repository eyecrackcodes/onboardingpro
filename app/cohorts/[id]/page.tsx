"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  Users,
  Calendar,
  GraduationCap,
  Clock,
  TrendingUp,
  UserPlus,
  UserMinus,
  ChevronRight,
  Edit2,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import {
  getCohort,
  updateCohort,
  getCandidates,
  updateCandidate,
  getTrainers,
} from "@/lib/firestore";
import {
  formatDate,
  getCohortProgress,
  getStageDisplayName,
} from "@/lib/utils";
import type { Cohort, Candidate, Trainer } from "@/lib/types";

export default function CohortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cohortId = params.id as string;
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [participants, setParticipants] = useState<Candidate[]>([]);
  const [availableCandidates, setAvailableCandidates] = useState<Candidate[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    trainerId: "",
    performanceMetrics: "",
    performanceNotes: "",
    status: "Active" as "Active" | "Completed" | "On Hold",
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch cohort data
      const cohortData = await getCohort(cohortId);
      if (!cohortData) {
        alert("Cohort not found");
        router.push("/cohorts");
        return;
      }
      setCohort(cohortData);
      setFormData({
        name: cohortData.name,
        trainerId: "",
        performanceMetrics: cohortData.performance.metrics || "",
        performanceNotes: cohortData.performance.notes || "",
        status: cohortData.status,
      });

      // Fetch participants
      if (cohortData.participants.length > 0) {
        const participantData = await Promise.all(
          cohortData.participants.map(async (id) => {
            const candidates = await getCandidates();
            return candidates.find(c => c.id === id);
          })
        );
        setParticipants(participantData.filter(Boolean) as Candidate[]);
      }

      // Fetch trainers for the cohort's call center
      const trainerData = await getTrainers({
        callCenter: cohortData.callCenter,
        isActive: true,
      });
      setTrainers(trainerData);

      // Fetch available candidates for adding
      const allCandidates = await getCandidates({
        callCenter: cohortData.callCenter,
        status: "Active",
      });
      
      // Filter candidates that can be added to this cohort
      const eligible = allCandidates.filter(c => {
        // Must not already be in this cohort
        if (cohortData.participants.includes(c.id)) return false;
        
        // Must match the class type
        if (cohortData.classType === "UNL") {
          // For unlicensed classes: require pre-license offer signed
          return (
            c.licenseStatus === "Unlicensed" &&
            c.backgroundCheck.status === "Completed" &&
            c.offers.preLicenseOffer.signed &&
            (!c.classAssignment.startDate || !c.classAssignment.startConfirmed)
          );
        } else {
          // For licensed classes: only require license status, no offer requirement
          return (
            c.licenseStatus === "Licensed" &&
            c.backgroundCheck.status === "Completed" &&
            (!c.classAssignment.startDate || !c.classAssignment.startConfirmed)
          );
        }
      });
      
      setAvailableCandidates(eligible);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cohort data:", error);
      alert("Failed to load cohort data");
      setLoading(false);
    }
  }, [cohortId, router]);

  useEffect(() => {
    if (!cohortId) return;
    fetchData();
  }, [cohortId, fetchData]);

  const handleSave = async () => {
    if (!cohort) return;
    
    setSaving(true);
    try {
      // Find trainer details
      const trainer = trainers.find(t => t.id === formData.trainerId) || cohort.trainer;
      
      await updateCohort(cohortId, {
        name: formData.name,
        trainer: formData.trainerId ? {
          name: trainer.name,
          type: trainer.type,
                     contact: (trainer as Trainer).email,
        } : cohort.trainer,
        performance: {
          metrics: formData.performanceMetrics,
          notes: formData.performanceNotes,
          lastUpdated: new Date(),
        },
        status: formData.status,
      });
      
      alert("Cohort updated successfully");
      setEditMode(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error updating cohort:", error);
      alert("Failed to update cohort");
    } finally {
      setSaving(false);
    }
  };

  const handleAddParticipant = async (candidateId: string) => {
    if (!cohort) return;
    
    try {
      // First get the current candidate data
      const allCandidates = await getCandidates();
      const candidate = allCandidates.find(c => c.id === candidateId);
      
      if (!candidate) {
        alert("Candidate not found");
        return;
      }
      
      // Update cohort participants
      await updateCohort(cohortId, {
        participants: [...cohort.participants, candidateId],
      });
      
      // Update candidate's class assignment - preserve existing properties
      await updateCandidate(candidateId, {
        classAssignment: {
          ...candidate.classAssignment, // Preserve existing properties
          startDate: cohort.startDate,
          startConfirmed: true,
          classType: cohort.classType,
        },
      });
      
      alert("Participant added successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error adding participant:", error);
      alert("Failed to add participant");
    }
  };

  const handleRemoveParticipant = async (candidateId: string) => {
    if (!cohort) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to remove this participant from the cohort?"
    );
    if (!confirmed) return;
    
    try {
      // First get the current candidate data
      const allCandidates = await getCandidates();
      const candidate = allCandidates.find(c => c.id === candidateId);
      
      if (!candidate) {
        alert("Candidate not found");
        return;
      }
      
      // Update cohort participants
      await updateCohort(cohortId, {
        participants: cohort.participants.filter(id => id !== candidateId),
      });
      
      // Clear candidate's class assignment - preserve other properties
      await updateCandidate(candidateId, {
        classAssignment: {
          ...candidate.classAssignment, // Preserve existing properties
          startDate: undefined,
          startConfirmed: false,
        },
      });
      
      alert("Participant removed successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error removing participant:", error);
      alert("Failed to remove participant");
    }
  };

  const handleStageUpdate = async (newStage: string, weekNumber: number) => {
    if (!cohort) return;
    
    try {
      await updateCohort(cohortId, {
        currentStage: newStage as any,
        weekNumber,
        milestones: [
          ...cohort.milestones,
          {
            stage: newStage,
            completedAt: new Date(),
            notes: "",
          },
        ],
      });
      
      alert("Stage updated successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating stage:", error);
      alert("Failed to update stage");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cohort...</div>
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cohort not found</div>
      </div>
    );
  }

  const progress = getCohortProgress(cohort.currentStage);
  const stages = [
    "START", "WK_1", "WK_2", "WK_3_CSR", "WK_4_CSR",
    "WK_5_CSR", "WK_6_CSR", "WK_7_A_BAY", "WK_8_A_BAY",
    "WK_9_TEAM", "COMPLETED"
  ];
  const currentStageIndex = stages.indexOf(cohort.currentStage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cohorts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editMode ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-3xl font-bold"
                />
              ) : (
                cohort.name
              )}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge variant={cohort.status === "Active" ? "default" : "secondary"}>
                {cohort.status}
              </Badge>
              <Badge variant="outline">{cohort.callCenter}</Badge>
              <Badge variant="outline">{cohort.classType}</Badge>
              <span className="text-gray-500">
                Started {formatDate(cohort.startDate)}
              </span>
            </div>
          </div>
        </div>
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Cohort
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cohort Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{getStageDisplayName(cohort.currentStage)}</span>
              <span className="text-gray-500">Week {cohort.weekNumber} of 9</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Stage Navigation */}
          {editMode && (
            <div className="flex gap-2 flex-wrap">
              {stages.map((stage, index) => (
                <Button
                  key={stage}
                  size="sm"
                  variant={index === currentStageIndex ? "default" : index < currentStageIndex ? "secondary" : "outline"}
                  onClick={() => handleStageUpdate(stage, index + 1)}
                  disabled={index < currentStageIndex}
                >
                  {getStageDisplayName(stage)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trainer & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Trainer & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trainer</Label>
              {editMode ? (
                <Select
                  value={formData.trainerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trainerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`${cohort.trainer.name} (${cohort.trainer.type})`} />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name} ({trainer.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">
                  {cohort.trainer.name} ({cohort.trainer.type})
                  {cohort.trainer.contact && (
                    <span className="text-gray-500 block">{cohort.trainer.contact}</span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Performance Metrics</Label>
              {editMode ? (
                <Input
                  value={formData.performanceMetrics}
                  onChange={(e) => setFormData(prev => ({ ...prev, performanceMetrics: e.target.value }))}
                  placeholder="e.g., 16%, 1100AP, 60%"
                />
              ) : (
                <p className="text-sm">
                  {cohort.performance.metrics || "No metrics recorded"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Performance Notes</Label>
              {editMode ? (
                <Textarea
                  value={formData.performanceNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, performanceNotes: e.target.value }))}
                  placeholder="Add any performance notes..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {cohort.performance.notes || "No notes"}
                </p>
              )}
            </div>

            {editMode && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Key Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date</span>
              <span className="font-medium">{formatDate(cohort.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected End Date</span>
              <span className="font-medium">{formatDate(cohort.expectedEndDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Duration</span>
              <span className="font-medium">
                {Math.floor((new Date().getTime() - new Date(cohort.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants ({participants.length})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddParticipants(!showAddParticipants)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Participants
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Participants Section */}
          {showAddParticipants && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Available Candidates</h4>
              {availableCandidates.length > 0 ? (
                <div className="space-y-2">
                  {availableCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <p className="font-medium">{candidate.personalInfo.name}</p>
                        <p className="text-sm text-gray-500">
                          {candidate.licenseStatus} • {candidate.callCenter}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddParticipant(candidate.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No eligible candidates available for this cohort
                </p>
              )}
            </div>
          )}

          {/* Current Participants */}
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <Link href={`/candidates/${participant.id}`}>
                    <p className="font-medium hover:text-blue-600">
                      {participant.personalInfo.name}
                    </p>
                  </Link>
                  <p className="text-sm text-gray-500">
                    {participant.personalInfo.email} • {participant.personalInfo.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={participant.readyToGo ? "default" : "secondary"}
                  >
                    {participant.readyToGo ? "Ready" : "In Progress"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveParticipant(participant.id)}
                  >
                    <UserMinus className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No participants in this cohort yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cohort.milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{getStageDisplayName(milestone.stage)}</p>
                  {milestone.notes && (
                    <p className="text-sm text-gray-500">{milestone.notes}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(milestone.completedAt)}
                </span>
              </div>
            ))}
            {cohort.milestones.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No milestones completed yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 