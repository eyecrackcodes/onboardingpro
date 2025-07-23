import { NextRequest, NextResponse } from "next/server";

const IBR_API_CONFIG = {
  development: {
    baseUrl: "https://ibrinc.com/webservices",
    endpoints: {
      attach: "/attach_dev.cgi",
    },
  },
  production: {
    baseUrl: "https://ibrinc.com/webservices",
    endpoints: {
      attach: "/attach.cgi",
    },
  },
};

const config = IBR_API_CONFIG.development;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Make the request to IBR API from the server
    const response = await fetch(
      `${config.baseUrl}${config.endpoints.attach}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `IBR API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error attaching file to IBR:", error);
    return NextResponse.json(
      { error: "Failed to attach file to background check" },
      { status: 500 }
    );
  }
}
