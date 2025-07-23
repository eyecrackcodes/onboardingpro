import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

interface ReleaseFormProps {
  candidate: Candidate;
  onFormGenerated: (file: File) => void;
}

export function BackgroundCheckReleaseForm({
  candidate,
  onFormGenerated,
}: ReleaseFormProps) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [signedDate, setSignedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const formRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    // In a real application, you would use a PDF generation library
    // For now, we'll create an HTML representation that can be printed to PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Background Check Authorization</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { text-align: center; }
          .section { margin: 20px 0; }
          .signature-block { margin-top: 40px; }
          .signature-line { border-bottom: 1px solid #000; width: 300px; display: inline-block; }
          .date-line { border-bottom: 1px solid #000; width: 150px; display: inline-block; }
        </style>
      </head>
      <body>
        <h1>BACKGROUND CHECK AUTHORIZATION AND RELEASE</h1>
        
        <div class="section">
          <p>I, <strong>${candidate.personalInfo.name}</strong>, hereby authorize Interstate Background Research, Inc. (IBR) 
          and its agents to conduct a comprehensive background investigation on my behalf.</p>
        </div>
        
        <div class="section">
          <h3>SCOPE OF INVESTIGATION</h3>
          <p>I understand that this investigation may include, but is not limited to:</p>
          <ul>
            <li>Criminal history records from federal, state, and local jurisdictions</li>
            <li>Employment verification and references</li>
            <li>Education verification</li>
            <li>Professional license verification</li>
            <li>Credit history (if applicable to position)</li>
            <li>Motor vehicle records</li>
            <li>Social Security number verification</li>
          </ul>
        </div>
        
        <div class="section">
          <h3>RELEASE OF INFORMATION</h3>
          <p>I authorize all persons, schools, companies, corporations, credit bureaus, law enforcement agencies, 
          and other organizations to release any information requested by IBR for the purpose of this background investigation.</p>
        </div>
        
        <div class="section">
          <h3>HOLD HARMLESS</h3>
          <p>I release and hold harmless any person or entity providing information pursuant to this authorization 
          from any liability or claims arising from the release of such information.</p>
        </div>
        
        <div class="section">
          <h3>ACKNOWLEDGMENT</h3>
          <p>I acknowledge that I have been informed of my rights under the Fair Credit Reporting Act (FCRA), 
          including my right to request a copy of any consumer report prepared about me.</p>
        </div>
        
        <div class="signature-block">
          <p>
            <strong>Candidate Name:</strong> ${candidate.personalInfo.name}<br/>
            <strong>Email:</strong> ${candidate.personalInfo.email}<br/>
            <strong>Phone:</strong> ${candidate.personalInfo.phone}<br/>
          </p>
          
          <p>
            <strong>Electronic Signature:</strong> <span class="signature-line">${signature}</span><br/>
            <strong>Date:</strong> <span class="date-line">${signedDate}</span>
          </p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            By typing my name above, I acknowledge that this constitutes a legal electronic signature 
            and that I agree to all terms and conditions stated in this authorization.
          </p>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to Blob
    const blob = new Blob([htmlContent], { type: "text/html" });
    const file = new File([blob], `release-form-${candidate.id}.html`, {
      type: "text/html",
    });

    onFormGenerated(file);
  };

  const handleGenerateForm = () => {
    if (!agreed || !signature) {
      alert("Please read the form and provide your electronic signature");
      return;
    }

    generatePDF();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Background Check Authorization Form
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={formRef}
          className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto space-y-4 text-sm"
        >
          <h3 className="font-bold text-center text-lg">
            BACKGROUND CHECK AUTHORIZATION AND RELEASE
          </h3>

          <p>
            I, <strong>{candidate.personalInfo.name}</strong>, hereby authorize
            Interstate Background Research, Inc. (IBR) and its agents to conduct
            a comprehensive background investigation on my behalf.
          </p>

          <div>
            <h4 className="font-semibold">SCOPE OF INVESTIGATION</h4>
            <p>
              I understand that this investigation may include, but is not
              limited to:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>
                Criminal history records from federal, state, and local
                jurisdictions
              </li>
              <li>Employment verification and references</li>
              <li>Education verification</li>
              <li>Professional license verification</li>
              <li>Credit history (if applicable to position)</li>
              <li>Motor vehicle records</li>
              <li>Social Security number verification</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">RELEASE OF INFORMATION</h4>
            <p>
              I authorize all persons, schools, companies, corporations, credit
              bureaus, law enforcement agencies, and other organizations to
              release any information requested by IBR for the purpose of this
              background investigation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">HOLD HARMLESS</h4>
            <p>
              I release and hold harmless any person or entity providing
              information pursuant to this authorization from any liability or
              claims arising from the release of such information.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">ACKNOWLEDGMENT</h4>
            <p>
              I acknowledge that I have been informed of my rights under the
              Fair Credit Reporting Act (FCRA), including my right to request a
              copy of any consumer report prepared about me.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <Label htmlFor="agree" className="text-sm font-normal">
              I have read and agree to the terms of this background check
              authorization
            </Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="signature">Electronic Signature*</Label>
              <Input
                id="signature"
                placeholder="Type your full legal name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                disabled={!agreed}
              />
              <p className="text-xs text-gray-500">
                By typing your name, you are electronically signing this
                document
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date*</Label>
              <Input
                id="date"
                type="date"
                value={signedDate}
                onChange={(e) => setSignedDate(e.target.value)}
                disabled={!agreed}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateForm}
            disabled={!agreed || !signature}
            className="w-full"
          >
            <Check className="mr-2 h-4 w-4" />
            Sign and Generate Authorization Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
