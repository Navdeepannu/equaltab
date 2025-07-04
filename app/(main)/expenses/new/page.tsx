"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import ExpenseForm from "./components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { BarLoader } from "react-spinners";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";

export default function NewExpensePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"individual" | "group">(
    "individual"
  );
  const { isLoading } = useGlobalLoading();
  const { isAuthenticated } = useStoreUserEffect();

  const handleSuccess = (id: Id<"users"> | Id<"groups">) => {
    console.log("NewExpensePage - handleSuccess:", {
      id,
      idString: id.toString(),
      isGroupId: id.toString().startsWith("groups"),
      isUserId: id.toString().startsWith("users"),
      activeTab
    });

    // Show success toast with expense details and navigation links
    toast.success(
      <div className="flex flex-col gap-2">
        <p className="font-semibold">Expense Created Successfully! 🎉</p>
        <div className="flex flex-col gap-1 text-sm">
          <p>
            You can continue adding more expenses or go back to your dashboard.
          </p>
          <div className="flex gap-2 mt-1">
            <Link href="/dashboard">Go to Dashboard</Link>
            {activeTab === "individual" ? (
              <Link href={`/person/${id}`}>View Person Details</Link>
            ) : (
              <Link href={`/groups/${id}`}>View Group Details</Link>
            )}
          </div>
        </div>
      </div>,
      {
        duration: 6000,
        position: "top-right",
      }
    );

    // Navigate based on the active tab, not the ID type
    if (activeTab === "individual") {
      router.push(`/person/${id}`);
    } else {
      router.push(`/groups/${id}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        Please sign in to add expenses
      </div>
    );
  }

  return (
    <div className="mt-24 mx-auto py-6 max-w-4xl container">
      <div className="mb-6">
        <Button
          variant={"outline"}
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-5xl text-teal font-bold">Add a new Expense</h1>
        <p>Record a new Expense to split with others</p>
      </div>

      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}

      <Card>
        <CardContent>
          <Tabs
            defaultValue="individual"
            className="pb-3"
            onValueChange={(value) =>
              setActiveTab(value as "individual" | "group")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Expense</TabsTrigger>
              <TabsTrigger value="group">Group Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="individual">
              <ExpenseForm type="individual" onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="group">
              <ExpenseForm type="group" onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
