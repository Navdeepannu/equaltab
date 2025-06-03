"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import React from "react";
import { BarLoader } from "react-spinners";
import ExpenseSummary from "./_components/ExpenseSummary";
import BalanceSummary from "./_components/BalanceSummary";
import GroupList from "./_components/GroupList";

type Member = {
  id: string;
  name: string;
  email?: string;
};

type Group = {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  members: Member[];
};

type BalanceDetail = {
  userId: Id<"users">;
  name: string;
  imageUrl?: string;
  amount: number;
};

type UserBalancesResult = {
  youOwe: number;
  youAreOwed: number;
  totalBalance: number;
  oweDetails: {
    youOwe: BalanceDetail[];
    youAreOwedBy: BalanceDetail[];
  };
};

type MonthlySpendingItem = {
  month: string;
  total: number;
};

const page = () => {
  const { data: balances, loading: balancesLoading } =
    useConvexQuery<UserBalancesResult>(api.dashboard.getUserBalances);

  const { data: groups, loading: groupLoading } = useConvexQuery<Group[]>(
    api.dashboard.getUserGroups
  );

  const { data: totalSpent, loading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );

  const { data: monthlySpent, loading: monthlySpentLoading } = useConvexQuery<
    MonthlySpendingItem[]
  >(api.dashboard.getMonthlySpending);

  const isLoading =
    balancesLoading || groupLoading || totalSpentLoading || monthlySpentLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isLoading ? (
        <div className="w-full py-12 justify-center flex">
          <BarLoader color="#36d7b7" width={"100%"} />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-teal font-extrabold text-5xl">DASHBOARD</h1>

            <Button
              variant="outline"
              className="hover:shadow-lg cursor-pointer"
            >
              <Link href="/expenses/new" className="flex items-center gap-2">
                <PlusCircle className="w-3 h-3" /> Add Expenses
              </Link>
            </Button>
          </div>

          {/* Balance Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  {!balances ? null : balances.totalBalance > 0 ? (
                    <span className="text-green-600 text-xl font-semibold">
                      +${balances?.totalBalance.toFixed(2)}
                    </span>
                  ) : balances?.totalBalance < 0 ? (
                    <span className="text-red-600 text-xl">
                      -${Math.abs(balances?.totalBalance).toFixed(2)}
                    </span>
                  ) : (
                    <span>$0.00</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {!balances
                    ? null
                    : balances?.totalBalance > 0
                      ? "You are owed money"
                      : balances?.totalBalance < 0
                        ? "You owe money"
                        : "All settle up!"}
                </p>
              </CardContent>
            </Card>

            {/* You are owed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  You are owed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${balances?.youAreOwed.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {balances?.oweDetails?.youAreOwedBy?.length || 0} people
                </p>
              </CardContent>
            </Card>

            {/* You Owe */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  You owe
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!balances ? null : balances?.oweDetails?.youOwe?.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-red-600">
                      ${balances?.youOwe.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      To {balances?.oweDetails?.youOwe?.length || 0} people
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">$0.00</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You don't owe anyone
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-3  gap-6 mt-5">
            {/* left column */}
            <div className="lg:col-span-2 space-y-6">
              <ExpenseSummary
                monthlySpending={monthlySpent ?? []}
                totalSpent={typeof totalSpent === "number" ? totalSpent : 0}
              />
            </div>
            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance Details</CardTitle>
                    <Button variant="link" className="p-6 text-teal" asChild>
                      <Link href="/contacts">
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BalanceSummary balances={balances} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Groups</CardTitle>
                    <Button variant="link" className="p-6 text-teal">
                      <Link href={"/contacts"}>View All</Link>
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <GroupList groups={groups ?? []} />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/contacts?createGroup=true`}>
                      <Users className="mr-2 h-4 w-4" />
                      Create new group
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
