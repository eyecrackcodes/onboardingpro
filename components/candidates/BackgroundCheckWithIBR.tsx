import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Upload,
  ExternalLink,
  Shield,
  Send,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Candidate } from "@/lib/types";
import {
  submitBackgroundCheck,
  checkBackgroundStatus,
  attachReleaseForm,
  getBackgroundReport,
} from "@/lib/ibr-api";
import { monitorCandidate } from "@/lib/background-check-monitor";
import { triggerManualCheck } from "@/lib/background-check-monitor";
import { BackgroundCheckReleaseForm } from "./BackgroundCheckReleaseForm";

interface BackgroundCheckWithIBRProps {
  candidate: Candidate;
  onUpdate: (updates: Partial<Candidate>) => void;
}

export function BackgroundCheckWithIBR({
  candidate,
  onUpdate,
}: BackgroundCheckWithIBRProps) {
  const [loading, setLoading] = useState(false);
  const [releaseFile, setReleaseFile] = useState<File | null>(null);
  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);
  const [showStatusResult, setShowStatusResult] = useState(false);

  // Pre-fill with test data in development mode
  const isDevMode = process.env.NODE_ENV === "development";
  const [additionalInfo, setAdditionalInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    ssn: isDevMode ? "555123456" : "",
    address: isDevMode ? "123 Test Street" : "",
    city: isDevMode ? "Tampa" : "",
    state: isDevMode ? "FL" : "",
    zipcode: isDevMode ? "33601" : "",
    county: isDevMode ? "Hillsborough" : "",
    dob: isDevMode ? "1990-01-01" : "",
    gender: "" as "M" | "F" | "",
  });

  // Parse candidate name on mount
  useEffect(() => {
    if (candidate.personalInfo.name) {
      const nameParts = candidate.personalInfo.name.trim().split(/\s+/);
      if (nameParts.length === 1) {
        setAdditionalInfo((prev) => ({
          ...prev,
          firstName: nameParts[0],
          lastName: "",
        }));
      } else if (nameParts.length === 2) {
        setAdditionalInfo((prev) => ({
          ...prev,
          firstName: nameParts[0],
          lastName: nameParts[1],
        }));
      } else {
        setAdditionalInfo((prev) => ({
          ...prev,
          firstName: nameParts[0],
          middleName: nameParts.slice(1, -1).join(" "),
          lastName: nameParts[nameParts.length - 1],
        }));
      }
    }
  }, [candidate.personalInfo.name]);

  const bgCheck = candidate.backgroundCheck;
  const interviewPassed =
    candidate.interview?.status === "Completed" &&
    candidate.interview?.result === "Passed" &&
    (candidate.interview?.compositeScore || 0) >= 4.0;

  const handleInitiateCheck = async () => {
    if (!additionalInfo.firstName || !additionalInfo.lastName) {
      alert("Please enter first and last name");
      return;
    }

    if (!additionalInfo.ssn) {
      alert("Please enter SSN to proceed with background check");
      return;
    }

    if (!releaseFile) {
      alert("Please upload a signed release form");
      return;
    }

    console.log("Initiating background check with data:", {
      candidateId: candidate.id,
      candidateName: candidate.personalInfo.name,
      ssn: additionalInfo.ssn.substring(0, 3) + "****",
      dob: additionalInfo.dob,
      address: additionalInfo.address,
      city: additionalInfo.city,
      state: additionalInfo.state,
      zipcode: additionalInfo.zipcode,
    });

    setLoading(true);
    try {
      // Format DOB from YYYY-MM-DD to YYYYMMDD
      const formattedDob = additionalInfo.dob.replace(/-/g, "");

      // Submit to IBR with actual form data
      const result = await submitBackgroundCheck(candidate, {
        firstName: additionalInfo.firstName,
        middleName: additionalInfo.middleName,
        lastName: additionalInfo.lastName,
        ssn: additionalInfo.ssn,
        dob: formattedDob,
        address: {
          addr1: additionalInfo.address,
          city: additionalInfo.city,
          state: additionalInfo.state,
          zipcode: additionalInfo.zipcode,
        },
        gender: additionalInfo.gender as "M" | "F" | undefined,
      });

      console.log("Background check submission result:", result);

      if (result.success && result.ibrId) {
        // Attach release form
        console.log("Attaching release form for IBR ID:", result.ibrId);
        const attachResult = await attachReleaseForm(result.ibrId, releaseFile);
        console.log("Release form attachment result:", attachResult);

        // Update candidate with IBR ID
        const updatedCheck = {
          ...bgCheck,
          initiated: true,
          status: "In Progress" as const,
          ibrId: result.ibrId,
        };
        // Remove undefined values
        Object.keys(updatedCheck).forEach((key) => {
          if (updatedCheck[key as keyof typeof updatedCheck] === undefined) {
            delete updatedCheck[key as keyof typeof updatedCheck];
          }
        });

        onUpdate({
          backgroundCheck: updatedCheck,
        });

        // Start monitoring this candidate's background check
        await monitorCandidate(candidate.id, result.ibrId);

        alert(
          `Background check initiated successfully. IBR ID: ${result.ibrId}`
        );
      } else {
        console.error("Failed to initiate background check:", result.error);
        alert(`Failed to initiate background check: ${result.error}`);
      }
    } catch (error) {
      console.error("Error initiating background check:", error);
      alert(
        "Failed to initiate background check: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!bgCheck.ibrId) return;

    setLoading(true);
    setStatusResult(null);
    try {
      const statuses = await checkBackgroundStatus([bgCheck.ibrId]);

      let resultMessage = `IBR Background Check Status Report\n`;
      resultMessage += `${"=".repeat(50)}\n\n`;
      resultMessage += `IBR ID: ${bgCheck.ibrId}\n`;

      if (statuses.length > 0) {
        const status = statuses[0];

        // Overall Status
        resultMessage += `Overall Status: ${status.status}\n`;
        if (status.clientId) {
          resultMessage += `Client ID: ${status.clientId}\n`;
        }

        // Timestamps if available
        if (status.timestamps?.submitted) {
          resultMessage += `Submitted: ${status.timestamps.submitted}\n`;
        }
        if (status.timestamps?.completed) {
          resultMessage += `Completed: ${status.timestamps.completed}\n`;
        }

        // Extended Status Details
        if (status.extended && Object.keys(status.extended).length > 0) {
          resultMessage += `\nDetailed Section Results:\n`;
          resultMessage += `${"-".repeat(30)}\n`;

          // Map section names to user-friendly labels
          const sectionLabels: Record<string, string> = {
            credit: "Credit Check",
            federal: "Federal Criminal Records",
            state: "State Criminal Records",
            social: "Social Security Verification",
            pdb: "Patriot Database Check",
            sex_offender: "Sex Offender Registry",
            drug: "Drug Screening",
            employment: "Employment Verification",
            education: "Education Verification",
          };

          Object.entries(status.extended).forEach(
            ([section, sectionStatus]) => {
              const label = sectionLabels[section] || section.toUpperCase();
              const statusIcon =
                sectionStatus === "Pass"
                  ? "✅"
                  : sectionStatus === "Fail"
                  ? "❌"
                  : sectionStatus === "Review"
                  ? "⚠️"
                  : "❓";
              resultMessage += `  ${statusIcon} ${label}: ${sectionStatus}\n`;
            }
          );
        } else {
          resultMessage += `\nNo detailed section results available yet.\n`;
        }

        // Report URL if available
        if (status.reportUrl) {
          resultMessage += `\nFull Report: ${status.reportUrl}\n`;
        }

        // Determine app status mapping
        let newStatus: typeof bgCheck.status = "In Progress";
        let passed: boolean | undefined = undefined;

        if (status.status === "Pass") {
          newStatus = "Completed";
          passed = true;
        } else if (status.status === "Fail") {
          newStatus = "Failed";
          passed = false;
        } else if (status.status === "Review") {
          newStatus = "In Progress";
          // Check if any sections failed
          if (status.extended) {
            const hasFail = Object.values(status.extended).includes("Fail");
            if (hasFail) {
              newStatus = "Failed";
              passed = false;
            }
          }
        }

        // Status Summary
        resultMessage += `\nStatus Summary:\n`;
        resultMessage += `${"-".repeat(20)}\n`;
        resultMessage += `Application Status: ${newStatus}\n`;
        if (passed !== undefined) {
          resultMessage += `Overall Result: ${passed ? "PASSED" : "FAILED"}\n`;
        }

        // Recommendations
        if (
          status.status === "Review" ||
          Object.values(status.extended || {}).includes("Review")
        ) {
          resultMessage += `\n⚠️  MANUAL REVIEW REQUIRED\n`;
          resultMessage += `Some sections require manual review by HR.\n`;
        } else if (
          status.status === "Fail" ||
          Object.values(status.extended || {}).includes("Fail")
        ) {
          resultMessage += `\n❌ BACKGROUND CHECK FAILED\n`;
          resultMessage += `Candidate may not be eligible for hiring.\n`;
        } else if (status.status === "Pass") {
          resultMessage += `\n✅ BACKGROUND CHECK PASSED\n`;
          resultMessage += `Candidate cleared for employment.\n`;
        }

        // Update the candidate's background check data
        const updatedCheck: any = {
          ...bgCheck,
          status: newStatus,
          lastCheckedAt: new Date(),
        };

        // Only add fields that are not undefined
        if (status.extended) {
          updatedCheck.extendedStatuses = status.extended;
        }
        if (status.reportUrl) {
          updatedCheck.reportUrl = status.reportUrl;
        }
        if (status.timestamps) {
          updatedCheck.timestamps = status.timestamps;
        }

        if (passed !== undefined) {
          updatedCheck.passed = passed;
          if (passed) {
            updatedCheck.passedAt = new Date();
          } else {
            updatedCheck.failedAt = new Date();
          }
        }

        onUpdate({
          backgroundCheck: updatedCheck,
        });
      } else {
        resultMessage += `No status information available.\n`;
        resultMessage += `\nThis could mean:\n`;
        resultMessage += `• The IBR ID is invalid\n`;
        resultMessage += `• The request is still being processed\n`;
        resultMessage += `• There's a connection issue with IBR\n`;
      }

      setStatusResult(resultMessage);
      setShowStatusResult(true);
    } catch (error) {
      console.error("Error checking status:", error);
      setStatusResult(
        `Error checking background status:\n\n${
          error instanceof Error ? error.message : "Unknown error occurred"
        }\n\nPlease try again or contact support if the issue persists.`
      );
      setShowStatusResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!bgCheck.ibrId) return;

    setLoading(true);
    try {
      const blob = await getBackgroundReport(bgCheck.ibrId);

      if (blob) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `background-check-${candidate.personalInfo.name.replace(
          /\s+/g,
          "-"
        )}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download background check report");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setLoading(true);
    setStatusResult(null);

    try {
      console.log("Manual background check triggered");
      await triggerManualCheck();

      setStatusResult(
        "Manual background check completed successfully.\n\nThis triggered a check for all pending background checks in the system.\n\nCheck the candidate's status for any updates."
      );
      setShowStatusResult(true);
    } catch (error) {
      setStatusResult(
        `Error during manual check: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setShowStatusResult(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Result Modal */}
      {showStatusResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Background Check Status
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStatusResult(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {statusResult}
                </pre>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setShowStatusResult(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Form Modal */}
      {showReleaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <BackgroundCheckReleaseForm
                candidate={candidate}
                onFormGenerated={(file) => {
                  setReleaseFile(file);
                  setShowReleaseForm(false);
                }}
              />
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setShowReleaseForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Prerequisites Check */}
      {!interviewPassed && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Interview Required</p>
                <p className="text-sm text-amber-700">
                  Candidate must pass the interview with a score of 4.0 or
                  higher before initiating background check.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Background Check Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Background Check (IBR)
            </CardTitle>
            <Badge
              variant={
                bgCheck.status === "Completed"
                  ? "default"
                  : bgCheck.status === "Failed"
                  ? "destructive"
                  : bgCheck.status === "In Progress"
                  ? "secondary"
                  : "outline"
              }
            >
              {bgCheck.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual override / initiate toolbar */}
          {!["Completed", "Failed"].includes(bgCheck.status) && (
            <div className="flex gap-2">
              {!bgCheck.initiated && (
                <Button
                  size="sm"
                  onClick={() => {
                    onUpdate({
                      backgroundCheck: {
                        ...bgCheck,
                        initiated: true,
                        status: "In Progress",
                      },
                    });
                  }}
                >
                  <Send className="h-4 w-4 mr-1" /> Initiate
                </Button>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  onUpdate({
                    backgroundCheck: {
                      ...bgCheck,
                      initiated: true,
                      status: "Completed",
                      passed: true as any,
                      completedAt: new Date(),
                    },
                  } as any);
                }}
              >
                Mark Pass
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onUpdate({
                    backgroundCheck: {
                      ...bgCheck,
                      initiated: true,
                      status: "Failed",
                      passed: false as any,
                      failedAt: new Date(),
                    },
                  } as any);
                }}
              >
                Mark Fail
              </Button>
            </div>
          )}

          {bgCheck.ibrId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">IBR Reference ID</p>
                  <p className="font-mono text-lg">{bgCheck.ibrId}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckStatus}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Force Status Check"
                  )}
                </Button>
              </div>
            </div>
          )}

          {!bgCheck.initiated && !bgCheck.ibrId ? (
            <div className="space-y-4">
              {/* Additional Information Form */}
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name*</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={additionalInfo.firstName}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        firstName: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    type="text"
                    placeholder="Middle name (optional)"
                    value={additionalInfo.middleName}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        middleName: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name*</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={additionalInfo.lastName}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        lastName: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ssn">Social Security Number*</Label>
                  <Input
                    id="ssn"
                    type="password"
                    placeholder="XXX-XX-XXXX"
                    value={additionalInfo.ssn}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        ssn: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth*</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={additionalInfo.dob}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        dob: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address*</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={additionalInfo.address}
                  onChange={(e) =>
                    setAdditionalInfo({
                      ...additionalInfo,
                      address: e.target.value,
                    })
                  }
                  disabled={!interviewPassed}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    value={additionalInfo.city}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        city: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State*</Label>
                  <Input
                    id="state"
                    placeholder="FL"
                    maxLength={2}
                    value={additionalInfo.state}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        state: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipcode">ZIP Code*</Label>
                  <Input
                    id="zipcode"
                    placeholder="12345"
                    value={additionalInfo.zipcode}
                    onChange={(e) =>
                      setAdditionalInfo({
                        ...additionalInfo,
                        zipcode: e.target.value,
                      })
                    }
                    disabled={!interviewPassed}
                  />
                </div>
              </div>

              {/* Release Form Options */}
              <div className="space-y-2">
                <Label>Background Check Authorization*</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReleaseForm(true)}
                    disabled={!interviewPassed}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Sign Release Form
                  </Button>
                  <div className="flex items-center gap-2">
                    <Input
                      id="release"
                      type="file"
                      accept=".pdf,.doc,.docx,.html"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReleaseFile(file);
                      }}
                      disabled={!interviewPassed}
                      className="max-w-xs"
                    />
                    {releaseFile && (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {releaseFile.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Sign the release form online or upload a signed copy
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleInitiateCheck}
                  disabled={loading || !interviewPassed}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {loading
                    ? "Processing..."
                    : "Submit Background Check Request"}
                </Button>

                {bgCheck.initiated && (
                  <Button
                    variant="outline"
                    onClick={handleManualCheck}
                    disabled={loading}
                    className="whitespace-nowrap"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Check All Pending"
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status and Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Check Status
                    </>
                  )}
                </Button>

                {bgCheck.status === "Completed" && (
                  <Button
                    onClick={handleDownloadReport}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Download Report
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Status Details */}
              {bgCheck.status === "Completed" && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Background Check Passed
                      </p>
                      {bgCheck.passedAt && (
                        <p className="text-sm text-green-700">
                          Completed on {formatDate(bgCheck.passedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {bgCheck.status === "Failed" && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">
                        Background Check Failed
                      </p>
                      <p className="text-sm text-red-700">
                        Please review the report for details
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={bgCheck.notes || ""}
              onChange={(e) =>
                onUpdate({
                  backgroundCheck: {
                    ...bgCheck,
                    notes: e.target.value,
                  },
                })
              }
              placeholder="Add any additional notes about the background check..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
