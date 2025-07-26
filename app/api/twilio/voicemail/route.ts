import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    console.log("📹 Voicemail handler called");
    console.log("📝 Request headers:", Object.fromEntries(request.headers.entries()));

    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const duration = formData.get("RecordingDuration") as string;
    const transcription = formData.get("TranscriptionText") as string;

    console.log("📹 Voicemail details:", {
      callSid,
      recordingSid,
      duration: duration || "N/A",
      transcriptionLength: transcription ? transcription.length : 0,
      hasRecording: !!recordingUrl,
    });

    // Save voicemail to Firestore
    const voicemailData = {
      callSid: callSid,
      recordingUrl: recordingUrl,
      recordingSid: recordingSid,
      duration: duration ? parseInt(duration, 10) : 0,
      transcription: transcription || "",
      createdAt: serverTimestamp(),
      status: "new",
    };

    try {
      const docRef = await addDoc(collection(db, "voicemails"), voicemailData);
      console.log("✅ Voicemail saved with ID:", docRef.id);

      // Return TwiML to thank the user
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Thank you for your message. We have received your voicemail and will get back to you soon. 
    Have a great day!
  </Say>
</Response>`;

      return new NextResponse(twiml, {
        headers: {
          "Content-Type": "text/xml",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    } catch (firestoreError: any) {
      console.error("❌ Failed to save voicemail:", firestoreError);
      
      // Still return success TwiML to user
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Thank you for your message. We'll get back to you soon.
  </Say>
</Response>`;

      return new NextResponse(twiml, {
        headers: {
          "Content-Type": "text/xml",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }
  } catch (error: any) {
    console.error("❌ Voicemail handler error:", error);
    console.error("❌ Error stack:", error.stack);

    // Return basic TwiML even on error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Thank you for calling. Please try again later.
  </Say>
</Response>`;

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log("📹 Voicemail OPTIONS request received");
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
} 