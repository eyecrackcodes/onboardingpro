import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Development mode flag - simulates calls without making real Twilio requests
const DEV_MODE = process.env.NODE_ENV === "development";

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Twilio API route called");

    // Parse request body
    const callRequest = await request.json();
    console.log("📞 Call request received:", {
      candidateId: callRequest.candidateId,
      candidateName: callRequest.candidateName,
      candidatePhone: callRequest.candidatePhone ? "***REDACTED***" : "MISSING",
      purpose: callRequest.purpose,
    });

    // Validate environment variables
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("❌ Missing Twilio environment variables");
      return NextResponse.json(
        {
          error: "Twilio configuration missing",
          details:
            "Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables",
        },
        { status: 500 }
      );
    }

    // Validate request body
    if (!callRequest.candidatePhone || !callRequest.candidateName) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "candidatePhone and candidateName are required",
        },
        { status: 400 }
      );
    }

    // Clean phone number - handle missing phone gracefully
    const rawPhone = callRequest.candidatePhone || "5551234567";
    const cleaned = rawPhone.replace(/\D/g, "");
    const candidatePhone =
      cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;

    console.log("📱 Cleaned phone number:", candidatePhone);

    // Check if we should force a real call
    const forceRealCall =
      callRequest.forceRealCall ||
      request.headers.get("X-Force-Real-Call") === "true" ||
      process.env.FORCE_REAL_CALLS === "true";

    let callSid = "";
    let status = "initiated";

    // Only make real Twilio call in production or when explicitly forced
    if (!DEV_MODE || forceRealCall) {
      console.log("🌐 Making REAL Twilio call");

      // Initialize Twilio client
      const client = twilio(accountSid, authToken);

      // Create TwiML URL for the call
      const twimlUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "https://your-app-domain.vercel.app"
      }/api/twilio/twiml?candidate=${encodeURIComponent(
        callRequest.candidateName
      )}&purpose=${encodeURIComponent(callRequest.purpose)}`;

      try {
        // Make the actual Twilio call
        const call = await client.calls.create({
          from: twilioPhoneNumber,
          to: candidatePhone,
          url: twimlUrl,
          statusCallback: `${
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://your-app-domain.vercel.app"
          }/api/twilio/status-callback`,
          statusCallbackEvent: [
            "initiated",
            "ringing",
            "answered",
            "completed",
          ],
          statusCallbackMethod: "POST",
        });

        callSid = call.sid;
        status = call.status;
        console.log("✅ Twilio call created:", { callSid, status });
      } catch (twilioError: any) {
        console.error("❌ Twilio API error:", twilioError);
        return NextResponse.json(
          {
            error: "Failed to initiate call",
            details: twilioError.message,
            type: twilioError.name,
          },
          { status: 500 }
        );
      }
    } else {
      console.log("🧪 DEV MODE: Simulating call (no real Twilio request)");
      // Generate mock call SID for development
      callSid = `CA_dev_${Date.now()}`;
      status = "initiated";
    }

    // Create call record for Firestore
    const callRecord = {
      candidateId: callRequest.candidateId || "unknown",
      candidateName: callRequest.candidateName,
      candidatePhone: candidatePhone,
      recruiterPhone: callRequest.recruiterPhone || twilioPhoneNumber,
      purpose: callRequest.purpose || "general",
      notes: callRequest.notes || "",
      callSid: callSid,
      status: status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("💾 Saving call record to Firestore...");

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, "call_logs"), callRecord);

      console.log("✅ Call record saved with ID:", docRef.id);

      // Return success response
      const responseData = {
        id: docRef.id,
        callSid: callSid,
        status: status,
        ...callRecord,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return NextResponse.json(responseData);
    } catch (firestoreError: any) {
      console.error("❌ Firestore error:", firestoreError);
      return NextResponse.json(
        {
          error: "Failed to initiate call",
          details: firestoreError.message,
          type: firestoreError.name,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Unexpected error in initiate-call API:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate call",
        details: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}
