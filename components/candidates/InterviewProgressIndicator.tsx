import React from "react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Star,
} from "lucide-react";
import type { Candidate } from "@/lib/types";

interface InterviewProgressIndicatorProps {
  interview: Candidate["interview"];
  variant?: "compact" | "detailed";
  className?: string;
}

export function InterviewProgressIndicator({
  interview,
  variant = "compact",
  className,
}: InterviewProgressIndicatorProps) {
  // Handle undefined interview
  if (!interview) {
    interview = {
      status: "Not Started",
      evaluations: [],
    };
  }

  const getStatusIcon = () => {
    switch (interview?.status) {
      case "Not Started":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "Scheduled":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "Completed":
        return interview?.result === "Passed" ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        );
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (interview?.status === "Completed") {
      return interview?.result === "Passed"
        ? "text-green-600 bg-green-50"
        : "text-red-600 bg-red-50";
    }
    switch (interview?.status) {
      case "Not Started":
        return "text-gray-600 bg-gray-50";
      case "Scheduled":
        return "text-blue-600 bg-blue-50";
      case "In Progress":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {interview?.status === "Completed" && interview?.result
            ? interview.result
            : interview?.status || "Not Started"}
        </span>
        {interview?.compositeScore && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">
              {interview.compositeScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("rounded-lg p-3", getStatusColor())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">
              {interview?.status === "Completed" && interview?.result
                ? `Interview ${interview.result}`
                : `Interview ${interview?.status || "Not Started"}`}
            </span>
          </div>
          {interview?.evaluations?.length > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">
                {interview.evaluations.length} evaluation
                {interview.evaluations.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {interview?.scheduledDate && interview?.status === "Scheduled" && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Scheduled:</span>{" "}
          {new Date(interview.scheduledDate).toLocaleString()}
        </div>
      )}

      {interview?.completedDate && interview?.status === "Completed" && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Completed:</span>{" "}
          {new Date(interview.completedDate).toLocaleDateString()}
        </div>
      )}

      {interview?.compositeScore && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <span className="text-sm font-medium text-gray-600">
            Composite Score
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= Math.round(interview.compositeScore!)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                )}
              />
            ))}
            <span className="ml-2 text-sm font-bold">
              {interview.compositeScore.toFixed(1)}/5
            </span>
          </div>
        </div>
      )}

      {interview?.evaluations?.length > 0 && variant === "detailed" && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Evaluation Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Strongly Recommend:</span>{" "}
              {
                interview.evaluations.filter(
                  (e) => e.recommendation === "Strongly Recommend"
                ).length
              }
            </div>
            <div>
              <span className="text-gray-600">Recommend:</span>{" "}
              {
                interview.evaluations.filter(
                  (e) => e.recommendation === "Recommend"
                ).length
              }
            </div>
            <div>
              <span className="text-gray-600">Neutral:</span>{" "}
              {
                interview.evaluations.filter(
                  (e) => e.recommendation === "Neutral"
                ).length
              }
            </div>
            <div>
              <span className="text-gray-600">Do Not Recommend:</span>{" "}
              {
                interview.evaluations.filter(
                  (e) => e.recommendation === "Do Not Recommend"
                ).length
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
