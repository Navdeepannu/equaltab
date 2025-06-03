"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import React from "react";
import ExpenseForm from "./components/ExpenseForm";

const page = () => {
  const router = useRouter();

  return (
    <div className="mt-24 mx-auto py-6 max-w-4xl container">
      <div className="mb-6">
        <h1 className="text-5xl text-teal font-bold">Add a new Expense</h1>
        <p>Record a new Expense to split with others</p>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="individual" className="pb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual Expense</TabsTrigger>
              <TabsTrigger value="group">Group Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="individual">
              <ExpenseForm type="individual" onSuccess={(id) => router.push(`/person/${id}`)} />
            </TabsContent>
            <TabsContent value="group">
              <ExpenseForm type="group" onSuccess={(id) => router.push(`/groups/${id}`)} />

            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
