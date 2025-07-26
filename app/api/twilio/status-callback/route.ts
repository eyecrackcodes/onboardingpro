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

    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const duration = formData.get("CallDuration") as string;

    console.log("📊 Call status update:", {
      callSid,
      callStatus,
      duration: duration || "N/A",
    });

    if (!callSid) {
      console.warn("⚠️ No CallSid provided in status callback");
      return NextResponse.json(
        { message: "No CallSid provided" },
        { status: 400 }
      );
    }

    try {
      // Find the call record in Firestore
      const callLogsRef = collection(db, "call_logs");
      const q = query(callLogsRef, where("callSid", "==", callSid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn("⚠️ No call record found for CallSid:", callSid);
        return NextResponse.json(
          { message: "Call record not found" },
          { status: 404 }
        );
      }

      // Update the call record
      const callDoc = querySnapshot.docs[0];
      const updateData: any = {
        status: callStatus,
        updatedAt: new Date(),
      };

      // Add duration if call is completed
      if (duration && callStatus === "completed") {
        updateData.duration = parseInt(duration, 10);
      }

      await updateDoc(doc(db, "call_logs", callDoc.id), updateData);

      console.log("✅ Call record updated successfully:", {
        id: callDoc.id,
        status: callStatus,
        duration: duration || "N/A",
      });

      return NextResponse.json({
        message: "Status updated successfully",
        callSid,
        status: callStatus,
      });
    } catch (firestoreError: any) {
      console.error("❌ Firestore error in status callback:", firestoreError);
      return NextResponse.json(
        {
          error: "Failed to update call status",
          details: firestoreError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Status callback error:", error);
    return NextResponse.json(
      { error: "Status callback failed", details: error.message },
      { status: 500 }
    );
  }
}
