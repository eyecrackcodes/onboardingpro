"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  CheckCircle,
  Lock,
  AlertTriangle,
  Building,
} from "lucide-react";
import { I9DocumentCollection } from "@/components/candidates/I9DocumentCollection";

interface I9FormData {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  licenseStatus: string;
  callCenter: string;
  sentAt: any;
  completed: boolean;
  status: string;
  basicInfo: {
    name: string;
    email: string;
    phone: string;
  };
  i9Data?: any;
  completedAt?: any;
}

export default function I9CompletionPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [i9Form, setI9Form] = useState<I9FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchI9Form = async () => {
      try {
        console.log("[I9Page] Fetching I9 form for candidate:", candidateId);

        const i9Ref = doc(db, "i9Forms", candidateId);
        const i9Doc = await getDoc(i9Ref);

        if (!i9Doc.exists()) {
          console.error("[I9Page] I9 form not found");
          setError("I-9 form not found. Please contact HR for assistance.");
          return;
        }

        const i9Data = i9Doc.data() as I9FormData;
        console.log("[I9Page] I9 form loaded:", i9Data);

        setI9Form(i9Data);
      } catch (error) {
        console.error("[I9Page] Error loading I9 form:", error);
        setError("Failed to load I-9 form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchI9Form();
    }
  }, [candidateId]);

  const handleI9Complete = async (i9Data: any) => {
    setSubmitting(true);
    try {
      console.log("[I9Page] Submitting completed I9 data:", i9Data);

      // Update I9 form document
      await updateDoc(doc(db, "i9Forms", candidateId), {
        i9Data: i9Data,
        completed: true,
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // Update candidate document
      await updateDoc(doc(db, "candidates", candidateId), {
        i9Status: "completed",
        i9CompletedAt: serverTimestamp(),
        i9Data: i9Data,
      });

      console.log("[I9Page] I9 form completed successfully");

      // Update local state
      setI9Form((prev) =>
        prev
          ? {
              ...prev,
              completed: true,
              status: "completed",
              i9Data: i9Data,
              completedAt: new Date(),
            }
          : null
      );
    } catch (error) {
      console.error("[I9Page] Error submitting I9 form:", error);
      alert("Failed to submit I-9 form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading I-9 form...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Error
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!i9Form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Form Not Found
              </h2>
              <p className="text-gray-600">
                I-9 form not found. Please contact HR for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (i9Form.completed) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                I-9 Form Completed Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">
                  Thank you, {i9Form.candidateName}!
                </h3>
                <p className="text-green-700 mb-4">
                  Your I-9 Employment Eligibility Verification form has been
                  successfully submitted. Our HR team has been notified and will
                  review your information.
                </p>
                <div className="text-sm text-green-600">
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {i9Form.completedAt
                      ? new Date(i9Form.completedAt).toLocaleString()
                      : "Just now"}
                  </p>
                  <p>
                    <strong>Reference ID:</strong> {candidateId}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-700 text-left space-y-1">
                  <li>• HR will review your I-9 information</li>
                  <li>• Background check process will begin</li>
                  <li>• You'll receive your employment offer letter soon</li>
                  <li>
                    • Keep this reference ID for your records:{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      {candidateId}
                    </code>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  If you have any questions, please contact HR at your assigned
                  call center.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DigitalBGA</h1>
                <p className="text-sm text-gray-500">Employment Verification</p>
              </div>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              I-9 Employment Eligibility Verification
              <Badge
                variant="outline"
                className="border-blue-200 text-blue-700"
              >
                <Lock className="h-3 w-3 mr-1" />
                Secure
              </Badge>
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Welcome, <strong>{i9Form.candidateName}</strong>. Please complete
              your employment eligibility verification.
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Important Information
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • This form is required by federal law to verify your
                  eligibility to work in the United States
                </li>
                <li>• All information must be accurate and complete</li>
                <li>• You'll need identity and work authorization documents</li>
                <li>• Your information is encrypted and secure</li>
                <li>
                  • Position: {i9Form.licenseStatus} Agent at{" "}
                  {i9Form.callCenter}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* I9 Form */}
        <I9DocumentCollection
          candidateId={candidateId}
          candidateName={i9Form.candidateName}
          onComplete={handleI9Complete}
          initialData={i9Form.i9Data}
        />

        {/* Footer */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>
                This form is secured with encryption. If you experience any
                technical issues, please contact HR at {i9Form.callCenter} for
                assistance.
              </p>
              <p className="mt-2">
                <strong>Form ID:</strong> {candidateId} | <strong>Sent:</strong>{" "}
                {i9Form.sentAt
                  ? new Date(i9Form.sentAt.toDate()).toLocaleDateString()
                  : "Recently"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
