import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { InterviewEvaluation } from "@/lib/types";

interface InterviewEvaluationFormProps {
  onSubmit: (evaluation: Omit<InterviewEvaluation, "id">) => void;
  onCancel: () => void;
}

export function InterviewEvaluationForm({
  onSubmit,
  onCancel,
}: InterviewEvaluationFormProps) {
  const [evaluation, setEvaluation] = useState({
    managerName: "",
    managerEmail: "",
    scores: {
      communication: 3,
      technicalSkills: 3,
      customerService: 3,
      problemSolving: 3,
      cultureFit: 3,
    },
    notes: "",
    recommendation: "Neutral" as InterviewEvaluation["recommendation"],
    strengths: "",
    concerns: "",
  });

  const scoreLabels = {
    communication: "Communication Skills",
    technicalSkills: "Technical Skills",
    customerService: "Customer Service",
    problemSolving: "Problem Solving",
    cultureFit: "Culture Fit",
  };

  const calculateAverageScore = () => {
    const scores = Object.values(evaluation.scores);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  };

  const handleScoreChange = (
    category: keyof typeof evaluation.scores,
    value: string
  ) => {
    setEvaluation((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [category]: parseInt(value),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEvaluation: Omit<InterviewEvaluation, "id"> = {
      managerId: `manager-${Date.now()}`, // In a real app, this would be the logged-in user's ID
      managerName: evaluation.managerName,
      managerEmail: evaluation.managerEmail,
      evaluationDate: new Date(),
      scores: evaluation.scores,
      averageScore: calculateAverageScore(),
      notes: evaluation.notes,
      recommendation: evaluation.recommendation,
      strengths: evaluation.strengths,
      concerns: evaluation.concerns,
    };

    onSubmit(newEvaluation);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add Interview Evaluation</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Manager Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="managerName">Interviewer Name*</Label>
              <Input
                id="managerName"
                value={evaluation.managerName}
                onChange={(e) =>
                  setEvaluation({ ...evaluation, managerName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerEmail">Interviewer Email*</Label>
              <Input
                id="managerEmail"
                type="email"
                value={evaluation.managerEmail}
                onChange={(e) =>
                  setEvaluation({ ...evaluation, managerEmail: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Scoring Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Evaluation Scores</h4>
            <div className="space-y-3">
              {Object.entries(scoreLabels).map(([key, label]) => (
                <div key={key} className="grid grid-cols-2 gap-4 items-center">
                  <Label>{label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={
                        evaluation.scores[key as keyof typeof evaluation.scores]
                      }
                      onChange={(e) =>
                        handleScoreChange(
                          key as keyof typeof evaluation.scores,
                          e.target.value
                        )
                      }
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-medium">
                      {evaluation.scores[key as keyof typeof evaluation.scores]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Average Score:</span>
                <span className="text-xl font-bold text-blue-600">
                  {calculateAverageScore().toFixed(1)}/5
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="space-y-2">
            <Label htmlFor="recommendation">Overall Recommendation*</Label>
            <Select
              value={evaluation.recommendation}
              onValueChange={(value) =>
                setEvaluation({
                  ...evaluation,
                  recommendation:
                    value as InterviewEvaluation["recommendation"],
                })
              }
            >
              <SelectTrigger id="recommendation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Strongly Recommend">
                  Strongly Recommend
                </SelectItem>
                <SelectItem value="Recommend">Recommend</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Do Not Recommend">
                  Do Not Recommend
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strengths and Concerns */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="strengths">Key Strengths</Label>
              <Textarea
                id="strengths"
                value={evaluation.strengths}
                onChange={(e) =>
                  setEvaluation({ ...evaluation, strengths: e.target.value })
                }
                rows={3}
                placeholder="List the candidate's main strengths..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concerns">Areas of Concern</Label>
              <Textarea
                id="concerns"
                value={evaluation.concerns}
                onChange={(e) =>
                  setEvaluation({ ...evaluation, concerns: e.target.value })
                }
                rows={3}
                placeholder="List any concerns or areas for improvement..."
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={evaluation.notes}
              onChange={(e) =>
                setEvaluation({ ...evaluation, notes: e.target.value })
              }
              rows={4}
              placeholder="Any additional observations or comments..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Evaluation
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
