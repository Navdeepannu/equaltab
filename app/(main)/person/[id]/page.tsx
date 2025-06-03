"use client";
import ExpenseList from "@/components/ExpenseList";
import SettlementList from "@/components/SettlementList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowLeftRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { BarLoader } from "react-spinners";
import { Expense } from "@/app/types";

export type GetExpensesBetweenUsersResponse = {
  expenses: Doc<"expenses">[];
  settlements: Doc<"settlements">[];
  balance: number;
  otherUser: {
    id: Id<"users">;
    name: string;
    email: string;
    imageUrl?: string;
  };
};

const page = () => {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useStoreUserEffect();

  const [activeTab, setActiveTab] = useState("expenses");

  const { data: currentUser } = useConvexQuery<Doc<"users"> | null>(
    api.users.getCurrentUser
  );
  const { data, loading } = useConvexQuery<GetExpensesBetweenUsersResponse>(
    isAuthenticated
      ? api.expenses.getExpensesBetweenUsers
      : api.expenses.emptyExpenses,
    { userId: params.id as Id<"users"> }
  );

  if (loading || !currentUser) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const otherUser = data?.otherUser;
  const expenses = (data?.expenses || []).map((expense) => ({
    _id: expense._id,
    _creationTime: expense._creationTime,
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
    paidByUserId: expense.paidByUserId,
    splitType: expense.splitType,
    splits: expense.splits,
    groupId: expense.groupId,
    createdBy: expense.createdBy,
  })) as Expense[];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  if (!otherUser) return null;

  // Create a complete userLookupMap with both users
  const userLookupMap: Record<
    Id<"users">,
    {
      id: Id<"users">;
      name: string;
      imageUrl?: string;
    }
  > = {
    [currentUser._id]: {
      id: currentUser._id,
      name: currentUser.name,
      imageUrl: currentUser.imageUrl,
    },
    [otherUser.id]: {
      id: otherUser.id,
      name: otherUser.name,
      imageUrl: otherUser.imageUrl,
    },
  };

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

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.imageUrl} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl text-teal font-extrabold">
                {otherUser?.name.toUpperCase()}
              </h1>
              <p className="text-muted-foreground"> {otherUser?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              variant={"outline"}
              className="bg-gray-50 shadow-primary hover:shadow-md duration-300 transition-all "
            >
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight className="mr-1 h-4 w-4" />
                Settle up
              </Link>
            </Button>
            <Button
              asChild
              className="text-black bg-primary shadow-primary hover:shadow-md duration-300 transition-all"
            >
              <Link href={`expenses/new`}>
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Expense
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <div>
              {balance === 0 ? (
                <p>You are all settled up</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-medium">{otherUser?.name}</span> owes
                  you
                </p>
              ) : (
                <p>
                  You owe <span className="font-medium">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
            >
              ${Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id ?? ""}
            userLookupMap={userLookupMap}
            isGroupExpense={false}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={userLookupMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
