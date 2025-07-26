import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🎵 TwiML route called");
    console.log(
      "📝 Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    const url = new URL(request.url);
    const candidate = url.searchParams.get("candidate") || "candidate";
    const purpose = url.searchParams.get("purpose") || "follow up";

    // Parse any form data if this is a POST with form data
    let gatherResult = "";
    let digits = "";
    try {
      const formData = await request.formData();
      gatherResult = (formData.get("SpeechResult") as string) || "";
      digits = (formData.get("Digits") as string) || "";

      console.log("📊 Gather results:", { gatherResult, digits });
    } catch {
      // Not form data, that's ok
      console.log("📊 No form data in request");
    }

    console.log("🎵 TwiML requested for:", {
      candidate,
      purpose,
      gatherResult,
      digits,
    });

    // Handle different call flows based on user input
    let twiml = "";

    if (digits === "1") {
      // User pressed 1 - Connect to recruiter
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Connecting you to the recruiter now. Please hold.
  </Say>
  <Dial timeout="30" callerId="${process.env.TWILIO_PHONE_NUMBER}">
    <Number>${
      process.env.RECRUITER_PHONE || process.env.TWILIO_PHONE_NUMBER
    }</Number>
  </Dial>
  <Say voice="alice">
    The recruiter is not available at the moment. Please try again later or leave a voicemail.
  </Say>
  <Record maxLength="60" transcribe="true" action="/api/twilio/voicemail" />
</Response>`;
    } else if (digits === "2") {
      // User pressed 2 - Schedule callback
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Thank you! We'll schedule a callback for you. Please expect a call within 24 hours. 
    Have a great day!
  </Say>
</Response>`;
    } else if (digits === "3") {
      // User pressed 3 - Leave voicemail
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Please leave a detailed message after the beep. Press any key when finished.
  </Say>
  <Record maxLength="120" transcribe="true" action="/api/twilio/voicemail" playBeep="true" />
  <Say voice="alice">
    Thank you for your message. We'll get back to you soon. Goodbye!
  </Say>
</Response>`;
    } else {
      // Main menu - provide call tools options
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello! This is an automated call from your recruitment team regarding ${candidate}. 
    This is a ${purpose} call.
  </Say>
  <Pause length="1"/>
  <Gather timeout="10" numDigits="1" action="/api/twilio/twiml?candidate=${encodeURIComponent(
    candidate
  )}&purpose=${encodeURIComponent(purpose)}">
    <Say voice="alice">
      Please choose from the following options:
      Press 1 to speak with a recruiter now.
      Press 2 to schedule a callback.
      Press 3 to leave a voicemail.
      Or stay on the line to hear this message again.
    </Say>
  </Gather>
  <Say voice="alice">
    I didn't receive a response. Let me repeat the options.
  </Say>
  <Redirect>/api/twilio/twiml?candidate=${encodeURIComponent(
    candidate
  )}&purpose=${encodeURIComponent(purpose)}</Redirect>
</Response>`;
    }

    console.log("✅ TwiML generated successfully");
    console.log("🎵 TwiML content preview:", twiml.substring(0, 200) + "...");

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (error: any) {
    console.error("❌ TwiML generation error:", error);
    console.error("❌ Error stack:", error.stack);

    // Return basic TwiML even on error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello! This is a call from your recruitment team. 
    We're experiencing technical difficulties. Please call us back or we'll try again later.
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

export async function GET(request: NextRequest) {
  console.log("🎵 TwiML GET request received");
  // Handle GET requests the same way
  return POST(request);
}

export async function OPTIONS(request: NextRequest) {
  console.log("🎵 TwiML OPTIONS request received");
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
