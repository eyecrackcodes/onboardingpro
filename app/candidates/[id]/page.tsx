"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  getCandidate,
  updateCandidate,
  deleteCandidate,
  subscribeToCandidateUpdates,
} from "@/lib/firestore";
import { formatDate } from "@/lib/utils";
import type { Candidate } from "@/lib/types";
import {
  ContactSection,
  ClassAssignmentSection,
  OffersSection,
  LicensingSection,
} from "@/components/candidates/CandidateSections";
import { InterviewSection } from "@/components/candidates/InterviewSection";
import { BackgroundCheckWithIBR } from "@/components/candidates/BackgroundCheckWithIBR";
import { OnboardingWizard } from "@/components/candidates/OnboardingWizard";
import { InterviewProgressIndicator } from "@/components/candidates/InterviewProgressIndicator";
import { OfferListener } from "@/components/candidates/OfferListener";
import { I9Sender } from "@/components/candidates/I9Sender";
import { ProgressPipeline } from "@/components/candidates/ProgressPipeline";
import { getPipelineStages } from "@/lib/utils";

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSchedulerOnInterviewTab, setShowSchedulerOnInterviewTab] =
    useState(false);

  useEffect(() => {
    if (!candidateId) return;

    // Subscribe to real-time updates
    const unsubscribe = subscribeToCandidateUpdates(
      candidateId,
      (updatedCandidate) => {
        setCandidate(updatedCandidate);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [candidateId]);

  // Reset the scheduler flag when tab changes
  useEffect(() => {
    if (activeTab === "interview" && showSchedulerOnInterviewTab) {
      // Reset the flag after a short delay to ensure the child component has received it
      const timer = setTimeout(() => {
        setShowSchedulerOnInterviewTab(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, showSchedulerOnInterviewTab]);

  const handleUpdate = useCallback(
    async (updates: Partial<Candidate>) => {
      if (!candidate) return;

      // Reduce logging noise - only log non-offers updates
      if (!updates.offers) {
        console.log("[CandidateDetailPage] handleUpdate called with:", updates);
      }

      // This ensures Firestore receives clean data without `undefined` values
      const cleanUpdates = Object.entries(updates).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key as keyof Candidate] = value;
          }
          return acc;
        },
        {} as Partial<Candidate>
      );

      if (!updates.offers) {
        console.log(
          "[CandidateDetailPage] Clean updates to send to Firestore:",
          cleanUpdates
        );
      }

      try {
        await updateCandidate(candidate.id, cleanUpdates);
        if (!updates.offers) {
          console.log(
            "[CandidateDetailPage] Successfully updated candidate in Firestore"
          );
        }
      } catch (error) {
        console.error("[CandidateDetailPage] Error updating candidate:", error);
        alert("Failed to update candidate");
      }
    },
    [candidate]
  );

  const handleNestedUpdate = async (path: string, value: any) => {
    if (!candidate) return;

    console.log(
      "[CandidateDetailPage] handleNestedUpdate called with path:",
      path,
      "value:",
      value
    );

    // Create a deep copy to avoid direct state mutation
    const updatedCandidate = JSON.parse(JSON.stringify(candidate));

    // Use a library or a helper function to set the nested value
    const keys = path.split(".");
    let current = updatedCandidate;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
      if (current === undefined) {
        console.error("[CandidateDetailPage] Path does not exist:", path);
        return; // Path does not exist
      }
    }
    current[keys[keys.length - 1]] = value;

    try {
      // Update only the specific nested field using dot notation
      console.log(
        "[CandidateDetailPage] Updating Firestore with nested path:",
        { [path]: value }
      );
      await updateCandidate(candidate.id, { [path]: value });
      console.log("[CandidateDetailPage] Successfully updated nested field");
    } catch (error) {
      console.error("[CandidateDetailPage] Error updating candidate:", error);
      alert("Failed to update candidate");
    }
  };

  // Handle wizard action clicks by changing to the appropriate tab
  const handleWizardAction = useCallback((step: string, action?: string) => {
    console.log(`[CandidateDetail] Wizard action: ${step} - ${action}`);
    if (step === "interview") {
      setActiveTab("interview");
      if (action === "schedule") {
        setShowSchedulerOnInterviewTab(true);
      }
    } else if (step === "background") {
      setActiveTab("background");
    } else if (step === "offers") {
      setActiveTab("offers");
    } else if (step === "licensing") {
      setActiveTab("licensing");
    } else if (step === "assignment") {
      setActiveTab("assignment");
    }
  }, []);

  const handleDeleteCandidate = async () => {
    if (!candidate) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${candidate.personalInfo.name}?\n\n` +
        `This action cannot be undone and will permanently remove:\n` +
        `• All candidate information\n` +
        `• Interview evaluations\n` +
        `• Background check data\n` +
        `• Offer records\n\n` +
        `Type "DELETE" to confirm:`
    );

    if (!confirmed) return;

    const confirmText = window.prompt(
      `Please type "DELETE" to confirm deletion of ${candidate.personalInfo.name}:`
    );

    if (confirmText !== "DELETE") {
      alert("Deletion cancelled. You must type exactly 'DELETE' to confirm.");
      return;
    }

    setDeleting(true);
    try {
      console.log(
        `[CandidateDetail] Deleting candidate: ${candidate.personalInfo.name}`
      );
      await deleteCandidate(candidateId);
      console.log(`[CandidateDetail] ✅ Candidate deleted successfully`);

      // Redirect to candidates list
      router.push("/candidates");
    } catch (error) {
      console.error("[CandidateDetail] ❌ Error deleting candidate:", error);
      alert("Failed to delete candidate. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading candidate...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Candidate not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/candidates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {candidate.personalInfo.name}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <Badge
                variant={
                  candidate.status === "Active" ? "default" : "secondary"
                }
              >
                {candidate.status}
              </Badge>
              <Badge variant="outline">{candidate.licenseStatus}</Badge>
              <span className="text-gray-500">
                {candidate.callCenter.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteCandidate}
          disabled={deleting}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete Candidate"}
        </Button>
      </div>

      {candidate && (
        <>
          <OfferListener candidateId={candidate.id} onUpdate={handleUpdate} />
          <OnboardingWizard
            candidate={candidate}
            onActionClick={handleWizardAction}
          />
        </>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="i9">I-9 Form</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="licensing">Licensing</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressPipeline stages={getPipelineStages(candidate)} />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{candidate.personalInfo.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{candidate.personalInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{candidate.personalInfo.location}</span>
              </div>
              {candidate.personalInfo.altPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{candidate.personalInfo.altPhone} (Alt)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Status */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Status</CardTitle>
            </CardHeader>
            <CardContent>
              <InterviewProgressIndicator
                interview={candidate.interview}
                variant="detailed"
              />
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Applied</span>
                <span className="font-medium">
                  {formatDate(candidate.createdAt)}
                </span>
              </div>
              {(candidate as any).i9SentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">I-9 Form Sent</span>
                  <span className="font-medium">
                    {formatDate((candidate as any).i9SentAt)}
                  </span>
                </div>
              )}
              {(candidate as any).i9CompletedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">I-9 Form Completed</span>
                  <span className="font-medium">
                    {formatDate((candidate as any).i9CompletedAt)}
                  </span>
                </div>
              )}
              {candidate.backgroundCheck.passedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Background Check Passed</span>
                  <span className="font-medium">
                    {formatDate(candidate.backgroundCheck.passedAt)}
                  </span>
                </div>
              )}
              {candidate.offers.preLicenseOffer.signedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Pre-License Offer Signed
                  </span>
                  <span className="font-medium">
                    {formatDate(candidate.offers.preLicenseOffer.signedAt)}
                  </span>
                </div>
              )}
              {candidate.licensing.licensePassedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">License Obtained</span>
                  <span className="font-medium">
                    {formatDate(candidate.licensing.licensePassedAt)}
                  </span>
                </div>
              )}
              {candidate.classAssignment.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Class Start Date</span>
                  <span className="font-medium">
                    {formatDate(candidate.classAssignment.startDate)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {candidate.notes || "No notes available"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview" className="space-y-6">
          <InterviewSection
            candidate={candidate}
            onUpdate={handleUpdate}
            autoShowScheduler={showSchedulerOnInterviewTab}
          />
        </TabsContent>

        <TabsContent value="background" className="space-y-6">
          <BackgroundCheckWithIBR
            candidate={candidate}
            onUpdate={handleUpdate}
          />
        </TabsContent>

        <TabsContent value="i9" className="space-y-6">
          <I9Sender candidate={candidate} onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <OffersSection
            candidate={candidate}
            saving={false}
            onUpdate={(field, value) => {
              // Initialize offers if undefined
              const currentOffers = candidate.offers || {
                preLicenseOffer: {
                  sent: false,
                  signed: false,
                  sentAt: null,
                  signedAt: null,
                },
                fullAgentOffer: {
                  sent: false,
                  signed: false,
                  sentAt: null,
                  signedAt: null,
                },
              };

              // Handle the offers.xxx.yyy format
              if (typeof field === "string" && field.startsWith("offers.")) {
                const path = field.split(".");
                const updatedOffers = { ...currentOffers };

                if (path.length === 3) {
                  // offers.preLicenseOffer.sent format
                  const [, offerType, fieldName] = path;
                  updatedOffers[offerType] = {
                    ...updatedOffers[offerType],
                    [fieldName]: value,
                  };
                }

                handleUpdate({ offers: updatedOffers });
              } else {
                handleUpdate({ [field]: value });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="licensing" className="space-y-6">
          <LicensingSection
            licensing={candidate.licensing}
            licenseStatus={candidate.licenseStatus}
            onUpdate={(updates) => {
              const updatedLicensing = { ...candidate.licensing, ...updates };
              handleUpdate({ licensing: updatedLicensing });
            }}
            onLicenseStatusChange={(status) =>
              handleUpdate({ licenseStatus: status })
            }
          />
        </TabsContent>

        <TabsContent value="assignment" className="space-y-6">
          <ClassAssignmentSection
            classAssignment={candidate.classAssignment}
            readyToGo={candidate.readyToGo}
            onUpdate={(updates) => {
              const updatedAssignment = {
                ...candidate.classAssignment,
                ...updates,
              };
              handleUpdate({ classAssignment: updatedAssignment });
            }}
            onReadyToGoChange={(ready) => handleUpdate({ readyToGo: ready })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
