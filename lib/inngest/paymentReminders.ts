import { ConvexHttpClient } from "convex/browser";
import { inngest } from "./client";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const paymentReminders = inngest.createFunction(
  { id: "send-payment-reminders" },
  { cron: "0 10  * * *" },
  async ({ step }) => {
    const users = await step.run("fetch-depts", () =>
      convex.query(api.inngest.getUsersWithOutstandingDebts)
    );

    const result = await step.run("send-emails", async () => {
      return Promise.all(
        users.map(async (u) => {
          const rows = u.debts
            .map(
              (d) => `<tr>
             <td style="padding:4px 8px;">${d.name}</td>
             <td style="padding:4px 8px;">${d.amount.toFixed(2)}</td>
          </tr>`
            )
            .join("");

          if (!rows) return { userId: u._id, success: false, skipped: true };

          const html = `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                  <h2 style="color: #4A90E2; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                    EqualTab - Payment Reminder
                  </h2>
                  
                  <p style="font-size: 16px; line-height: 1.5;">
                    Hi ${u.name},<br><br>
                    You have the following outstanding balances:
                  </p>

                  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                      <tr style="background-color: #f4f4f4;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">To</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${u.debts
                        .map(
                          (d, idx) => `
                        <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#fafafa"};">
                          <td style="padding: 10px; border-bottom: 1px solid #eee;">${d.name}</td>
                          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${d.amount.toFixed(2)}</td>
                        </tr>`
                        )
                        .join("")}
                    </tbody>
                  </table>

                  <p style="font-size: 16px; line-height: 1.5;">
                    Please settle up soon. Thanks for using EqualTab!
                  </p>

                  <p style="font-size: 14px; color: #999; margin-top: 40px;">
                    — The EqualTab Team
                  </p>
                </div>`;

          try {
            await convex.action(api.email.sendEmail, {
              to: u.email,
              subject: "You have pending payments on EqualTab",
              html,
              apiKey: process.env.NEXT_RESEND_API_KEY!,
            });
            return { userId: u._id, success: true };
          } catch (error: any) {
            return { userId: u._id, success: false, error: error.message };
          }
        })
      );
    });
    return {
      processed: result.length,
      successes: result.filter((r) => r.success).length,
      failures: result.filter((r) => r.success === false).length,
    };
  }
);
