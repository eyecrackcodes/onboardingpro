import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Test with a minimal XML request
    const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_request1.dtd'>
<IBR>
    <AUTH>
        <USERNAME>${
          process.env.NEXT_PUBLIC_IBR_USERNAME || "ApAttonLL"
        }</USERNAME>
        <PASSWORD>${
          process.env.NEXT_PUBLIC_IBR_PASSWORD || "G4#tPkM7@qTT"
        }</PASSWORD>
    </AUTH>
    <REQUESTS>
        <REQUEST>
            <TYPE>
                <ORDER>Package 1</ORDER>
                <CLIENTID>TEST001</CLIENTID>
            </TYPE>
            <NAME>
                <LAST>Test</LAST>
                <FIRST>User</FIRST>
            </NAME>
            <DOB>01011990</DOB>
            <SSN>555001234</SSN>
            <EMAIL>test@example.com</EMAIL>
            <PHONE>5551234567</PHONE>
            <ADDRESS>
                <ADDR1>123 Test Street</ADDR1>
                <CITY>Tampa</CITY>
                <STATE>FL</STATE>
                <ZIPCODE>33601</ZIPCODE>
            </ADDRESS>
            <GENDER>M</GENDER>
        </REQUEST>
    </REQUESTS>
</IBR>`;

    console.log("Testing IBR API connectivity...");
    console.log("Test XML:", testXML);

    const response = await fetch(
      "https://ibrinc.com/webservices/post_dev.cgi",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: testXML,
      }
    );

    const responseText = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      credentials: {
        username: process.env.NEXT_PUBLIC_IBR_USERNAME
          ? "Set"
          : "Using default",
        password: process.env.NEXT_PUBLIC_IBR_PASSWORD
          ? "Set"
          : "Using default",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      errorDetails: error,
    });
  }
}
