import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { paymentReminders } from "@/lib/inngest/paymentReminders";
import { spendingInsights } from "@/lib/inngest/spendingInsights";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [paymentReminders, spendingInsights],
});
