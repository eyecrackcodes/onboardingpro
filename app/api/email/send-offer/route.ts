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
      "📧 [FREE EMAIL MODE] SENDGRID_API_KEY not configured - logging email instead:"
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: Offer of Employment – Signature Required`);
    console.log(`BODY: Hi ${name},`);
    console.log(
      `Please review and sign your offer letter by clicking this link:`
    );
    console.log(`🔗 ${link}`);
    console.log(`Thank you!`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "💡 To enable real emails, add SENDGRID_API_KEY to your .env.local file"
    );

    return NextResponse.json({
      ok: true,
      mode: "console",
      message: "Email logged to console (free mode)",
    });
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    console.log("[Email API] Sending offer email to:", to);
    await sgMail.send({
      to,
      from: "anthony@luminarylife.com",
      subject: "Offer of Employment – Signature Required",
      html: `<p>Hi ${name},</p>
             <p>Please review and sign your offer letter by clicking the link below:</p>
             <p><a href="${link}">${link}</a></p>
             <p>Thank you!</p>`,
    });

    console.log("[Email API] Email sent successfully");
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
      console.log(`SUBJECT: Offer of Employment – Signature Required`);
      console.log(`BODY: Hi ${name},`);
      console.log(
        `Please review and sign your offer letter by clicking this link:`
      );
      console.log(`🔗 ${link}`);
      console.log(`Thank you!`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💡 SendGrid issue detected. Common fixes:");
      console.log("   • Verify sender email in SendGrid dashboard");
      console.log("   • Check API key permissions");
      console.log("   • Confirm billing/account status");

      return NextResponse.json({
        ok: true,
        mode: "console_fallback",
        message: "SendGrid failed - email logged to console instead",
        sendgrid_error: e.message,
      });
    }

    // For other errors, return error response
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
