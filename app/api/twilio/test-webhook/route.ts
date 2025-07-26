import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Twilio webhook test endpoint working",
    method: "GET",
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Test webhook POST received");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    let body = null;
    try {
      body = await request.json();
    } catch {
      try {
        body = await request.text();
      } catch {
        body = "Unable to parse body";
      }
    }

    console.log("Body:", body);

    return NextResponse.json(
      {
        success: true,
        message: "Twilio webhook test endpoint working",
        method: "POST",
        timestamp: new Date().toISOString(),
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Test webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
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
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
