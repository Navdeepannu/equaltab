"use client";
import { GroupExpenseData } from "@/app/types";
import ExpenseList from "@/components/ExpenseList";
import GroupBalances from "@/components/GroupBalances";
import GroupMembers, { Member } from "@/components/GroupMembers";
import SettlementList from "@/components/SettlementList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Balance } from "@/convex/groups";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { ArrowLeft, ArrowLeftRight, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { BarLoader } from "react-spinners";

function Page() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useStoreUserEffect();

  const [activeTab, setActiveTab] = useState("expenses");

  const { data, loading } = useConvexQuery<GroupExpenseData>(
    isAuthenticated ? api.groups.getGroupExpense : api.groups.emptyGroup,
    { groupId: params.id }
  );

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const group = data?.group;
  const members = data?.members || [];
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balances = data?.balances || [];
  const userLookupMap = data?.userLookupMap || {};

  const userId = params.id as Id<"users">;
  const otherUser = userLookupMap[userId];

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
            <div className="bg-primary/10 p-4 rounded-full">
              <Users className="text-teal h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl text-teal font-extrabold">
                {group?.name.toUpperCase()}
              </h1>
              <p className="text-muted-foreground"> {group?.description}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {members.length} members
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              variant={"outline"}
              className="bg-gray-50 shadow-primary hover:shadow-md duration-300 transition-all "
            >
              <Link href={`/settlements/group/${params.id}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Group Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupBalances balances={balances as Balance[]} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupMembers members={members as Member[]} />
            </CardContent>
          </Card>
        </div>
      </div>

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
            showOtherPerson={true}
            isGroupExpense={true}
            userLookupMap={userLookupMap}
            otherPersonId={otherUser?.id}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            isGroupSettlements={true}
            userLookupMap={userLookupMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Page;
