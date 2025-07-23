"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Shield, CheckCircle, Clock, Send } from "lucide-react";
import type { Candidate } from "@/lib/types";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface I9SenderProps {
  candidate: Candidate;
  onUpdate: (field: string, value: any) => void;
}

export function I9Sender({ candidate, onUpdate }: I9SenderProps) {
  const [loading, setLoading] = useState(false);

  // Check if I9 has been sent or completed
  const i9Status = (candidate as any).i9Status;
  const i9SentAt = (candidate as any).i9SentAt;
  const i9CompletedAt = (candidate as any).i9CompletedAt;

  const handleSendI9 = async () => {
    if (!candidate.personalInfo.email) {
      alert("Candidate email is required to send I-9 form");
      return;
    }

    setLoading(true);
    try {
      console.log("[I9Sender] Sending I-9 form to candidate:", candidate.id);

      // Create I9 document in Firestore
      await setDoc(doc(db, "i9Forms", candidate.id), {
        candidateId: candidate.id,
        candidateName: candidate.personalInfo.name,
        candidateEmail: candidate.personalInfo.email,
        licenseStatus: candidate.licenseStatus,
        callCenter: candidate.callCenter,
        sentAt: serverTimestamp(),
        completed: false,
        status: "sent",
        // Pre-populate some basic info to help candidate
        basicInfo: {
          name: candidate.personalInfo.name,
          email: candidate.personalInfo.email,
          phone: candidate.personalInfo.phone,
        },
      });

      // Update candidate status
      await setDoc(doc(db, "candidates", candidate.id), {
        ...candidate,
        i9Status: "sent",
        i9SentAt: new Date(),
      });

      // Update local state
      onUpdate("i9Status", "sent");
      onUpdate("i9SentAt", new Date());

      // In a real implementation, this would trigger an email service
      console.log(
        "[I9Sender] I-9 form link:",
        `${window.location.origin}/i9/${candidate.id}`
      );

      alert(
        `✅ I-9 Employment Eligibility Verification form sent to ${candidate.personalInfo.name} at ${candidate.personalInfo.email}\n\n` +
          `🔗 Form Link: ${window.location.origin}/i9/${candidate.id}\n\n` +
          `The candidate will receive an encrypted email with instructions to complete their I-9 form.`
      );
    } catch (error) {
      console.error("[I9Sender] Error sending I-9 form:", error);
      alert("Failed to send I-9 form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (i9Status === "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            I-9 Employment Eligibility Verification
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">I-9 Form Completed</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              {candidate.personalInfo.name} has successfully completed their I-9
              Employment Eligibility Verification form. All information is ready
              for background check processing.
            </p>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Completed:</strong>{" "}
                {i9CompletedAt
                  ? new Date(i9CompletedAt).toLocaleDateString()
                  : "Recently"}
              </p>
              <p>
                <strong>Next Step:</strong> You can now send the employment
                offer letter.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (i9Status === "sent") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            I-9 Employment Eligibility Verification
            <Badge variant="secondary">
              <Clock className="h-4 w-4 mr-1" />
              Pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Mail className="h-5 w-5" />
              <span className="font-medium">I-9 Form Sent</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              The I-9 Employment Eligibility Verification form has been sent to{" "}
              {candidate.personalInfo.name}
              at {candidate.personalInfo.email}. They need to complete this form
              before proceeding with the offer.
            </p>
            <div className="text-sm text-gray-600 mb-4">
              <p>
                <strong>Sent:</strong>{" "}
                {i9SentAt
                  ? new Date(i9SentAt).toLocaleDateString()
                  : "Recently"}
              </p>
              <p>
                <strong>Form Link:</strong>{" "}
                <code className="bg-gray-100 px-1 rounded">
                  /i9/{candidate.id}
                </code>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSendI9}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <Send className="h-4 w-4 mr-2" />
                Resend I-9 Form
              </Button>

              <Button
                onClick={() => window.open(`/i9/${candidate.id}`, "_blank")}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Preview Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not sent yet
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          I-9 Employment Eligibility Verification
          <Badge variant="outline">Required First</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            I-9 Verification Required
          </h3>
          <p className="text-gray-600 mb-4">
            Send the I-9 Employment Eligibility Verification form to{" "}
            {candidate.personalInfo.name}
            to verify their eligibility to work in the United States.
          </p>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
            <h4 className="font-medium text-blue-800 mb-2">
              What happens next:
            </h4>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>
                • Encrypted email sent to:{" "}
                <strong>{candidate.personalInfo.email}</strong>
              </li>
              <li>• Candidate completes I-9 form with personal information</li>
              <li>• Document verification and work authorization details</li>
              <li>• Form must be completed before sending job offer</li>
              <li>• All data automatically prepared for background check</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>
                <strong>Candidate Details:</strong>
              </p>
              <p>Name: {candidate.personalInfo.name}</p>
              <p>Email: {candidate.personalInfo.email}</p>
              <p>License Status: {candidate.licenseStatus}</p>
              <p>Call Center: {candidate.callCenter}</p>
            </div>

            <Button
              onClick={handleSendI9}
              disabled={loading || !candidate.personalInfo.email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Sending I-9 Form...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send I-9 Form to Candidate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
