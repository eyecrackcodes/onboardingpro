import { NextRequest, NextResponse } from "next/server";

const IBR_API_CONFIG = {
  development: {
    baseUrl: "https://ibrinc.com/webservices",
    endpoints: {
      submit: "/post_dev.cgi",
    },
  },
  production: {
    baseUrl: "https://ibrinc.com/webservices",
    endpoints: {
      submit: "/post.cgi",
    },
  },
};

// Use production for real credentials, development for testing
const config =
  process.env.IBR_MOCK_MODE === "true"
    ? IBR_API_CONFIG.development
    : IBR_API_CONFIG.production;

// Mock response for testing
const getMockResponse = (clientId: string) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<IBR>
  <TIMESTAMP>${new Date().toUTCString()}</TIMESTAMP>
  <!-- Mock response - IBR_MOCK_MODE is enabled -->
  <RESPONSES>
    <RESPONSE>
      <SEQUENCE>1</SEQUENCE>
      <CLIENTID>${clientId}</CLIENTID>
      <IBR_ID>MOCK-${Date.now()}</IBR_ID>
    </RESPONSE>
  </RESPONSES>
</IBR>`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("IBR Submit API Route - Request body:", body);

    // Check if mock mode is enabled
    const isMockMode = process.env.IBR_MOCK_MODE === "true";
    console.log("IBR Submit API Route - Mock mode:", isMockMode);

    if (isMockMode) {
      // Extract client ID from the request for mock response
      const clientIdMatch = body.match(/<CLIENTID>([^<]+)<\/CLIENTID>/);
      const clientId = clientIdMatch ? clientIdMatch[1] : "unknown";

      const mockResponse = getMockResponse(clientId);
      console.log("IBR Submit API Route - Returning mock response");

      return NextResponse.json(
        { success: true, data: mockResponse },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get credentials from environment variables
    const username = process.env.IBR_API_USERNAME || "";
    const password = process.env.IBR_API_PASSWORD || "";

    if (!username || !password) {
      console.error("IBR Submit API Route - Missing credentials");
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
    console.log("IBR Submit API Route - Credentials injected");

    const targetUrl = `${config.baseUrl}${config.endpoints.submit}`;
    console.log("IBR Submit API Route - Target URL:", targetUrl);

    // Make the request to IBR API from the server
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: authenticatedXml,
    });

    console.log("IBR Submit API Route - Response status:", response.status);
    const responseText = await response.text();
    console.log("IBR Submit API Route - Response text:", responseText);

    if (!response.ok) {
      console.error(
        "IBR Submit API Route - Error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `IBR API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { success: true, data: responseText },
      { status: 200 }
    );
  } catch (error) {
    console.error("IBR Submit API Route - Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
