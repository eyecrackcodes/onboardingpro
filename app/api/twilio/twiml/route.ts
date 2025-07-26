import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const candidate = url.searchParams.get("candidate") || "candidate";
    const purpose = url.searchParams.get("purpose") || "follow up";

    console.log("🎵 TwiML requested for:", { candidate, purpose });

    // Generate TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello! This is an automated call from your recruitment team regarding ${candidate}. 
    This is a ${purpose} call. Please hold while we connect you to your recruiter.
    If this is not a good time, please hang up and we'll call back later.
  </Say>
  <Pause length="2"/>
  <Say voice="alice">
    Thank you for your time. This call is now complete.
  </Say>
</Response>`;

    console.log("✅ TwiML generated successfully");

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error: any) {
    console.error("❌ TwiML generation error:", error);

    // Return basic TwiML even on error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello! This is a call from your recruitment team. 
    Please hold while we connect you.
  </Say>
</Response>`;

    return new NextResponse(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests the same way
  return POST(request);
}
