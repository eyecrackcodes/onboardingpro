"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Mail, Shield, CheckCircle, Clock, Send, Upload } from "lucide-react";
import type { Candidate } from "@/lib/types";
import { doc, setDoc, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface I9SenderProps {
  candidate: Candidate;
  onUpdate: (field: string, value: any) => void;
}

export function I9Sender({ candidate, onUpdate }: I9SenderProps) {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if I9 has been sent or completed
  const i9Status = (candidate as any).i9Status;
  const i9SentAt = (candidate as any).i9SentAt;
  const i9CompletedAt = (candidate as any).i9CompletedAt;
  const i9ManualUpload = (candidate as any).i9ManualUpload;

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

      // Send email via API
      const emailData = {
        to: candidate.personalInfo.email,
        name: candidate.personalInfo.name,
        link: `${window.location.origin}/i9/${candidate.id}`,
      };
      
      console.log("[I9Sender] Calling email API with data:", emailData);

      const emailResponse = await fetch("/api/email/send-i9", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      console.log("[I9Sender] Email API response status:", emailResponse.status);
      
      const emailResult = await emailResponse.json();
      console.log("[I9Sender] Email API result:", emailResult);

      if (emailResult.mode === "console" || emailResult.mode === "console_fallback") {
        alert(
          `✅ I-9 form created successfully!\n\n` +
          `📧 Email was logged to console (SendGrid not configured)\n` +
          `🔗 Form Link: ${window.location.origin}/i9/${candidate.id}\n\n` +
          `Check the server console to see the email that would have been sent.`
        );
      } else {
        alert(
          `✅ I-9 Employment Eligibility Verification form sent to ${candidate.personalInfo.name} at ${candidate.personalInfo.email}\n\n` +
          `🔗 Form Link: ${window.location.origin}/i9/${candidate.id}\n\n` +
          `The candidate will receive an encrypted email with instructions to complete their I-9 form.`
        );
      }
    } catch (error) {
      console.error("[I9Sender] Error sending I-9 form:", error);
      alert("Failed to send I-9 form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    setUploadLoading(true);
    try {
      console.log("[I9Sender] Uploading manual I-9 form for candidate:", candidate.id);

      // Try direct upload first
      const timestamp = Date.now();
      const fileName = `manual-i9-${timestamp}.pdf`;
      let downloadURL: string | null = null;
      let useBase64Fallback = false;
      let base64Data: string | null = null;

      try {
        // Attempt direct Firebase Storage upload
        const storageFileName = `i9-forms/${candidate.id}/${fileName}`;
        const storageRef = ref(storage, storageFileName);
        await uploadBytes(storageRef, selectedFile);
        downloadURL = await getDownloadURL(storageRef);
        console.log("[I9Sender] Direct upload successful:", downloadURL);
      } catch (storageError: any) {
        console.error("[I9Sender] Direct upload failed:", storageError);
        
        // If CORS error, use API route
        if (storageError.code === 'storage/unauthorized' || storageError.message?.includes('CORS')) {
          console.log("[I9Sender] Falling back to API upload due to CORS");
          
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("candidateId", candidate.id);
          formData.append("fileName", fileName);

          const response = await fetch("/api/upload/i9", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          
          if (result.success) {
            if (result.url) {
              downloadURL = result.url;
            } else if (result.base64) {
              // Store base64 in Firestore as fallback
              useBase64Fallback = true;
              base64Data = result.base64;
            }
          } else {
            throw new Error("API upload failed");
          }
        } else {
          throw storageError;
        }
      }

      // Create I9 document in Firestore with manual upload info
      const i9Data: any = {
        candidateId: candidate.id,
        candidateName: candidate.personalInfo.name,
        candidateEmail: candidate.personalInfo.email,
        licenseStatus: candidate.licenseStatus,
        callCenter: candidate.callCenter,
        uploadedAt: serverTimestamp(),
        completed: true,
        status: "completed",
        manualUpload: true,
        fileName: selectedFile.name,
        uploadedBy: "Recruiter", // In real app, get from auth context
      };

      if (downloadURL) {
        i9Data.fileUrl = downloadURL;
      } else if (useBase64Fallback && base64Data) {
        i9Data.fileBase64 = base64Data;
        i9Data.fileType = "application/pdf";
      }

      await setDoc(doc(db, "i9Forms", candidate.id), i9Data);

      // Update candidate status
      const manualUploadData: any = {
        uploaded: true,
        fileName: selectedFile.name,
        uploadedAt: new Date(),
      };

      if (downloadURL) {
        manualUploadData.fileUrl = downloadURL;
      } else if (useBase64Fallback) {
        manualUploadData.base64Available = true;
      }

      await updateDoc(doc(db, "candidates", candidate.id), {
        i9Status: "completed",
        i9CompletedAt: serverTimestamp(),
        i9ManualUpload: manualUploadData,
      });

      // Update local state
      onUpdate("i9Status", "completed");
      onUpdate("i9CompletedAt", new Date());
      onUpdate("i9ManualUpload", manualUploadData);

      alert(
        `✅ I-9 form uploaded successfully for ${candidate.personalInfo.name}!\n\n` +
        `📄 File: ${selectedFile.name}\n` +
        `✓ The candidate's I-9 verification is now complete.` +
        (useBase64Fallback ? "\n\n⚠️ Note: File stored in database due to storage configuration." : "")
      );

      setSelectedFile(null);
    } catch (error) {
      console.error("[I9Sender] Error uploading I-9 form:", error);
      alert("Failed to upload I-9 form. Please try again.");
    } finally {
      setUploadLoading(false);
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
              {i9ManualUpload?.uploaded && (
                <>
                  <p>
                    <strong>Method:</strong> Manual Upload
                  </p>
                  <p>
                    <strong>File:</strong> {i9ManualUpload.fileName}
                  </p>
                  <p>
                    <strong>Uploaded:</strong>{" "}
                    {new Date(i9ManualUpload.uploadedAt).toLocaleDateString()}
                  </p>
                  {(i9ManualUpload.fileUrl || i9ManualUpload.base64Available) && (
                    <Button
                      onClick={async () => {
                        if (i9ManualUpload.fileUrl) {
                          window.open(i9ManualUpload.fileUrl, "_blank");
                        } else if (i9ManualUpload.base64Available) {
                          // Fetch base64 from Firestore and display
                          try {
                            const i9Doc = await getDoc(doc(db, "i9Forms", candidate.id));
                            if (i9Doc.exists() && i9Doc.data().fileBase64) {
                              const base64 = i9Doc.data().fileBase64;
                              const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'application/pdf' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, "_blank");
                              setTimeout(() => URL.revokeObjectURL(url), 100);
                            }
                          } catch (error) {
                            console.error("Error viewing I9:", error);
                            alert("Failed to load I-9 document");
                          }
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Uploaded I-9
                    </Button>
                  )}
                </>
              )}
              <p className="mt-2">
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
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
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

          {/* Manual Upload Option for sent status */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">
              Or Complete Manually
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              If the candidate completed the I-9 form onsite, you can upload the physical copy here.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="i9-file-sent" className="text-sm">
                  Select I-9 PDF
                </Label>
                <Input
                  id="i9-file-sent"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleManualUpload}
                disabled={uploadLoading || !selectedFile}
                variant="outline"
                className="w-full"
              >
                {uploadLoading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Completed I-9
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not sent yet - show both electronic and manual options
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
            Choose how to complete the I-9 Employment Eligibility Verification for{" "}
            {candidate.personalInfo.name}
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Electronic Submission Option */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Electronic Submission
              </h4>
              <ul className="text-sm text-blue-700 text-left space-y-1 mb-4">
                <li>• Send form via encrypted email</li>
                <li>• Candidate completes online</li>
                <li>• Automatic data collection</li>
                <li>• Real-time status tracking</li>
              </ul>
              <Button
                onClick={handleSendI9}
                disabled={loading || !candidate.personalInfo.email}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send I-9 Form
                  </>
                )}
              </Button>
            </div>

            {/* Manual Upload Option */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Manual Upload
              </h4>
              <ul className="text-sm text-green-700 text-left space-y-1 mb-4">
                <li>• For onsite completion</li>
                <li>• Upload physical copy</li>
                <li>• Bypass electronic process</li>
                <li>• Immediate completion</li>
              </ul>
              <div className="space-y-3">
                <div className="text-left">
                  <Label htmlFor="i9-file" className="text-sm">
                    Select I-9 PDF
                  </Label>
                  <Input
                    id="i9-file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={handleManualUpload}
                  disabled={uploadLoading || !selectedFile}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {uploadLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload I-9 Form
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Candidate Details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Name: {candidate.personalInfo.name}</p>
              <p>Email: {candidate.personalInfo.email}</p>
              <p>License Status: {candidate.licenseStatus}</p>
              <p>Call Center: {candidate.callCenter}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
