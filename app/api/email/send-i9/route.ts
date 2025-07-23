import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

export async function POST(req: Request) {
  const body = await req.json();
  const { to, name, link } = body;

  if (!to || !name || !link) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check if SendGrid API key is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log(
      "📧 [FREE EMAIL MODE] SENDGRID_API_KEY not configured - logging I9 email instead:"
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: I-9 Employment Eligibility Verification Required`);
    console.log(`BODY: Hi ${name},`);
    console.log(
      `Please complete your I-9 Employment Eligibility Verification form by clicking this secure link:`
    );
    console.log(`🔗 ${link}`);
    console.log(`This form is required before we can proceed with your employment offer.`);
    console.log(`Thank you!`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "💡 To enable real emails, add SENDGRID_API_KEY to your .env.local file"
    );

    return NextResponse.json({
      ok: true,
      mode: "console",
      message: "I9 email logged to console (free mode)",
    });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    console.log("[Email API] Sending I9 email to:", to);
    await sgMail.send({
      to,
      from: "anthony@luminarylife.com",
      subject: "I-9 Employment Eligibility Verification Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">I-9 Employment Eligibility Verification</h2>
          <p>Hi ${name},</p>
          <p>As part of your onboarding process, we need you to complete Form I-9, Employment Eligibility Verification.</p>
          <p>This form is required by federal law to verify your eligibility to work in the United States.</p>
          <p style="margin: 20px 0;">
            <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Complete I-9 Form
            </a>
          </p>
          <p><strong>What you'll need:</strong></p>
          <ul>
            <li>Your legal name and current address</li>
            <li>Social Security Number</li>
            <li>Identity and work authorization documents</li>
            <li>Emergency contact information</li>
          </ul>
          <p style="color: #666; font-size: 14px;">This form is secured with encryption. If you have any questions, please contact HR.</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      `,
    });

    console.log("[Email API] I9 email sent successfully");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Email API] SendGrid error:", e);

    // Check if it's a SendGrid authentication/permission error
    const isAuthError =
      e instanceof Error &&
      (e.message.includes("Forbidden") ||
        e.message.includes("Unauthorized") ||
        e.message.includes("401") ||
        e.message.includes("403"));

    if (isAuthError) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("⚠️  SENDGRID ERROR - Falling back to console mode:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: I-9 Employment Eligibility Verification Required`);
      console.log(`BODY: Hi ${name},`);
      console.log(
        `Please complete your I-9 Employment Eligibility Verification form by clicking this secure link:`
      );
      console.log(`🔗 ${link}`);
      console.log(`This form is required before we can proceed with your employment offer.`);
      console.log(`Thank you!`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💡 SendGrid issue detected. Common fixes:");
      console.log("   • Verify sender email in SendGrid dashboard");
      console.log("   • Check API key permissions");
      console.log("   • Confirm billing/account status");

      return NextResponse.json({
        ok: true,
        mode: "console_fallback",
        message: "SendGrid failed - I9 email logged to console instead",
        sendgrid_error: e.message,
      });
    }

    // For other errors, return error response
    return NextResponse.json({ error: "Failed to send I9 email" }, { status: 500 });
  }
} 