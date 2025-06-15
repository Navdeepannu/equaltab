"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { getCategoryById, getCategoryIcon } from "@/lib/expenseCategory";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ExpenseListProps, Expense, Split } from "@/app/types";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { useRouter } from "next/navigation";

// Types
type User = {
  _id: Id<"users">;
  name: string;
  imageUrl?: string;
};

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  showOtherPerson = true,
  otherPersonId = null,
  isGroupExpense = false,
  userLookupMap = {},
}) => {
  const router = useRouter();
  const { isAuthenticated } = useStoreUserEffect();

  const { data: currentUser } = useConvexQuery<User | null>(
    isAuthenticated ? api.users.getCurrentUser : api.users.emptyUser
  );
  const deleteExpense = useConvexMutation(api.groups.deleteExpense);

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No expenses found
        </CardContent>
      </Card>
    );
  }

  const canDeleteExpense = (expense: Expense) => {
    if (!currentUser) return false;
    return (
      expense.createdBy === currentUser._id ||
      expense.paidByUserId === currentUser._id
    );
  };

  const getUserDetails = (userId: Id<"users">) => {
    return {
      name:
        userId === currentUser?._id
          ? "You"
          : userLookupMap[userId]?.name || "Other user",
      imageUrl: userLookupMap[userId]?.imageUrl || "",
      id: userId,
    };
  };

  const handleDeleteExpense = async (expense: Expense) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteExpense.mutate({ expenseId: expense._id });
      toast.success("Expense deleted Successfully.");
    } catch (error: any) {
      toast.error("failed to delete expense : " + error.message);
    }
  };

  const handleExpenseClick = (expense: Expense) => {
    if (isGroupExpense) return; // Don't navigate for group expenses
    
    // For individual expenses, find the other person's ID
    const otherPersonSplit = expense.splits.find(split => split.userId !== currentUser?._id);
    if (otherPersonSplit) {
      // The userId from splits is already a proper Id<"users"> type, so it should have the "users_" prefix
      // Just verify it's a valid user ID before navigating
      if (otherPersonSplit.userId.toString().startsWith("users_")) {
        router.push(`/person/${otherPersonSplit.userId}`);
      } else {
        console.error("Invalid user ID format:", otherPersonSplit.userId);
        toast.error("Could not navigate to user page");
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense) => {
        const payer = getUserDetails(expense.paidByUserId);
        const isCurrentUserPayer = expense.paidByUserId === currentUser?._id;
        const category = getCategoryById(expense.category || "other");
        const CategoryIcon = getCategoryIcon(category.id);
        const showDeleteOption = canDeleteExpense(expense);

        return (
          <Card 
            key={expense._id} 
            className={`${!isGroupExpense ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
            onClick={() => !isGroupExpense && handleExpenseClick(expense)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary rounded-full p-2">
                    <CategoryIcon className="h-5 w-5 text-teal-900" />
                  </div>
                  <div>
                    <h3 className="font-medium">{expense.description}</h3>

                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </span>
                      {showOtherPerson && (
                        <>
                          <span>.</span>
                          <span>
                            {isCurrentUserPayer ? "You" : payer.name} paid
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium">
                      ${expense.amount.toFixed(2)}
                    </div>

                    {isGroupExpense ? (
                      <Badge variant="outline" className="mt-1">
                        Group Expense
                      </Badge>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {isCurrentUserPayer ? (
                          <span className="text-green-600">You Paid</span>
                        ) : (
                          <span className="text-red-600">
                            {payer.name} paid
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {showDeleteOption && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExpense(expense);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete expense</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm flex gap-2 flex-wrap">
                {expense.splits.map((split: Split, idx: number) => {
                  const splitUser = getUserDetails(split.userId);
                  const isCurrentUser = split.userId === currentUser?._id;

                  return (
                    <Badge
                      key={idx}
                      variant={split.paid ? "outline" : "default"}
                      className={`flex items-center gap-1 ${split.paid ? "" : "bg-neutral-300 text-black"}`}
                    >
                      <Avatar>
                        <AvatarImage src={splitUser.imageUrl} />
                        <AvatarFallback>
                          {splitUser.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {isCurrentUser ? "You" : splitUser.name} : $
                        {split.amount.toFixed(2)}
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExpenseList;
