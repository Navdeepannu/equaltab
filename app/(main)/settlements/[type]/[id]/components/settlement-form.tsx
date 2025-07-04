"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { GetSettlementDataResponse, UserSettlementData, GroupSettlementData, GroupMemberBalance } from "@/app/types";

// Form schema validation
const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"]),
});

type SettlementFormData = z.infer<typeof settlementSchema>;

interface SettlementFormProps {
  entityType: "user" | "group";
  entityData: GetSettlementDataResponse;
  onSuccess?: () => void;
}

export default function SettlementForm({ entityType, entityData, onSuccess }: SettlementFormProps) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const createSettlement = useMutation(api.settlements.createSettlements);

  // Set up form with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid",
    },
  });


  // Single user settlement
  const handleUserSettlement = async (data: SettlementFormData) => {
    if (!currentUser?._id) {
      toast.error("Please sign in to create a settlement");
      return;
    }

    const amount = parseFloat(data.amount);
    const userData = entityData as UserSettlementData;

    try {
      // Determine payer and receiver based on the selected payment type
      const paidByUserId =
        data.paymentType === "youPaid"
          ? currentUser._id
          : userData.counterpart.userId;

      const receivedByUserId =
        data.paymentType === "youPaid"
          ? userData.counterpart.userId
          : currentUser._id;

      await createSettlement({
        amount,
        note: data.note,
        paidByUserId,
        recievedByUserId: receivedByUserId,
      });

      toast.success("Settlement recorded successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to record settlement: " + errorMessage);
    }
  };

  // Group settlement
  const handleGroupSettlement = async (data: SettlementFormData, selectedUserId: Id<"users">) => {
    if (!currentUser?._id) {
      toast.error("Please sign in to create a settlement");
      return;
    }

    if (!selectedUserId) {
      toast.error("Please select a group member to settle with");
      return;
    }

    const amount = parseFloat(data.amount);
    const groupData = entityData as GroupSettlementData;

    try {
      // Get the selected user from the group balances
      const selectedUser = groupData.balances.find(
        (balance) => balance.userId === selectedUserId
      );

      if (!selectedUser) {
        toast.error("Selected user not found in group");
        return;
      }

      // Determine payer and receiver based on the selected payment type and balances
      const paidByUserId =
        data.paymentType === "youPaid" ? currentUser._id : selectedUser.userId;

      const receivedByUserId =
        data.paymentType === "youPaid" ? selectedUser.userId : currentUser._id;

      await createSettlement({
        amount,
        note: data.note,
        paidByUserId,
        recievedByUserId: receivedByUserId,
        groupId: groupData.group.id,
      });

      toast.success("Settlement recorded successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to record settlement: " + errorMessage);
    }
  };

  // Handle form submission
  const onSubmit = async (data: SettlementFormData) => {
    if (entityType === "user") {
      await handleUserSettlement(data);
    } else if (entityType === "group" && selectedGroupMemberId) {
      await handleGroupSettlement(data, selectedGroupMemberId);
    }
  };

  // For group settlements, we need to select a member
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState<Id<"users"> | null>(null);

  if (!currentUser) return null;

  // Render the form for individual settlement
  if (entityType === "user") {
    const userData = entityData as UserSettlementData;
    const otherUser = userData.counterpart;
    const netBalance = userData.netBalance;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Balance information */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Current balance</h3>
          {netBalance === 0 ? (
            <p>You are all settled up with {otherUser.name}</p>
          ) : netBalance > 0 ? (
            <div className="flex justify-between items-center">
              <p>
                <span className="font-medium">{otherUser.name}</span> owes you
              </p>
              <span className="text-xl font-bold text-green-600">
                ${netBalance.toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p>
                You owe <span className="font-medium">{otherUser.name}</span>
              </p>
              <span className="text-xl font-bold text-red-600">
                ${Math.abs(netBalance).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Payment direction */}
        <div className="space-y-2">
          <Label>Who paid?</Label>
          <RadioGroup
            defaultValue="youPaid"
            {...register("paymentType")}
            className="flex flex-col space-y-2"
            onValueChange={(value) => {
              // This manual approach is needed because RadioGroup doesn't work directly with react-hook-form
              register("paymentType").onChange({
                target: { name: "paymentType", value },
              });
            }}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="youPaid" id="youPaid" />
              <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={currentUser.imageUrl} />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>You paid {otherUser.name}</span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="theyPaid" id="theyPaid" />
              <Label htmlFor="theyPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={otherUser.imageUrl} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{otherUser.name} paid you</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5">$</span>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              className="pl-7"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Dinner, rent, etc."
            {...register("note")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  // Render form for group settlement
  if (entityType === "group") {
    const groupData = entityData as GroupSettlementData;
    const groupMembers = groupData.balances;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Select group member */}
        <div className="space-y-2">
          <Label>Who are you settling with?</Label>
          <div className="space-y-2">
            {groupMembers.map((member: GroupMemberBalance) => {
              const isSelected = selectedGroupMemberId === member.userId;
              const isOwed = member.netBalance > 0; // positive means they owe you
              const isOwing = member.netBalance < 0; // negative means you owe them

              return (
                <div
                  key={member.userId}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedGroupMemberId(member.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div
                      className={`font-medium ${
                        isOwed
                          ? "text-green-600"
                          : isOwing
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {isOwed
                        ? `They owe you $${Math.abs(member.netBalance).toFixed(2)}`
                        : isOwing
                          ? `You owe $${Math.abs(member.netBalance).toFixed(2)}`
                          : "Settled up"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedGroupMemberId && (
            <p className="text-sm text-amber-600">
              Please select a member to settle with
            </p>
          )}
        </div>

        {selectedGroupMemberId && (
          <>
            {/* Payment direction */}
            <div className="space-y-2">
              <Label>Who paid?</Label>
              <RadioGroup
                defaultValue="youPaid"
                {...register("paymentType")}
                className="flex flex-col space-y-2"
                onValueChange={(value) => {
                  register("paymentType").onChange({
                    target: { name: "paymentType", value },
                  });
                }}
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="youPaid" id="youPaid" />
                  <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={currentUser.imageUrl} />
                        <AvatarFallback>
                          {currentUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        You paid{" "}
                        {
                          groupMembers.find(
                            (m: GroupMemberBalance) => m.userId === selectedGroupMemberId
                          )?.name
                        }
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="theyPaid" id="theyPaid" />
                  <Label
                    htmlFor="theyPaid"
                    className="flex-grow cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage
                          src={
                            groupMembers.find(
                              (m: GroupMemberBalance) => m.userId === selectedGroupMemberId
                            )?.imageUrl
                          }
                        />
                        <AvatarFallback>
                          {groupMembers
                            .find((m: GroupMemberBalance) => m.userId === selectedGroupMemberId)
                            ?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {
                          groupMembers.find(
                            (m: GroupMemberBalance) => m.userId === selectedGroupMemberId
                          )?.name
                        }{" "}
                        paid you
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Dinner, rent, etc."
                {...register("note")}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedGroupMemberId}
        >
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  return null;
}