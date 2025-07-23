"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  User,
  Shield,
} from "lucide-react";
import { I9DocumentCollection } from "./I9DocumentCollection";
import type { Candidate } from "@/lib/types";
import { updateCandidate } from "@/lib/firestore";

interface I9SectionProps {
  candidate: Candidate;
  onUpdate: (field: string, value: any) => void;
}

export function I9Section({ candidate, onUpdate }: I9SectionProps) {
  const [showI9Form, setShowI9Form] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if I9 data exists and is complete
  const i9Data = (candidate as any).i9Data;
  const isI9Complete = !!(
    i9Data?.legalName?.firstName &&
    i9Data?.legalName?.lastName &&
    i9Data?.dateOfBirth &&
    i9Data?.socialSecurityNumber &&
    i9Data?.currentAddress?.street &&
    i9Data?.workAuthorization?.status &&
    (i9Data?.documentVerification?.listADocument ||
      (i9Data?.documentVerification?.listBDocument &&
        i9Data?.documentVerification?.listCDocument)) &&
    i9Data?.emergencyContact?.name
  );

  const handleI9Complete = async (i9FormData: any) => {
    setLoading(true);
    try {
      console.log("[I9Section] Saving I9 data for candidate:", candidate.id);

      // Update candidate with I9 data using dot notation
      await updateCandidate(candidate.id, {
        ["i9Data"]: i9FormData,
        ["i9CompletedAt"]: new Date(),
        ["i9Status"]: "completed",
      } as any);

      // Update local state
      onUpdate("i9Data", i9FormData);
      onUpdate("i9CompletedAt", new Date());
      onUpdate("i9Status", "completed");

      setShowI9Form(false);
      alert("I-9 form completed successfully!");
    } catch (error) {
      console.error("[I9Section] Error saving I9 data:", error);
      alert("Failed to save I-9 data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleI9Save = async (i9FormData: any) => {
    try {
      console.log(
        "[I9Section] Saving I9 progress for candidate:",
        candidate.id
      );

      // Save progress
      await updateCandidate(candidate.id, {
        ["i9Data"]: i9FormData,
        ["i9Status"]: "in_progress",
      } as any);

      // Update local state
      onUpdate("i9Data", i9FormData);
      onUpdate("i9Status", "in_progress");

      alert("I-9 progress saved!");
    } catch (error) {
      console.error("[I9Section] Error saving I9 progress:", error);
      alert("Failed to save I-9 progress. Please try again.");
    }
  };

  if (showI9Form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            I-9 Employment Eligibility Verification
          </h2>
          <Button onClick={() => setShowI9Form(false)} variant="outline">
            Back to Profile
          </Button>
        </div>

        <I9DocumentCollection
          candidateId={candidate.id}
          candidateName={candidate.personalInfo.name}
          onComplete={handleI9Complete}
          onSave={handleI9Save}
          initialData={i9Data}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          I-9 Employment Eligibility Verification
          {isI9Complete && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Badge>
          )}
          {i9Data && !isI9Complete && (
            <Badge variant="secondary">In Progress</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!i9Data ? (
          // Not started
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              I-9 Form Required
            </h3>
            <p className="text-gray-600 mb-4">
              Complete the I-9 Employment Eligibility Verification form to
              collect all information required for background check submission.
            </p>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <p className="text-sm text-blue-800">
                <strong>This form collects:</strong>
                <br />• Legal name and personal information
                <br />• Current and previous addresses
                <br />• Work authorization status
                <br />• Identity and work eligibility documents
                <br />• Emergency contact information
              </p>
            </div>
            <Button
              onClick={() => setShowI9Form(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Start I-9 Form
            </Button>
          </div>
        ) : isI9Complete ? (
          // Completed
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">I-9 Form Completed</span>
              </div>
              <p className="text-sm text-green-700">
                All required I-9 information has been collected and is ready for
                IBR background check submission.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <span className="text-gray-600">Legal Name:</span>
                <span className="font-medium ml-2">
                  {i9Data.legalName.firstName} {i9Data.legalName.middleName}{" "}
                  {i9Data.legalName.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Work Authorization:</span>
                <span className="font-medium ml-2">
                  {i9Data.workAuthorization.status === "citizen" &&
                    "U.S. Citizen"}
                  {i9Data.workAuthorization.status === "permanent_resident" &&
                    "Permanent Resident"}
                  {i9Data.workAuthorization.status === "authorized_alien" &&
                    "Authorized Alien"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Current Address:</span>
                <span className="font-medium ml-2">
                  {i9Data.currentAddress.city}, {i9Data.currentAddress.state}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Emergency Contact:</span>
                <span className="font-medium ml-2">
                  {i9Data.emergencyContact.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Identity Document:</span>
                <span className="font-medium ml-2">
                  {i9Data.documentVerification.listADocument?.type ||
                    i9Data.documentVerification.listBDocument?.type ||
                    "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium ml-2">
                  {(candidate as any).i9CompletedAt
                    ? new Date(
                        (candidate as any).i9CompletedAt
                      ).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowI9Form(true)}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                View/Edit I-9 Form
              </Button>

              <Button
                onClick={() => {
                  console.log("I-9 data for IBR submission:", i9Data);
                  alert("I-9 data logged to console for IBR integration");
                }}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Export for IBR
              </Button>
            </div>
          </div>
        ) : (
          // In progress
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">I-9 Form In Progress</span>
              </div>
              <p className="text-sm text-yellow-700">
                The I-9 form has been started but not yet completed. Please
                finish all required sections.
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Progress:</strong>
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                <li className="flex items-center gap-2">
                  {i9Data.legalName?.firstName ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  Personal Information
                </li>
                <li className="flex items-center gap-2">
                  {i9Data.currentAddress?.street ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  Address Information
                </li>
                <li className="flex items-center gap-2">
                  {i9Data.workAuthorization?.status ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  Work Authorization
                </li>
                <li className="flex items-center gap-2">
                  {i9Data.documentVerification?.listADocument ||
                  (i9Data.documentVerification?.listBDocument &&
                    i9Data.documentVerification?.listCDocument) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  Document Verification
                </li>
                <li className="flex items-center gap-2">
                  {i9Data.emergencyContact?.name ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  Emergency Contact
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setShowI9Form(true)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Continue I-9 Form
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
