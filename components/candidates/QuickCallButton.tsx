"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { TwilioService, type CallRequest } from "@/lib/twilio-service";
import { CallDispositionForm } from "./CallDispositionForm";

interface QuickCallButtonProps {
  candidate: {
    id: string;
    name: string;
    phone?: string;
  };
}

export function QuickCallButton({ candidate }: QuickCallButtonProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [callRecord, setCallRecord] = useState<any>(null);

  const handleCall = async () => {
    if (!candidate.phone) {
      alert("No phone number available for this candidate.");
      return;
    }

    setIsCallActive(true);

    try {
      const callRequest: CallRequest = {
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidatePhone: candidate.phone,
        purpose: "follow_up",
        notes: "Quick call from candidate list",
      };

      console.log("📞 Initiating call for:", candidate.name);
      const result = await TwilioService.initiateCall(callRequest);

      console.log("✅ Call initiated successfully:", result);
      setCallRecord(result);
      setShowDisposition(true);
    } catch (error) {
      console.error("❌ Call failed:", error);
      alert("Failed to initiate call. Please try again.");
    } finally {
      setIsCallActive(false);
    }
  };

  const handleDispositionComplete = () => {
    setShowDisposition(false);
    setCallRecord(null);
  };

  if (showDisposition && callRecord) {
    return (
      <CallDispositionForm
        callRecord={callRecord}
        candidateId={candidate.id}
        onComplete={handleDispositionComplete}
        onCancel={handleDispositionComplete}
      />
    );
  }

  return (
    <Button
      onClick={handleCall}
      disabled={isCallActive || !candidate.phone}
      size="sm"
      variant="outline"
      className="h-8 w-8 p-0"
    >
      <Phone className="h-4 w-4" />
    </Button>
  );
}
