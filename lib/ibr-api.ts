// IBR API Client for Background Checks
import type { Candidate } from "./types";

// API Configuration - Now using local API routes
const API_ROUTES = {
  submit: "/api/ibr/submit",
  status: "/api/ibr/status",
  attach: "/api/ibr/attach",
};

// The actual credentials are handled server-side in the API routes
// Client-side code should never have access to API credentials

// Types for IBR API
export interface IBRRequest {
  type: {
    order: string;
    clientId?: string;
    subcompany?: string;
  };
  name: {
    last: string;
    middle?: string;
    first: string;
  };
  dob?: string; // MMDDYYYY
  ssn: string;
  email?: string;
  emailReport?: "Y" | "N";
  phone?: string;
  address: {
    addr1: string;
    addr2?: string;
    city: string;
    state: string;
    county?: string;
    zipcode: string;
  };
  gender?: "M" | "F";
}

export interface IBRResponse {
  sequence: number;
  clientId?: string;
  ibrId?: string;
  error?: string;
}

export interface IBRStatusResponse {
  id: string;
  status:
    | "Pending"
    | "Processing"
    | "Review"
    | "Pass"
    | "Fail"
    | "Unauthorized";
  clientId?: string;
  reportUrl?: string;
  extended?: {
    credit?: "Pass" | "Fail" | "Review";
    federal?: "Pass" | "Fail" | "Review";
    state?: "Pass" | "Fail" | "Review";
    social?: "Pass" | "Fail" | "Review";
    pdb?: "Pass" | "Fail" | "Review"; // Patriot Database
    sex_offender?: "Pass" | "Fail" | "Review";
    drug?: "Pass" | "Fail" | "Review";
    employment?: "Pass" | "Fail" | "Review";
    education?: "Pass" | "Fail" | "Review";
    // Add more as needed
  };
  timestamps?: {
    submitted?: string;
    completed?: string;
  };
}

