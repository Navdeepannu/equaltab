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
import React, { useState, useEffect } from "react";
import { BarLoader } from "react-spinners";
import { Expense } from "@/app/types";
import { useAuth } from "@clerk/nextjs";

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
  const router = useRouter();
  const params = useParams();
  const userId = params.id as Id<"users">;
  const { isLoaded: isAuthLoaded, isSignedIn: isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("expenses");

  // Always call hooks in the same order
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const { data: currentUser, loading: currentUserLoading } = useConvexQuery<Doc<"users"> | null>(
    api.users.getCurrentUser,
    undefined,
    { retry: true, retryDelay: 1000 }
  );

  const { data: expensesData, loading, error } = useConvexQuery<GetExpensesBetweenUsersResponse>(
    api.expenses.getExpensesBetweenUsers,
    currentUser?._id ? { userId } : "skip",
    { retry: true, retryDelay: 1000 }
  );

  useEffect(() => {
    if (!currentUserLoading) {
      setIsAuthChecked(true);
    }
  }, [currentUserLoading]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    
    // Only redirect to sign-in if we're sure the user is not authenticated
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    // If we have a current user and they're trying to view their own page
    if (currentUser && currentUser._id === userId) {
      router.push("/dashboard");
    }
  }, [isAuthLoaded, isAuthenticated, currentUser, userId, router]);

  // Show loading state while we're checking auth or loading user data
  if (!isAuthLoaded || !isAuthChecked || currentUserLoading || loading) {
    return (
      <div className="w-full py-12 justify-center flex">
        <BarLoader color="#36d7b7" width={"100%"} />
      </div>
    );
  }

  // Only redirect to sign-in if we're sure the user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state while we're waiting for current user
  if (!currentUser) {
    return (
      <div className="w-full py-12 justify-center flex">
        <BarLoader color="#36d7b7" width={"100%"} />
      </div>
    );
  }

  // Don't render if trying to view own page
  if (currentUser._id === userId) {
    return null;
  }

  if (!expensesData) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-red-500">
          <p>Error loading expenses data</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const otherUser = expensesData.otherUser;
  if (!otherUser || !otherUser.id) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-red-500">
          <p>User not found</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const expenses = (expensesData?.expenses || []).map((expense) => ({
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
  const settlements = expensesData?.settlements || [];
  const balance = expensesData?.balance || 0;

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

  if (!expensesData || (!expensesData.expenses.length && !expensesData.settlements.length)) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-muted-foreground">
          <p>No expenses found between you and this user.</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
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
              <Link href="/expenses/new">
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
