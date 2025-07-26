"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { TaskService, type Task } from "@/lib/task-service";

interface TaskQueueProps {
  userId?: string;
}

export function TaskQueue({ userId }: TaskQueueProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">(
    "pending"
  );

  useEffect(() => {
    loadTasks();
  }, [filter, userId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await TaskService.getTasks(userId);

      const filteredTasks = allTasks.filter((task) => {
        if (filter === "pending") return !task.completed;
        if (filter === "completed") return task.completed;
        return true;
      });

      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await TaskService.completeTask(taskId);
      await loadTasks(); // Refresh
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "schedule_interview":
        return <Calendar className="h-4 w-4" />;
      case "schedule_callback":
        return <Phone className="h-4 w-4" />;
      case "send_email":
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (completed: boolean, dueDate?: Date) => {
    if (completed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (dueDate && new Date() > dueDate) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays < 0) {
      return `Overdue by ${Math.abs(diffInDays)} day${
        Math.abs(diffInDays) !== 1 ? "s" : ""
      }`;
    } else if (diffInDays === 0) {
      return "Due today";
    } else if (diffInDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffInDays} days`;
    }
  };

  const pendingCount = tasks.filter((task) => !task.completed).length;
  const overdueCount = tasks.filter(
    (task) => !task.completed && task.dueDate && new Date() > task.dueDate
  ).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading tasks...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Queue
            <div className="flex gap-2">
              <Badge variant="secondary">{pendingCount} pending</Badge>
              {overdueCount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {overdueCount} overdue
                </Badge>
              )}
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex gap-1">
              {(["all", "pending", "completed"] as const).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="text-xs"
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">
              {filter === "completed"
                ? "No completed tasks"
                : "No pending tasks"}
            </p>
            <p className="text-sm">
              {filter === "completed"
                ? "Completed tasks will appear here"
                : "Tasks from call dispositions will appear here"}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              className={`border-l-4 ${
                task.completed
                  ? "border-l-green-500 bg-green-50"
                  : task.dueDate && new Date() > task.dueDate
                  ? "border-l-red-500"
                  : "border-l-blue-500"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center mt-0.5">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() =>
                        !task.completed && handleCompleteTask(task.id!)
                      }
                      disabled={task.completed}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTaskIcon(task.type)}
                        <span
                          className={`font-medium ${
                            task.completed ? "text-gray-500 line-through" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {getStatusIcon(task.completed, task.dueDate)}
                    </div>

                    <p
                      className={`text-sm ${
                        task.completed ? "text-gray-500" : "text-gray-700"
                      }`}
                    >
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong>Candidate:</strong> {task.candidateName}
                        </span>
                        {task.dueDate && (
                          <span
                            className={
                              task.dueDate &&
                              new Date() > task.dueDate &&
                              !task.completed
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      {task.completed && task.completedAt && (
                        <span className="text-green-600">
                          Completed{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
