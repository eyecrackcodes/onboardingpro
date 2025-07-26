import { NextRequest } from "next/server";
import crypto from "crypto";

/**
 * Verify Twilio webhook signature
 * This ensures requests are actually coming from Twilio
 */
export function verifyTwilioSignature(
  request: NextRequest,
  body: string | FormData,
  url: string
): boolean {
  // In development, skip verification
  if (process.env.NODE_ENV === "development") {
    console.log("🧪 Skipping Twilio signature verification in development");
    return true;
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("❌ TWILIO_AUTH_TOKEN not found");
    return false;
  }

  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) {
    console.error("❌ No Twilio signature found in headers");
    return false;
  }

  try {
    // Convert FormData to URL-encoded string if needed
    let bodyString = "";
    if (body instanceof FormData) {
      const params = new URLSearchParams();
      for (const [key, value] of body.entries()) {
        params.append(key, value.toString());
      }
      bodyString = params.toString();
    } else {
      bodyString = body || "";
    }

    // Create the signature
    const data = url + bodyString;
    const expectedSignature = crypto
      .createHmac("sha1", authToken)
      .update(data, "utf8")
      .digest("base64");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(twilioSignature),
      Buffer.from(`sha1=${expectedSignature}`)
    );

    if (!isValid) {
      console.error("❌ Twilio signature verification failed");
      console.log("Expected:", `sha1=${expectedSignature}`);
      console.log("Received:", twilioSignature);
    } else {
      console.log("✅ Twilio signature verified");
    }

    return isValid;
  } catch (error) {
    console.error("❌ Error verifying Twilio signature:", error);
    return false;
  }
}

/**
 * Middleware to handle Twilio webhook authentication
 */
export function withTwilioAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // For development, always allow
      if (process.env.NODE_ENV === "development") {
        return handler(request, ...args);
      }

      // Get the full URL
      const url = request.url;

      // Get the body for signature verification
      const body = await request.text();

      // Verify signature
      if (!verifyTwilioSignature(request, body, url)) {
        console.error("❌ Unauthorized Twilio webhook request");
        return new Response("Unauthorized", { status: 401 });
      }

      // Create a new request with the body for the handler
      const newRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: body,
      });

      return handler(newRequest, ...args);
    } catch (error) {
      console.error("❌ Error in Twilio auth middleware:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}

/**
 * Simple bypass for Twilio webhooks in development/testing
 * Returns true if we should skip authentication
 */
export function shouldSkipTwilioAuth(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.TWILIO_SKIP_AUTH === "true"
  );
}