// Helper function to format XML
function buildRequestXML(requests: IBRRequest[]): string {
  const requestsXML = requests
    .map(
      (req) => `
        <REQUEST>
            <TYPE>
                <ORDER>${req.type.order}</ORDER>
                ${
                  req.type.clientId
                    ? `<CLIENTID>${req.type.clientId}</CLIENTID>`
                    : ""
                }
                ${
                  req.type.subcompany
                    ? `<SUBCOMPANY>${req.type.subcompany}</SUBCOMPANY>`
                    : ""
                }
            </TYPE>
            <NAME>
                <LAST>${req.name.last}</LAST>
                ${req.name.middle ? `<MIDDLE>${req.name.middle}</MIDDLE>` : ""}
                <FIRST>${req.name.first}</FIRST>
            </NAME>
            ${req.dob ? `<DOB>${req.dob}</DOB>` : ""}
            <SSN>${req.ssn}</SSN>
            ${req.email ? `<EMAIL>${req.email}</EMAIL>` : ""}
            ${
              req.emailReport
                ? `<EMAIL_REPORT>${req.emailReport}</EMAIL_REPORT>`
                : ""
            }
            ${req.phone ? `<PHONE>${req.phone}</PHONE>` : ""}
            <ADDRESS>
                <ADDR1>${req.address.addr1}</ADDR1>
                ${
                  req.address.addr2 ? `<ADDR2>${req.address.addr2}</ADDR2>` : ""
                }
                <CITY>${req.address.city}</CITY>
                <STATE>${req.address.state}</STATE>
                ${
                  req.address.county
                    ? `<COUNTY>${req.address.county}</COUNTY>`
                    : ""
                }
                <ZIPCODE>${req.address.zipcode}</ZIPCODE>
            </ADDRESS>
            ${req.gender ? `<GENDER>${req.gender}</GENDER>` : ""}
        </REQUEST>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_request1.dtd'>
<IBR>
    <REQUESTS>
        ${requestsXML}
    </REQUESTS>
</IBR>`;
}

// Parse XML response
function parseXMLResponse(xml: string): IBRResponse[] {
  const responses: IBRResponse[] = [];

  console.log("Parsing XML response:", xml);

  // Handle error responses that don't have SEQUENCE
  const errorMatch = xml.match(
    /<RESPONSE>\s*<ERROR>([^<]+)<\/ERROR>\s*<\/RESPONSE>/
  );
  if (errorMatch) {
    console.log("Found error match:", errorMatch[1]);
    responses.push({
      sequence: 1,
      error: errorMatch[1],
    });
    return responses;
  }

  // Simple XML parsing - in production, use a proper XML parser
  // Update regex to handle both <ERROR> and <e> tags for compatibility
  const responseMatches = xml.matchAll(
    /<RESPONSE>[\s\S]*?<SEQUENCE>(\d+)<\/SEQUENCE>[\s\S]*?(?:<CLIENTID>([^<]+)<\/CLIENTID>)?[\s\S]*?(?:<IBR_ID>([^<]+)<\/IBR_ID>|<ERROR>([^<]+)<\/ERROR>|<e>([^<]+)<\/e>)[\s\S]*?<\/RESPONSE>/g
  );

  for (const match of responseMatches) {
    console.log("Found response match:", match);
    responses.push({
      sequence: parseInt(match[1]),
      clientId: match[2] || undefined,
      ibrId: match[3] || undefined,
      error: match[4] || match[5] || undefined,
    });
  }

  console.log("Parsed responses:", responses);

  return responses;
}

// Parse status XML response
function parseStatusXMLResponse(xml: string): IBRStatusResponse[] {
  const statuses: IBRStatusResponse[] = [];

  // Helper to normalize status codes
  const normalizeStatus = (raw: string): IBRStatusResponse["status"] => {
    const map: Record<string, IBRStatusResponse["status"]> = {
      P: "Pass",
      F: "Fail",
      R: "Review",
      Pending: "Pending",
      Processing: "Processing",
      Complete: "Pass", // fallback
    };
    return (map[raw] || raw) as IBRStatusResponse["status"];
  };

  // First, attempt to parse new IBR <RESPONSE> based XML (as described in spec)
  const responseMatches = xml.matchAll(
    /<RESPONSE>[\s\S]*?<IBR_ID>([^<]+)<\/IBR_ID>[\s\S]*?<STATUS>([^<]+)<\/STATUS>[\s\S]*?(?:<CLIENTID>([^<]+)<\/CLIENTID>)?[\s\S]*?(?:<SUBMITTED>([^<]+)<\/SUBMITTED>)?[\s\S]*?(?:<COMPLETED>([^<]+)<\/COMPLETED>)?[\s\S]*?(?:<EXTENDEDSTATUSES>([\s\S]*?)<\/EXTENDEDSTATUSES>)?[\s\S]*?<\/RESPONSE>/g
  );

  for (const match of responseMatches) {
    const id = match[1];
    const rawStatus = match[2];
    const clientId = match[3];
    const submitted = match[4];
    const completed = match[5];
    const extendedBlock = match[6] || "";

    const extended: IBRStatusResponse["extended"] = {};

    // Parse individual EXTENDEDSTATUS sections
    const extMatches = extendedBlock.matchAll(
      /<EXTENDEDSTATUS>[\s\S]*?<SECTION>([^<]+)<\/SECTION>[\s\S]*?<STATUS>([^<]+)<\/STATUS>[\s\S]*?<\/EXTENDEDSTATUS>/g
    );

    for (const em of extMatches) {
      const section = em[1].toLowerCase().trim();
      const secStatus = normalizeStatus(em[2].trim());
      (extended as any)[section] = secStatus;
    }

    // Create comprehensive status object
    const statusObj: IBRStatusResponse = {
      id,
      status: normalizeStatus(rawStatus.trim()),
      clientId: clientId?.trim() || undefined,
      reportUrl: undefined, // not provided in status format
      extended: Object.keys(extended).length ? extended : undefined,
      // Add additional metadata if available
      timestamps: {
        submitted: submitted?.trim() || undefined,
        completed: completed?.trim() || undefined,
      },
    };

    statuses.push(statusObj);
  }

  // If no matches found, fall back to legacy <REPORTSTATUS> parsing
  if (statuses.length === 0) {
    const statusMatches = xml.matchAll(
      /<REPORTSTATUS id="(\d+)">[\s\S]*?<STATUS>([^<]+)<\/STATUS>[\s\S]*?(?:<CLIENT_ID>([^<]+)<\/CLIENT_ID>)?[\s\S]*?(?:<REPORTURL>([^<]+)<\/REPORTURL>)?[\s\S]*?<\/REPORTSTATUS>/g
    );

    for (const match of statusMatches) {
      statuses.push({
        id: match[1],
        status: normalizeStatus(match[2].trim()),
        clientId: match[3]?.trim() || undefined,
        reportUrl: match[4]?.trim() || undefined,
      });
    }
  }

  console.log("[IBR API] Parsed status objects:", statuses);
  return statuses;
}

// Submit background check request
export async function submitBackgroundCheck(
  candidate: Candidate,
  additionalInfo?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    ssn: string;
    dob: string;
    address: {
      addr1: string;
      city: string;
      state: string;
      zipcode: string;
    };
    gender?: "M" | "F";
  }
): Promise<{
  success: boolean;
  ibrId?: string;
  error?: string;
}> {
  try {
    // Prepare request data - use provided names if available, otherwise parse from candidate name
    let firstName = additionalInfo?.firstName || "";
    let lastName = additionalInfo?.lastName || "";
    let middle = additionalInfo?.middleName;

    // Fallback to parsing from candidate name if not provided
    if (!firstName || !lastName) {
      const nameParts = candidate.personalInfo.name.split(" ");
      firstName = firstName || nameParts[0] || "";
      lastName = lastName || nameParts[nameParts.length - 1] || "";
      middle = middle || (nameParts.length > 2 ? nameParts[1] : undefined);
    }

    // Format DOB from YYYYMMDD to MMDDYYYY
    let formattedDob = "";
    if (additionalInfo?.dob) {
      // If DOB is in YYYYMMDD format (8 digits)
      if (additionalInfo.dob.length === 8) {
        formattedDob =
          additionalInfo.dob.substring(4) + additionalInfo.dob.substring(0, 4);
      } else {
        formattedDob = additionalInfo.dob;
      }
    }

    const request: IBRRequest = {
      type: {
        order: "Package 2", // Using Package 2 as required by IBR
        clientId: candidate.id,
      },
      name: {
        first: firstName,
        middle: middle,
        last: lastName,
      },
      ssn: additionalInfo?.ssn || "555001234", // Use provided SSN or test SSN
      email: candidate.personalInfo.email,
      emailReport: "Y",
      phone: candidate.personalInfo.phone.replace(/\D/g, ""),
      address: additionalInfo?.address || {
        addr1: "123 Main St",
        city: candidate.personalInfo.location.split(",")[0] || "Unknown",
        state: candidate.personalInfo.location.split(",")[1]?.trim() || "FL",
        zipcode: "12345",
      },
      dob: formattedDob,
      gender: additionalInfo?.gender,
    };

    console.log("IBR Request Data:", {
      name: request.name,
      ssn: request.ssn.substring(0, 3) + "****", // Log partial SSN for security
      email: request.email,
      phone: request.phone,
      address: request.address,
      dob: request.dob,
    });

    const xml = buildRequestXML([request]);
    console.log("Generated XML:", xml);

    const response = await fetch("/api/ibr/submit", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: xml,
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit background check");
    }

    const result = await response.json();
    console.log("API Response:", result);

    if (result.success && result.data) {
      const results = parseXMLResponse(result.data);
      console.log("Parsed results:", results);

      if (results.length > 0 && results[0].ibrId) {
        return {
          success: true,
          ibrId: results[0].ibrId,
        };
      } else if (results.length > 0 && results[0].error) {
        return {
          success: false,
          error: results[0].error,
        };
      } else {
        console.error("No valid response from IBR");
        return {
          success: false,
          error: "No valid response from IBR API",
        };
      }
    } else {
      return {
        success: false,
        error: result.error || "Invalid response from server",
      };
    }
  } catch (error) {
    console.error("Error submitting background check:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit background check",
    };
  }
}

