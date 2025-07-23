import { NextRequest, NextResponse } from "next/server";

const IBR_API_CONFIG = {
  development: {
    baseUrl: "https://ibrinc.com/webservices",
    endpoints: {
      status: "/post_status_dev.cgi",
    },
  },
  production: {
    baseUrl: "https://ibrinc.com/webservices",
    endpoints: {
      status: "/post_status.cgi",
    },
  },
};

// Use production for real credentials, development for testing
const config =
  process.env.IBR_MOCK_MODE === "true"
    ? IBR_API_CONFIG.development
    : IBR_API_CONFIG.production;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("IBR Status API Route - Request body:", body);

    // Get credentials from environment variables
    const username = process.env.IBR_API_USERNAME || "";
    const password = process.env.IBR_API_PASSWORD || "";

    if (!username || !password) {
      console.error("IBR Status API Route - Missing credentials");
      return NextResponse.json(
        { error: "IBR API credentials not configured" },
        { status: 500 }
      );
    }

    // Inject credentials into the XML
    const authXml = `    <AUTH>
        <USERNAME>${username}</USERNAME>
        <PASSWORD>${password}</PASSWORD>
    </AUTH>`;

    // Insert AUTH section after <IBR> tag
    const authenticatedXml = body.replace("<IBR>", `<IBR>\n${authXml}`);
    console.log("IBR Status API Route - Credentials injected");

    // Make the request to IBR API from the server
    const response = await fetch(
      `${config.baseUrl}${config.endpoints.status}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: authenticatedXml,
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `IBR API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Check if this is a binary response (PDF report)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/pdf")) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    }

    return new NextResponse(responseText, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error checking IBR status:", error);
    return NextResponse.json(
      { error: "Failed to check background check status" },
      { status: 500 }
    );
  }
}
