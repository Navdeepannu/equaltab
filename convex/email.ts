import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(args.apiKey);

    try {
      const result = await resend.emails.send({
        from: "EqualTab <onboarding@resend.dev>",
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });

      return { success: true, result };
    } catch (error: any) {
      console.error("Failed to send email: ", error);
      return { success: false, error: error.message };
    }
  },
});

export const sendContactInvitation = action({
  args: {
    toEmail: v.string(),
    toName: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?email=${encodeURIComponent(args.toEmail)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Join ${args.fromName} on EqualTab</h2>
        <p>Hi ${args.toName},</p>
        <p>${args.fromName} (${args.fromEmail}) has invited you to join EqualTab to split expenses together.</p>
        <p>EqualTab makes it easy to:</p>
        <ul>
          <li>Split expenses with friends and family</li>
          <li>Track who owes what</li>
          <li>Settle up easily</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${signupUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Join EqualTab
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you don't know ${args.fromName} or don't want to join, you can safely ignore this email.
        </p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
          This invitation was sent from EqualTab. If you have any questions, please contact us at support@equaltab.com
        </p>
      </div>
    `;

    const text = `
      Join ${args.fromName} on EqualTab

      Hi ${args.toName},

      ${args.fromName} (${args.fromEmail}) has invited you to join EqualTab to split expenses together.

      EqualTab makes it easy to:
      - Split expenses with friends and family
      - Track who owes what
      - Settle up easily

      Join now: ${signupUrl}

      If you don't know ${args.fromName} or don't want to join, you can safely ignore this email.

      ---
      This invitation was sent from EqualTab. If you have any questions, please contact us at support@equaltab.com
    `;

    try {
      const result = await resend.emails.send({
        from: "EqualTab <onboarding@resend.dev>",
        to: args.toEmail,
        subject: `${args.fromName} invited you to join EqualTab`,
        html,
        text,
      });

      return { success: true, result };
    } catch (error: any) {
      console.error("Failed to send contact invitation email: ", error);
      return { success: false, error: error.message };
    }
  },
});
