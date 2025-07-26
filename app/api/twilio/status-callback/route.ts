import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    console.log("📞 Twilio status callback received");
    console.log(
      "📝 Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    console.log("🔗 Request URL:", request.url);

    // Log all form data for debugging
    const formData = await request.formData();
    const allFormData: { [key: string]: string } = {};

    for (const [key, value] of formData.entries()) {
      allFormData[key] = value.toString();
    }

    console.log("📊 All form data received:", allFormData);

    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const duration = formData.get("CallDuration") as string;
    const direction = formData.get("Direction") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const sequenceNumber = formData.get("SequenceNumber") as string;
    const timestamp = formData.get("Timestamp") as string;

    console.log("📊 Key call status data:", {
      callSid,
      callStatus,
      duration: duration || "N/A",
      direction,
      from: from ? "***REDACTED***" : "N/A",
      to: to ? "***REDACTED***" : "N/A",
      sequenceNumber,
      timestamp,
    });

    if (!callSid) {
      console.warn("⚠️ No CallSid provided in status callback");
      console.warn("⚠️ This could indicate a malformed webhook request");
      return NextResponse.json(
        {
          error: "Missing CallSid",
          message: "No CallSid provided in webhook data",
          received: allFormData,
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }
      );
    }

    if (!callStatus) {
      console.warn("⚠️ No CallStatus provided in status callback");
      return NextResponse.json(
        {
          error: "Missing CallStatus",
          message: "No CallStatus provided in webhook data",
          callSid,
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }
      );
    }

    try {
      console.log("🔍 Searching for call record in Firestore...");

      // Find the call record in Firestore
      const callLogsRef = collection(db, "call_logs");
      const q = query(callLogsRef, where("callSid", "==", callSid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn("⚠️ No call record found for CallSid:", callSid);
        console.warn("⚠️ This could mean:");
        console.warn("   - Call was not properly saved during initiation");
        console.warn("   - CallSid mismatch between initiation and callback");
        console.warn("   - Database connectivity issues during call creation");

        return NextResponse.json(
          {
            warning: "Call record not found",
            message: "No existing call record found for this CallSid",
            callSid,
            suggestion: "Check if call was properly initiated and saved",
          },
          {
            status: 404,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "*",
            },
          }
        );
      }

      console.log(
        `✅ Found ${querySnapshot.docs.length} call record(s) for CallSid:`,
        callSid
      );

      // Update the call record
      const callDoc = querySnapshot.docs[0];
      const existingData = callDoc.data();

      console.log("📋 Existing call data:", {
        id: callDoc.id,
        currentStatus: existingData.status,
        candidateName: existingData.candidateName,
        createdAt: existingData.createdAt?.toDate?.()?.toISOString() || "N/A",
      });

      const updateData: any = {
        status: callStatus,
        updatedAt: new Date(),
        lastSequenceNumber: sequenceNumber ? parseInt(sequenceNumber, 10) : 0,
      };

      // Add duration if call is completed
      if (duration && callStatus === "completed") {
        updateData.duration = parseInt(duration, 10);
        console.log(
          "⏱️ Call completed with duration:",
          updateData.duration,
          "seconds"
        );
      }

      // Add additional status-specific data
      if (callStatus === "failed") {
        console.warn("⚠️ Call failed - checking for error details");
        const errorCode = formData.get("ErrorCode") as string;
        const errorMessage = formData.get("ErrorMessage") as string;

        if (errorCode) {
          updateData.errorCode = errorCode;
          updateData.errorMessage = errorMessage || "";
          console.error("❌ Call failed with error:", {
            errorCode,
            errorMessage,
          });
        }
      }

      console.log("💾 Updating call record with data:", updateData);

      await updateDoc(doc(db, "call_logs", callDoc.id), updateData);

      console.log("✅ Call record updated successfully:", {
        id: callDoc.id,
        newStatus: callStatus,
        duration: duration || "N/A",
        sequence: sequenceNumber || "N/A",
      });

      return NextResponse.json(
        {
          success: true,
          message: "Status updated successfully",
          callSid,
          status: callStatus,
          recordId: callDoc.id,
          sequenceNumber: sequenceNumber ? parseInt(sequenceNumber, 10) : 0,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }
      );
    } catch (firestoreError: any) {
      console.error("❌ Firestore error in status callback:", firestoreError);
      console.error("❌ Firestore error details:", {
        name: firestoreError.name,
        message: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack?.substring(0, 500),
      });

      return NextResponse.json(
        {
          error: "Database error",
          message: "Failed to update call status in database",
          details: firestoreError.message,
          callSid,
          status: callStatus,
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ Status callback error:", error);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Status callback processing failed",
        details: error.message,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log("📞 Status callback OPTIONS request received");
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
