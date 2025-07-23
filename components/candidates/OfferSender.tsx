import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjectedStartDate, formatOfferDate } from "@/lib/cohort-dates";

const templates = [
  {
    id: "MASTER Austin UNLICENSED Agent - Offer of Employment Letter.docx",
    label: "Austin – Unlicensed",
  },
  {
    id: "MASTER Austin Agent - Offer of Employment Letter",
    label: "Austin – Licensed",
  },
  {
    id: "MASTER Charlotte UNLICENSED Agent - Offer of Employment Letter.docx",
    label: "Charlotte/Remote – Unlicensed",
  },
  {
    id: "MASTER Charlotte Agent - Offer of Employment Letter.docx",
    label: "Charlotte/Remote – Licensed",
  },
];

function defaultTemplate(candidate: Candidate) {
  // Use assigned class type if available, otherwise fall back to license status
  const assignedClassType = candidate.classAssignment?.classType;
  const isLicensedClass =
    assignedClassType === "AGENT" ||
    (assignedClassType === undefined && candidate.licenseStatus === "Licensed");

  const loc =
    candidate.personalInfo.location?.toLowerCase().includes("austin") ||
    candidate.callCenter === "ATX"
      ? "austin"
      : "charlotte";

  console.log("[OfferSender] Template selection:", {
    candidateName: candidate.personalInfo.name,
    assignedClassType,
    licenseStatus: candidate.licenseStatus,
    callCenter: candidate.callCenter,
    location: loc,
    isLicensedClass,
  });

  if (loc === "austin") {
    return isLicensedClass
      ? "MASTER Austin Agent - Offer of Employment Letter"
      : "MASTER Austin UNLICENSED Agent - Offer of Employment Letter.docx";
  } else {
    return isLicensedClass
      ? "MASTER Charlotte Agent - Offer of Employment Letter.docx"
      : "MASTER Charlotte UNLICENSED Agent - Offer of Employment Letter.docx";
  }
}

export function OfferSender({ candidate }: { candidate: Candidate }) {
  const [templateId, setTemplateId] = useState(defaultTemplate(candidate));
  const [sending, setSending] = useState(false);

  // Check I9 status - offer can only be sent after I9 is completed
  const i9Status = (candidate as any).i9Status;
  const isI9Completed = i9Status === "completed";

  // Calculate projected start date using the new cohort dates system
  const projectedStartDate = getProjectedStartDate(candidate);
  const formattedStartDate = projectedStartDate
    ? formatOfferDate(projectedStartDate)
    : "TBD";

  console.log("[OfferSender] Calculated start date:", {
    candidateName: candidate.personalInfo.name,
    classType:
      candidate.classAssignment?.classType ||
      (candidate.licenseStatus === "Licensed" ? "AGENT" : "UNL"),
    projectedStartDate,
    formattedStartDate,
  });

  const handleSend = async () => {
    try {
      setSending(true);
      console.log("[OfferSender] Starting offer send process...");

      console.log("[OfferSender] Creating Firestore offer document...");
      await setDoc(doc(db, "offers", candidate.id), {
        templateId,
        candidateName: candidate.personalInfo.name,
        candidateEmail: candidate.personalInfo.email,
        projectedStartDate: projectedStartDate,
        formattedStartDate: formattedStartDate,
        classType:
          candidate.classAssignment?.classType ||
          (candidate.licenseStatus === "Licensed" ? "AGENT" : "UNL"),
        callCenter: candidate.callCenter,
        licenseStatus: candidate.licenseStatus,
        sentAt: serverTimestamp(),
        signed: false,
      });
      console.log(
        "[OfferSender] ✅ Firestore document created with candidate data:",
        {
          candidateName: candidate.personalInfo.name,
          projectedStartDate: projectedStartDate,
          formattedStartDate: formattedStartDate,
          classType: candidate.classAssignment?.classType,
          callCenter: candidate.callCenter,
        }
      );

      const emailData = {
        to: candidate.personalInfo.email,
        name: candidate.personalInfo.name,
        link: `${window.location.origin}/offer/${candidate.id}`,
      };
      console.log("[OfferSender] Calling email API with data:", emailData);

      const emailResponse = await fetch("/api/email/send-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      console.log(
        "[OfferSender] Email API response status:",
        emailResponse.status
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("[OfferSender] Email API error:", errorText);
        throw new Error(`Email API failed: ${emailResponse.status}`);
      }

      const emailResult = await emailResponse.json();
      console.log("[OfferSender] Email API result:", emailResult);

      console.log("[OfferSender] ✅ Email API call completed");

      // Show appropriate success message based on mode
      if (
        emailResult.mode === "console" ||
        emailResult.mode === "console_fallback"
      ) {
        alert(
          `Offer email logged to console!\n\n` +
            `${
              emailResult.mode === "console_fallback"
                ? "SendGrid failed, but "
                : ""
            }` +
            `Check the browser console for the email content.\n\n` +
            `To: ${candidate.personalInfo.email}\n` +
            `Link: ${window.location.origin}/offer/${candidate.id}\n` +
            `Start Date: ${formattedStartDate}`
        );
      } else {
        alert(
          `Offer email sent successfully!\n\nProjected Start Date: ${formattedStartDate}`
        );
      }
    } catch (e) {
      console.error("[OfferSender] ❌ Error in handleSend:", e);
      alert("Failed to send offer");
    } finally {
      setSending(false);
    }
  };

  // Show I9 requirement warning if not completed
  if (!isI9Completed) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="font-medium">I-9 Verification Required</span>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            The candidate must complete their I-9 Employment Eligibility
            Verification form before an offer letter can be sent.
          </p>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Current I-9 Status:</strong>{" "}
              {i9Status
                ? i9Status.charAt(0).toUpperCase() + i9Status.slice(1)
                : "Not sent"}
            </p>
            <p>
              <strong>Required Action:</strong> Complete I-9 form in the &quot;I-9
              Form&quot; tab first
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-1">Offer Details</h4>
        <div className="text-sm text-blue-600">
          <p>
            <strong>Candidate:</strong> {candidate.personalInfo.name}
          </p>
          <p>
            <strong>Projected Start Date:</strong> {formattedStartDate}
          </p>
          <p>
            <strong>Class Type:</strong>{" "}
            {candidate.classAssignment?.classType ||
              (candidate.licenseStatus === "Licensed" ? "AGENT" : "UNL")}
          </p>
        </div>
      </div>

      <Select value={templateId} onValueChange={setTemplateId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSend} disabled={sending} className="w-full">
        {sending ? "Sending…" : "Send Offer"}
      </Button>
    </div>
  );
}
