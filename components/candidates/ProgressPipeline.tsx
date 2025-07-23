import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Stage {
  name: string;
  completed: boolean;
  current: boolean;
  date?: Date;
}

interface ProgressPipelineProps {
  stages: Stage[];
  className?: string;
}

export function ProgressPipeline({ stages, className }: ProgressPipelineProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {stages.map((stage, index) => (
        <div key={stage.name} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                stage.completed
                  ? "bg-green-500 text-white"
                  : stage.current
                  ? "bg-blue-500 text-white ring-4 ring-blue-100"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {stage.completed ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="mt-2 text-center">
              <p
                className={cn(
                  "text-xs font-medium",
                  stage.completed || stage.current
                    ? "text-gray-900"
                    : "text-gray-500"
                )}
              >
                {stage.name}
              </p>
              {stage.date && (
                <p className="text-xs text-gray-500 mt-1">
                  {stage.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          {index < stages.length - 1 && (
            <div
              className={cn(
                "h-1 flex-1 mx-2",
                stage.completed ? "bg-green-500" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Compact version for list views
export function CompactProgressPipeline({ stages }: ProgressPipelineProps) {
  const completedCount = stages.filter((s) => s.completed).length;
  const currentStage = stages.find((s) => s.current)?.name || "Not Started";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className={cn(
              "w-2 h-2 rounded-full",
              stage.completed
                ? "bg-green-500"
                : stage.current
                ? "bg-blue-500"
                : "bg-gray-300",
              index > 0 && "ml-1"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-600">
        {completedCount}/{stages.length} • {currentStage}
      </span>
    </div>
  );
}
