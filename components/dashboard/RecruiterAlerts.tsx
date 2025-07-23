import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Candidate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface RecruiterAlertsProps {
  candidates: Candidate[];
}

export function RecruiterAlerts({ candidates }: RecruiterAlertsProps) {
  // Filter candidates who passed interview with score >= 4.0 and haven't started background check
  const readyForNextSteps = candidates.filter(
    (c) =>
      c.interview?.status === "Completed" &&
      c.interview?.result === "Passed" &&
      (c.interview?.compositeScore || 0) >= 4.0 &&
      (!c.backgroundCheck?.initiated || c.backgroundCheck?.status === "Pending")
  );

  if (readyForNextSteps.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <AlertCircle className="h-5 w-5" />
          Recruiter Action Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-green-800">
            The following candidates have passed their interviews with scores of
            4.0 or higher and are ready for the next steps in the onboarding
            process:
          </p>

          <div className="space-y-3">
            {readyForNextSteps.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white rounded-lg p-4 border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {candidate.personalInfo.name}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {candidate.callCenter.replace("_", " ")}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Score:{" "}
                              {candidate.interview?.compositeScore?.toFixed(1)}
                              /5.0
                            </span>
                          </div>
                          {candidate.interview?.completedDate && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              Interviewed{" "}
                              {formatDate(candidate.interview.completedDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">
                      Ready for Background Check
                    </Badge>
                    <Link href={`/candidates/${candidate.id}`}>
                      <Button size="sm">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Show evaluator recommendations */}
                {candidate.interview?.evaluations &&
                  candidate.interview.evaluations.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600">
                        Evaluated by:{" "}
                        {candidate.interview.evaluations
                          .map((e) => e.managerName)
                          .join(", ")}
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong> Initiate background checks for these
              candidates to continue their onboarding process. Candidates with
              passing scores (4.0+) have been approved by their interviewers for
              hiring.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