// Check background check status
export async function checkBackgroundStatus(
  ibrIds: string[]
): Promise<IBRStatusResponse[]> {
  try {
    console.log("[IBR API] Checking status for IBR IDs:", ibrIds);

    // Separate mock and real IDs
    const mockIds = ibrIds.filter((id) => id.startsWith("MOCK-"));
    const realIds = ibrIds.filter((id) => !id.startsWith("MOCK-"));

    const results: IBRStatusResponse[] = [];

    // Handle mock IDs
    if (mockIds.length > 0) {
      console.log("[IBR API] Processing mock IDs:", mockIds);
      const mockResults = mockIds.map((id) => ({
        id: id,
        status: "Review" as const,
        clientId: "TEST001",
      }));
      results.push(...mockResults);
    }

    // Handle real IDs
    if (realIds.length > 0) {
      console.log("[IBR API] Processing real IBR IDs:", realIds);
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_status1.dtd'>
<IBR>
    <REPORTSTATUS>${realIds.join(",")}</REPORTSTATUS>
</IBR>`;

      console.log("[IBR API] Sending XML request:", xml);
      const response = await fetch(API_ROUTES.status, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml",
        },
        body: xml,
      });

      console.log("[IBR API] Response status:", response.status);
      const responseText = await response.text();
      console.log("[IBR API] Response text:", responseText);
      const realResults = parseStatusXMLResponse(responseText);
      console.log("[IBR API] Parsed real results:", realResults);
      results.push(...realResults);
    }

    console.log("[IBR API] Combined results:", results);
    return results;
  } catch (error) {
    console.error("Error checking background status:", error);
    return [];
  }
}

// Get background check report PDF
export async function getBackgroundReport(ibrId: string): Promise<Blob | null> {
  try {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE IBR SYSTEM 'ibr_status1.dtd'>
<IBR>
    <REPORT>${ibrId}</REPORT>
</IBR>`;

    const response = await fetch(API_ROUTES.status, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: xml,
    });

    if (response.ok) {
      return await response.blob();
    }
    return null;
  } catch (error) {
    console.error("Error getting background report:", error);
    return null;
  }
}

// Attach release form to background check
export async function attachReleaseForm(
  ibrId: string,
  file: File
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("ID", ibrId);
    formData.append("attachment", file);

    const response = await fetch(API_ROUTES.attach, {
      method: "POST",
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error("Error attaching release form:", error);
    return false;
  }
}
