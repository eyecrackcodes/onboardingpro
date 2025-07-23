import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  Loader2,
  RefreshCw,
  Send,
  Shield,
  User,
  Building2,
  CalendarPlus,
  Video,
  Users,
  Plus,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { Candidate } from "@/lib/types";
import { updateCandidate } from "@/lib/firestore";
import InterviewScheduler from "./InterviewScheduler";
import { InterviewProgressIndicator } from "./InterviewProgressIndicator";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { InterviewEvaluation } from "@/lib/types";
import { InterviewEvaluationForm } from "./InterviewEvaluationForm";
import { OfferSender } from "./OfferSender";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SectionProps {
  candidate: Candidate;
  onUpdate: (field: string | Partial<Candidate>, value?: any) => void;
  saving: boolean;
  autoShowScheduler?: boolean;
}

export function BackgroundCheckSection({ candidate, onUpdate }: SectionProps) {
  const bgCheck = candidate.backgroundCheck;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Background Check
          <Badge
            variant={
              bgCheck.status === "Completed"
                ? "default"
                : bgCheck.status === "Failed"
                ? "destructive"
                : "secondary"
            }
          >
            {bgCheck.status}
          </Badge>
        </CardTitle>
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
                  } as any,
                });
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
                  } as any,
                });
              }}
            >
              Mark Fail
            </Button>
          </div>
        )}

        {bgCheck.ibrId && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium">IBR Reference ID</p>
            <p className="font-mono text-lg">{bgCheck.ibrId}</p>

            {/* Extended Status Details */}
            {bgCheck.extendedStatuses &&
              Object.keys(bgCheck.extendedStatuses).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Section Details:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(bgCheck.extendedStatuses).map(
                      ([section, status]) => {
                        const sectionLabels: Record<string, string> = {
                          credit: "Credit",
                          federal: "Federal",
                          state: "State",
                          social: "SSN",
                          pdb: "Patriot DB",
                          sex_offender: "Sex Offender",
                          drug: "Drug Screen",
                          employment: "Employment",
                          education: "Education",
                        };

                        const label = sectionLabels[section] || section;
                        const statusColor =
                          status === "Pass"
                            ? "text-green-600"
                            : status === "Fail"
                            ? "text-red-600"
                            : status === "Review"
                            ? "text-yellow-600"
                            : "text-gray-600";

                        return (
                          <div key={section} className="flex justify-between">
                            <span className="text-gray-600">{label}:</span>
                            <span className={`font-medium ${statusColor}`}>
                              {status}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* Timestamps */}
            {bgCheck.lastCheckedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Last checked: {formatDateTime(bgCheck.lastCheckedAt)}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={bgCheck.status}
              onValueChange={(value) =>
                onUpdate("backgroundCheck.status", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Checkbox
              id="bgInitiated"
              checked={bgCheck.initiated}
              onCheckedChange={(checked) =>
                onUpdate("backgroundCheck.initiated", checked)
              }
            />
            <Label htmlFor="bgInitiated">Background check initiated</Label>
          </div>
        </div>

        {bgCheck.passedAt && (
          <div className="text-sm text-gray-600">
            Passed on: {formatDateTime(bgCheck.passedAt)}
          </div>
        )}

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={bgCheck.notes || ""}
            onChange={(e) => onUpdate("backgroundCheck.notes", e.target.value)}
            placeholder="Add any notes about the background check..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function OffersSection({ candidate, onUpdate }: SectionProps) {
  const [downloading, setDownloading] = useState(false);
  
  // Provide default values if offers is undefined
  const offers = candidate.offers || {
    preLicenseOffer: {
      sent: false,
      signed: false,
      sentAt: undefined as Date | undefined,
      signedAt: undefined as Date | undefined,
    },
    fullAgentOffer: {
      sent: false,
      signed: false,
      sentAt: undefined as Date | undefined,
      signedAt: undefined as Date | undefined,
    },
  };

  const preLicenseOffer = offers.preLicenseOffer;
  const fullAgentOffer = offers.fullAgentOffer;

  const handleDownloadSignedOffer = async (offerType: 'preLicense' | 'fullAgent') => {
    setDownloading(true);
    try {
      // Get the offer document from Firestore to check for download URL or base64
      const offerDoc = await getDoc(doc(db, "offers", candidate.id));
      
      if (!offerDoc.exists()) {
        alert("Offer document not found");
        return;
      }

      const offerData = offerDoc.data();
      
      if (offerData.downloadUrl) {
        // Direct download from Firebase Storage
        window.open(offerData.downloadUrl, "_blank");
      } else if (offerData.signedPdfBase64) {
        // Fallback: Convert base64 to blob and download
        const base64 = offerData.signedPdfBase64;
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `signed-offer-${candidate.personalInfo.name.replace(/\s+/g, '-')}-${offerType}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        alert("Signed document not available for download");
      }
    } catch (error) {
      console.error("Error downloading signed offer:", error);
      alert("Failed to download signed offer. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pre-License Offer */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-License Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {offers.preLicenseOffer.sent ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    offers.preLicenseOffer.signed ? "default" : "secondary"
                  }
                >
                  {offers.preLicenseOffer.signed ? "Signed" : "Sent"}
                </Badge>
                {offers.preLicenseOffer.sentAt && (
                  <span className="text-xs text-gray-500">
                    Sent {formatDate(offers.preLicenseOffer.sentAt)}
                  </span>
                )}
                {offers.preLicenseOffer.signedAt && (
                  <span className="text-xs text-gray-500">
                    • Signed {formatDate(offers.preLicenseOffer.signedAt)}
                  </span>
                )}
              </div>
              
              {/* Download button for signed offers */}
              {offers.preLicenseOffer.signed && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadSignedOffer('preLicense')}
                    variant="outline"
                    size="sm"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Signed Offer
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`/offer/${candidate.id}`, "_blank")}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Offer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <OfferSender candidate={candidate} />
          )}
        </CardContent>
      </Card>

      {/* Full Agent Offer */}
      <Card>
        <CardHeader>
          <CardTitle>Full Agent Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fullAgentOffer.sent ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={fullAgentOffer.signed ? "default" : "secondary"}>
                  {fullAgentOffer.signed ? "Signed" : "Sent"}
                </Badge>
                {fullAgentOffer.sentAt && (
                  <span className="text-xs text-gray-500">
                    Sent {formatDate(fullAgentOffer.sentAt)}
                  </span>
                )}
                {fullAgentOffer.signedAt && (
                  <span className="text-xs text-gray-500">
                    • Signed {formatDate(fullAgentOffer.signedAt)}
                  </span>
                )}
              </div>
              
              {/* Download button for signed full agent offers */}
              {fullAgentOffer.signed && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadSignedOffer('fullAgent')}
                    variant="outline"
                    size="sm"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Signed Offer
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={() => onUpdate("offers.fullAgentOffer.sent", true)}
            >
              Send Full Agent Offer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function LicensingSection({ candidate, onUpdate }: SectionProps) {
  // Ensure candidate exists and has proper structure
  if (!candidate) {
    return null;
  }

  const licensing = candidate.licensing || {
    licenseObtained: false,
    licensePassed: false,
    licensePassedAt: undefined,
    examAttempts: 0,
    notes: "",
    unlicensedStartDate: undefined,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Licensing Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium">Current License Status</div>
          <div className="text-2xl font-bold mt-1">
            {candidate.licenseStatus || "Unknown"}
          </div>
        </div>

        {candidate.licenseStatus === "Unlicensed" && (
          <>
            <div className="space-y-2">
              <Label>Unlicensed Start Date</Label>
              <Input
                type="date"
                value={
                  (licensing as any).unlicensedStartDate
                    ? new Date((licensing as any).unlicensedStartDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onUpdate(
                    "licensing.unlicensedStartDate",
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="licensePassed"
                checked={licensing.licensePassed}
                onCheckedChange={(checked) => {
                  onUpdate("licensing.licensePassed", checked);
                  if (checked) {
                    onUpdate("licensing.licensePassedAt", new Date());
                    onUpdate("licenseStatus", "Licensed");
                  }
                }}
              />
              <Label htmlFor="licensePassed">License exam passed</Label>
            </div>
          </>
        )}

        {licensing.licensePassedAt && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">License Obtained</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              {formatDateTime(licensing.licensePassedAt)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ClassAssignmentSection({ candidate, onUpdate }: SectionProps) {
  if (!candidate) return null;

  const baseAssignment =
    candidate && candidate.classAssignment ? candidate.classAssignment : {};

  const assignment = {
    classType: "",
    startDate: undefined as Date | undefined,
    preStartCallCompleted: false,
    startConfirmed: false,
    sysOnboarding: false,
    ...baseAssignment,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Class Type</Label>
            <Select
              value={assignment.classType}
              onValueChange={(value) =>
                onUpdate("classAssignment.classType", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pre-Licensing">Pre-Licensing</SelectItem>
                <SelectItem value="New Agent">New Agent</SelectItem>
                <SelectItem value="UNL">UNL (Unlicensed)</SelectItem>
                <SelectItem value="AGENT">AGENT (Licensed)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={
                assignment.startDate
                  ? new Date(assignment.startDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                onUpdate(
                  "classAssignment.startDate",
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preStartCall"
              checked={assignment.preStartCallCompleted}
              onCheckedChange={(checked) =>
                onUpdate("classAssignment.preStartCallCompleted", checked)
              }
            />
            <Label htmlFor="preStartCall">Pre-start call completed</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="startConfirmed"
              checked={assignment.startConfirmed}
              onCheckedChange={(checked) =>
                onUpdate("classAssignment.startConfirmed", checked)
              }
            />
            <Label htmlFor="startConfirmed">Start confirmed</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sysOnboarding"
              checked={assignment.sysOnboarding}
              onCheckedChange={(checked) =>
                onUpdate("classAssignment.sysOnboarding", checked)
              }
            />
            <Label htmlFor="sysOnboarding">Systems onboarding complete</Label>
          </div>

          {assignment.startDate && assignment.startConfirmed && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Class Assignment Confirmed</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Starts {formatDate(assignment.startDate)}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="readyToGo"
              checked={candidate.readyToGo}
              onCheckedChange={(checked) => onUpdate("readyToGo", checked)}
            />
            <Label htmlFor="readyToGo">All onboarding tasks complete</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
