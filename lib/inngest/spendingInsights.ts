import { ConvexHttpClient } from "convex/browser";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const spendingInsights = inngest.createFunction(
  { name: "Generate Spending Insights", id: "generate-spending-insights" },
  { cron: "0 8 1 * *" },
  async ({ step }) => {
    const users = await step.run("Fetch users with expenses", async () => {
      return await convex.query(api.inngest.getUsersWithExpenses);
    });

    const results = [];

    for (const user of users) {
      const expenses = await step.run(`Expenses, ${user._id}`, async () => {
        return await convex.query(api.inngest.getUserMonthlyExpenses, {
          userId: user._id,
        });
      });

      if (!expenses || expenses.length === 0) continue;

      const expenseData = JSON.stringify({
        expenses,
        totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
        categories: expenses.reduce(
          (cats, e) => {
            cats[e.category ?? "uncategorised"] =
              (cats[e.category ?? "uncategorised"] ?? 0) + e.amount;
            return cats;
          },
          {} as Record<string, number>
        ),
      });
      const prompt =
        `As a financial analyst, review this user's spending data for the past month and provide insightful observations and suggestions. Focus on spending patterns, category breakdowns, and actionable advice for better financial management. Use a friendly, encouraging tone. Format your response in HTML for an email.
                        User spending data: ${expenseData}
                        Provide your analysis in these sections:
                        1. Monthly Overview
                        2. Top Spending Categories
                        3. Unusual Spending Patterns (if any)
                        4. Saving Opportunities
                        5. Recommendations for Next Month`.trim();

      try {
        const aiResponse = await step.ai.wrap(
          "gemini",
          async (p) => model.generateContent(p),
          prompt
        );

        const candidate = aiResponse.response?.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        const htmlBody = part && "text" in part ? part.text : "";

        await step.run(`Email: ${user._id}`, () => {
          convex.action(api.email.sendEmail, {
            to: user.email,
            subject: "Your Monthly Spending Insights",
            html: ` <h1>Your Monthly Financial Insights</h1>
                <p>Hi ${user.name},</p>
                <p>Here's your personalized spending analysis for the past month: </p> ${htmlBody}`,
            apiKey: process.env.NEXT_RESEND_API_KEY!,
          });
        });
        results.push({ userId: user._id, success: true });
      } catch (error: any) {
        results.push({
          userId: user._id,
          success: false,
          erroor: error.message,
        });
      }
    }

    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
);
