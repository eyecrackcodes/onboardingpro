// Twilio calling service for candidate recruitment
export interface CallRequest {
  candidateId: string;
  candidateName: string;
  candidatePhone: string;
  purpose: string;
  notes?: string;
  recruiterPhone?: string;
  forceRealCall?: boolean;
}

export interface CallRecord extends CallRequest {
  id: string;
  status: string;
  callSid: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TwilioService {
  private static baseUrl = "/api/twilio";

  static async initiateCall(callRequest: CallRequest): Promise<CallRecord> {
    try {
      console.log("🔥 TwilioService.initiateCall called with:", {
        candidateId: callRequest.candidateId,
        candidateName: callRequest.candidateName,
        candidatePhone: callRequest.candidatePhone
          ? "***REDACTED***"
          : "MISSING",
        purpose: callRequest.purpose,
      });

      const response = await fetch(`${this.baseUrl}/initiate-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callRequest),
      });

      console.log("📞 API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        throw new Error(errorData.error || "Failed to initiate call");
      }

      const result = await response.json();
      console.log("✅ Call initiated successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in TwilioService.initiateCall:", error);
      throw new Error("Failed to initiate call");
    }
  }

  static async getCallHistory(candidateId: string): Promise<CallRecord[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/call-history/${candidateId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch call history");
      }

      const data = await response.json();
      return data.calls || [];
    } catch (error) {
      console.error("Error fetching call history:", error);
      return [];
    }
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, "");

    // Format for display: (555) 123-4567
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }

    return phone; // Return original if not 10 digits
  }

  static cleanPhoneNumber(phone: string): string {
    // Remove all non-digits and format for Twilio (E.164)
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`;
    }

    return `+${cleaned}`;
  }
}
