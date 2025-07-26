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

// Get the correct app URL based on environment
function getAppUrl(request: NextRequest): string {
  // Try to get URL from environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log(
      "🌐 Using NEXT_PUBLIC_APP_URL:",
      process.env.NEXT_PUBLIC_APP_URL
    );
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Get URL from request headers
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";

  if (host) {
    const url = `${protocol}://${host}`;
    console.log("🌐 Built URL from headers:", url);
    return url;
  }

  // Fallback for development
  console.log("🌐 Using fallback localhost URL");
  return "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("🔥 =================================================");
  console.log("🔥 Twilio API route called at:", new Date().toISOString());
  console.log(
    "📝 Request headers:",
    Object.fromEntries(request.headers.entries())
  );
  console.log("🔗 Request URL:", request.url);

  try {
    // Parse request body
    const callRequest = await request.json();
    console.log("📞 Call request received:", {
      candidateId: callRequest.candidateId,
      candidateName: callRequest.candidateName,
      candidatePhone: callRequest.candidatePhone ? "***REDACTED***" : "MISSING",
      purpose: callRequest.purpose,
      forceRealCall: callRequest.forceRealCall,
    });

    // Validate environment variables
    console.log("🔧 Environment check:");
    console.log("   - NODE_ENV:", process.env.NODE_ENV);
    console.log("   - DEV_MODE:", DEV_MODE);
    console.log("   - accountSid:", accountSid ? "SET" : "MISSING");
    console.log("   - authToken:", authToken ? "SET" : "MISSING");
    console.log(
      "   - twilioPhoneNumber:",
      twilioPhoneNumber ? "SET" : "MISSING"
    );

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("❌ Missing Twilio environment variables");
      return NextResponse.json(
        {
          error: "Twilio configuration missing",
          details:
            "Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables",
          debug: {
            accountSid: !!accountSid,
            authToken: !!authToken,
            twilioPhoneNumber: !!twilioPhoneNumber,
          },
        },
        { status: 500 }
      );
    }

    // Validate request body
    if (!callRequest.candidatePhone || !callRequest.candidateName) {
      console.error("❌ Missing required fields in request");
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "candidatePhone and candidateName are required",
          received: {
            candidatePhone: !!callRequest.candidatePhone,
            candidateName: !!callRequest.candidateName,
          },
        },
        { status: 400 }
      );
    }

    // Clean phone number - handle missing phone gracefully
    const rawPhone = callRequest.candidatePhone || "5551234567";
    const cleaned = rawPhone.replace(/\D/g, "");
    const candidatePhone =
      cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;

    console.log("📱 Phone number processing:");
    console.log("   - Raw phone:", rawPhone);
    console.log("   - Cleaned digits:", cleaned);
    console.log("   - Final phone:", candidatePhone);

    // Get the correct app URL
    const appUrl = getAppUrl(request);
    console.log("🌐 Final app URL:", appUrl);

    // Check if we should force a real call
    const forceRealCall =
      callRequest.forceRealCall ||
      request.headers.get("X-Force-Real-Call") === "true" ||
      process.env.FORCE_REAL_CALLS === "true";

    console.log("🎯 Call mode decision:");
    console.log("   - DEV_MODE:", DEV_MODE);
    console.log("   - forceRealCall:", forceRealCall);
    console.log("   - Will make real call:", !DEV_MODE || forceRealCall);

    let callSid = "";
    let status = "initiated";

    // Only make real Twilio call in production or when explicitly forced
    if (!DEV_MODE || forceRealCall) {
      console.log("🌐 Making REAL Twilio call");

      // Initialize Twilio client
      console.log("🔧 Initializing Twilio client...");
      const client = twilio(accountSid, authToken);

      // Create TwiML URL for the call
      const twimlUrl = `${appUrl}/api/twilio/twiml?candidate=${encodeURIComponent(
        callRequest.candidateName
      )}&purpose=${encodeURIComponent(callRequest.purpose)}`;

      const statusCallbackUrl = `${appUrl}/api/twilio/status-callback`;

      console.log("🎵 TwiML URL:", twimlUrl);
      console.log("📞 Status callback URL:", statusCallbackUrl);

      console.log("📞 Creating Twilio call with parameters:");
      const callParams = {
        from: twilioPhoneNumber,
        to: candidatePhone,
        url: twimlUrl,
        statusCallback: statusCallbackUrl,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
      };
      console.log("   - Call params:", {
        ...callParams,
        to: "***REDACTED***",
      });

      try {
        console.log("⏳ Making Twilio API call...");
        const callStartTime = Date.now();

        // Make the actual Twilio call
        const call = await client.calls.create(callParams);

        const callEndTime = Date.now();
        console.log(
          `✅ Twilio call created in ${callEndTime - callStartTime}ms`
        );

        callSid = call.sid;
        status = call.status;

        console.log("✅ Twilio call success:");
        console.log("   - CallSid:", callSid);
        console.log("   - Status:", status);
        console.log("   - Direction:", call.direction);
        console.log("   - From:", call.from);
        console.log("   - To:", "***REDACTED***");
        console.log("   - Created:", call.dateCreated);
      } catch (twilioError: any) {
        console.error("❌ Twilio API error:", twilioError);
        console.error("❌ Twilio error details:", {
          name: twilioError.name,
          message: twilioError.message,
          code: twilioError.code,
          status: twilioError.status,
          moreInfo: twilioError.moreInfo,
          details: twilioError.details,
          stack: twilioError.stack?.substring(0, 500),
        });

        return NextResponse.json(
          {
            error: "Failed to initiate call",
            details: twilioError.message,
            type: twilioError.name,
            code: twilioError.code,
            status: twilioError.status,
            moreInfo: twilioError.moreInfo,
          },
          { status: 500 }
        );
      }
    } else {
      console.log("🧪 DEV MODE: Simulating call (no real Twilio request)");
      // Generate mock call SID for development
      callSid = `CA_dev_${Date.now()}`;
      status = "initiated";
      console.log("🧪 Generated mock CallSid:", callSid);
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
      isDev: DEV_MODE && !forceRealCall,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log("💾 Preparing to save call record to Firestore:");
    console.log("   - Record ID will be auto-generated");
    console.log("   - Candidate ID:", callRecord.candidateId);
    console.log("   - Call SID:", callRecord.callSid);
    console.log("   - Status:", callRecord.status);
    console.log("   - Is Dev Mode:", callRecord.isDev);

    try {
      console.log("⏳ Saving to Firestore...");
      const firestoreStartTime = Date.now();

      // Save to Firestore
      const docRef = await addDoc(collection(db, "call_logs"), callRecord);

      const firestoreEndTime = Date.now();
      console.log(
        `✅ Call record saved to Firestore in ${
          firestoreEndTime - firestoreStartTime
        }ms`
      );
      console.log("✅ Firestore document ID:", docRef.id);

      // Return success response
      const responseData = {
        success: true,
        id: docRef.id,
        callSid: callSid,
        status: status,
        isDev: callRecord.isDev,
        processingTime: Date.now() - startTime,
        ...callRecord,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("✅ Returning success response:");
      console.log("   - Document ID:", responseData.id);
      console.log("   - Call SID:", responseData.callSid);
      console.log("   - Status:", responseData.status);
      console.log("   - Processing time:", responseData.processingTime, "ms");
      console.log("🔥 =================================================");

      return NextResponse.json(responseData);
    } catch (firestoreError: any) {
      console.error("❌ Firestore error:", firestoreError);
      console.error("❌ Firestore error details:", {
        name: firestoreError.name,
        message: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack?.substring(0, 500),
      });

      return NextResponse.json(
        {
          error: "Failed to save call record",
          details: firestoreError.message,
          type: firestoreError.name,
          code: firestoreError.code,
          callSid: callSid,
          twilioSuccess: true,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("❌ Unexpected error in initiate-call API:", error);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500),
      processingTime,
    });
    console.log("🔥 =================================================");

    return NextResponse.json(
      {
        error: "Failed to initiate call",
        details: error.message,
        type: error.name,
        processingTime,
      },
      { status: 500 }
    );
  }
}
