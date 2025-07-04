"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { getAllCategories } from "@/lib/expenseCategory";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CategorySelector from "./CategorySelector";
import GroupSelector from "./GroupSelector";
import ContactSelector from "@/app/components/ContactSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SplitSelector from "./SplitSelector";
import { GetGroupOrMembersResult, Participant } from "@/app/types";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import Link from "next/link";

type Split = {
  userId: string;
  amount: number;
  percentage: number;
};

type ExpenseFormType = "individual" | "group";

interface ExpenseFormProps {
  type: ExpenseFormType;
  onSuccess: (id: Id<"users"> | Id<"groups">) => void;
}

export type ExpenseFormData = z.infer<typeof expenseSchema>;

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
});

const ExpenseForm: React.FC<ExpenseFormProps> = ({ type, onSuccess }) => {
  const { isAuthenticated } = useStoreUserEffect();
  const { data: currentUser, loading: isLoading } = useConvexQuery<
    Doc<"users">
  >(isAuthenticated ? api.users.getCurrentUser : api.users.emptyUser);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      paidByUserId: "",
      splitType: "equal",
      groupId: undefined,
    },
  });

  // Initialize participants with current user for individual expenses
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Update participants and form values when currentUser changes
  React.useEffect(() => {
    if (type === "individual" && currentUser?._id) {
      const currentUserParticipant: Participant = {
        id: currentUser._id,
        name: currentUser.name || "You",
        email: currentUser.email || "",
        imageUrl: currentUser.imageUrl,
        tokenIdentifier: currentUser.tokenIdentifier,
      };
      setParticipants([currentUserParticipant]);
      // Set the paidByUserId to current user's ID when they are added
      setValue("paidByUserId", currentUser._id);
    }
  }, [currentUser, type, setValue]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedGroup, setSelectedGroup] = useState<
    GetGroupOrMembersResult["selectedGroup"] | null
  >(null);
  const [splits, setSplits] = useState<Split[]>([]);

  const createExpense = useConvexMutation(api.expenses.createExpense);
  const categories = getAllCategories();

  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");

  // Add a mutation to fetch user data
  const { mutate: getUserData } = useConvexMutation(api.users.getUserById);

  // Add logging for paid by changes
  React.useEffect(() => {
    console.log("ExpenseForm - Paid By Selection Changed:", {
      paidByUserId,
      currentUserId: currentUser?._id,
      participants: participants.map(p => ({ 
        id: p.id, 
        name: p.name,
        isCurrentUser: p.id === currentUser?._id 
      })),
      isCurrentUserPaying: paidByUserId === currentUser?._id,
      timestamp: new Date().toISOString()
    });
  }, [paidByUserId, currentUser, participants]);

  // Add logging for participant changes
  React.useEffect(() => {
    console.log("ExpenseForm - Participants Updated:", {
      participants: participants.map(p => ({ 
        id: p.id, 
        name: p.name,
        isCurrentUser: p.id === currentUser?._id 
      })),
      currentUserId: currentUser?._id,
      currentPaidBy: paidByUserId,
      timestamp: new Date().toISOString()
    });
  }, [participants, currentUser, paidByUserId]);

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        Please sign in to add expenses
      </div>
    );
  }

  if (isLoading || !currentUser) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        <BarLoader className="" />
      </div>
    );
  }

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      if (!currentUser?._id) {
        toast.error("Please sign in to create an expense");
        return;
      }

      if (!data.paidByUserId) {
        toast.error("Please select who paid for this expense");
        return;
      }

      const amount = parseFloat(data.amount);

      // Validate all user IDs before proceeding
      const validateUserId = (id: string) => {
        if (!id || typeof id !== "string") {
          console.error("Invalid user ID:", id);
          return false;
        }
        return true;
      };

      // Validate paidByUserId
      if (!validateUserId(data.paidByUserId)) {
        toast.error("Invalid payer selected");
        return;
      }

      // Ensure each split has a valid userId
      const formattedSplits = splits
        .filter((split): split is NonNullable<typeof split> => {
          if (!split) {
            console.error("Undefined split found");
            return false;
          }
          if (!split.userId || !validateUserId(split.userId)) {
            console.error("Split missing valid userId:", split);
            return false;
          }
          return true;
        })
        .map((split) => ({
          userId: split.userId as Id<"users">,
          amount: split.amount,
          paid: split.userId === data.paidByUserId,
        }));

      const totalSplitsAmount = formattedSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );

      const tolerance = 0.01;

      if (Math.abs(totalSplitsAmount - amount) > tolerance) {
        toast.error(
          `Split amounts don't add up to the total. Please adjust your splits.`
        );
        return;
      }

      // Store the IDs we want to use for redirection BEFORE the mutation
      // For individual expenses, find the non-current user
      // For group expenses, we'll use the group ID
      const otherParticipant = type === "individual" 
        ? participants.find(p => p.id !== currentUser?._id)
        : null;
      
      console.log("ExpenseForm - Detailed Participant Debug:", {
        allParticipants: participants.map(p => ({ id: p.id, name: p.name })),
        currentUserId: currentUser?._id,
        paidByUserId: data.paidByUserId,
        otherParticipant: otherParticipant ? { id: otherParticipant.id, name: otherParticipant.name } : null,
        type,
        isIndividual: type === "individual",
        isGroup: type === "group",
        isCurrentUserPaying: data.paidByUserId === currentUser?._id,
        groupId: data.groupId
      });

      // For individual expenses, we need another participant
      if (type === "individual" && !otherParticipant?.id) {
        console.error("Could not find other participant for individual expense:", { 
          participants: participants.map(p => ({ id: p.id, name: p.name })), 
          paidByUserId: data.paidByUserId,
          currentUserId: currentUser?._id
        });
        toast.error("Error: Could not determine where to redirect");
        return;
      }

      // For group expenses, we need a group ID
      if (type === "group" && !data.groupId) {
        console.error("No group ID provided for group expense");
        toast.error("Error: No group selected");
        return;
      }

      // Determine the redirect ID based on expense type
      const redirectId = type === "individual"
        ? otherParticipant!.id as Id<"users">  
        : data.groupId as Id<"groups">;        

      console.log("ExpenseForm - Navigation Debug:", {
        type,
        paidByUserId: data.paidByUserId,
        currentUserId: currentUser?._id,
        otherParticipant,
        redirectId,
        groupId: data.groupId,
        participants: participants.map(p => ({ id: p.id, name: p.name }))
      });

      // Create the expense
      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "Other",
        date: data.date.getTime(),
        paidByUserId: data.paidByUserId as Id<"users">,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId: type === "individual" ? undefined : data.groupId as Id<"groups">,
      });

      // Show success toast with expense details
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Expense Created Successfully! 🎉</p>
          <p className="text-sm text-muted-foreground">
            {data.description} - ${amount.toFixed(2)}
          </p>
        </div>,
        {
          duration: 6000,
          position: "top-right",
        }
      );

      reset();

      // Use the determined redirect ID
      const finalRedirectId = redirectId;

      console.log("ExpenseForm - Final Redirect ID:", {
        finalRedirectId,
        type,
        isIndividual: type === "individual",
        isGroup: type === "group",
        otherParticipantId: otherParticipant?.id,
        currentUserId: currentUser?._id,
        paidByUserId: data.paidByUserId,
        isCurrentUserPaying: data.paidByUserId === currentUser?._id,
        groupId: data.groupId
      });

      if (!finalRedirectId) {
        console.error("No valid ID for redirection");
        toast.error("Error: Could not determine where to redirect");
        return;
      }

      // Call onSuccess with the appropriate ID
      onSuccess(finalRedirectId);
    } catch (error: unknown) {
      console.error("Error creating expense:", error);
      toast.error(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Failed to create expense</p>
          <div className="flex flex-col gap-1 text-sm">
            <p>{error instanceof Error ? error.message : String(error)}</p>
            <Link href="/dashboard" className="mt-1">
              Return to Dashboard
            </Link>
          </div>
        </div>,
        {
          duration: 6000,
          position: "top-right",
        }
      );
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Lunch, movie tickets, etc."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              inputMode="decimal"
              type="text"
              step="0.05"
              min="0.01"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid-cols-1 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              categories={categories || []}
              onChange={(categoryId) => {
                if (categoryId) {
                  setValue("category", categoryId);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(data) => {
                    if (data) {
                      setSelectedDate(data);
                      setValue("date", data);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {type === "group" && (
          <div className="space-y-2">
            <Label>Group</Label>
            <GroupSelector
              onChange={async (group) => {
                if (!group) return;

                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);

                  if (group.members && Array.isArray(group.members)) {
                    // Get the full user data for each member
                    const memberPromises = group.members.map(async (member) => {
                      try {
                        // Use the current user's data if it's the current user
                        if (currentUser?._id === member.id) {
                          return {
                            id: currentUser._id,
                            name: currentUser.name || "You",
                            email: currentUser.email || "",
                            imageUrl: currentUser.imageUrl,
                            tokenIdentifier: currentUser.tokenIdentifier,
                          } as Participant;
                        }

                        // For other members, fetch their data
                        const userData = await getUserData({
                          userId: member.id,
                        });
                        if (!userData) {
                          console.error("User not found:", member.id);
                          return null;
                        }

                        return {
                          id: userData._id,
                          name: userData.name || "Unknown User",
                          email: userData.email || "",
                          imageUrl: userData.imageUrl,
                          tokenIdentifier: userData.tokenIdentifier,
                        } as Participant;
                      } catch (error) {
                        console.error("Error fetching user data:", error);
                        return null;
                      }
                    });

                    try {
                      const members = await Promise.all(memberPromises);
                      const validMembers = members.filter(
                        (m): m is Participant => m !== null
                      );
                      setParticipants(validMembers);
                    } catch (error) {
                      console.error("Error setting group members:", error);
                    }
                  }
                }
              }}
            />

            {!selectedGroup && (
              <p className="text-sm text-amber-600">
                Please select a group to continue.
              </p>
            )}
          </div>
        )}

        {type === "individual" && (
          <div className="space-y-2">
            <Label>Participants</Label>
            <ContactSelector
              participants={participants}
              onParticipantsChange={(newParticipants) => {
                setParticipants(newParticipants);
              }}
              showCurrentUser={true}
              allowNewContacts={true}
              placeholder="Add Participant"
            />

            {participants.length <= 1 && (
              <p className="text-sm text-amber-600">
                Please add at least one other participant
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="paidByUserId">Paid by</Label>
          <select
            {...register("paidByUserId", {
              onChange: (e) => {
                console.log("ExpenseForm - Paid By Direct Change:", {
                  newValue: e.target.value,
                  currentUserId: currentUser?._id,
                  isCurrentUser: e.target.value === currentUser?._id,
                  timestamp: new Date().toISOString()
                });
              }
            })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={currentUser?._id || ""}
            required
          >
            <option value="" disabled>
              Select who paid
            </option>
            {participants.map((participant) => (
              <option
                key={`paid-by-${participant.id}`}
                value={participant.id}
                disabled={!participant.id}
              >
                {participant.id === currentUser?._id ? "You" : participant.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-red-500 text-sm">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="splitType">Split type</Label>
          <Tabs
            defaultValue="equal"
            onValueChange={(value) =>
              setValue("splitType", value as "equal" | "percentage" | "exact")
            }
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equal">Equal</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
              <TabsTrigger value="exact">Exact Amount</TabsTrigger>
            </TabsList>
            <TabsContent value="equal" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split equally among all participants
              </p>
              <SplitSelector
                type="equal"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitChange={setSplits}
              />
            </TabsContent>
            <TabsContent value="percentage" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Split by percentage
              </p>
              <SplitSelector
                type="percentage"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitChange={setSplits}
              />
            </TabsContent>
            <TabsContent className="pt-4" value="exact">
              <p className="text-sm text-muted-foreground">
                Enter exact amounts
              </p>
              <SplitSelector
                type="exact"
                amount={parseFloat(amountValue) || 0}
                participants={participants}
                paidByUserId={paidByUserId}
                onSplitChange={setSplits}
              />
            </TabsContent>
          </Tabs>
          {errors.paidByUserId && (
            <p className="text-red-500 text-sm">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || participants.length <= 1}
        variant="destructive"
      >
        {isSubmitting ? "creating" : "Create Expense"}
      </Button>
    </form>
  );
};

export default ExpenseForm;
