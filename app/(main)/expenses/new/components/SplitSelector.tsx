"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/clerk-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

// --- Types ---
type SplitType = "equal" | "percentage" | "exact";

interface Participant {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
}

interface Split {
  userId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  amount: number;
  percentage: number;
  paid: boolean;
}

interface SplitSelectorProps {
  type: SplitType;
  amount: number;
  participants: Participant[];
  paidByUserId: string;
  onSplitChange: (splits: Split[]) => void;
}

// --- Component ---
const SplitSelector: React.FC<SplitSelectorProps> = ({
  type,
  amount,
  participants,
  paidByUserId,
  onSplitChange,
}) => {
  const { user } = useUser();
  const [splits, setSplits] = useState<Split[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Auto calculate split when props change
  useEffect(() => {
    if (!amount || amount < 0 || participants.length === 0) {
      console.log("Invalid props for split calculation:", { amount, participants });
      return;
    }

    // Log the participants we're working with
    console.log("Creating splits for participants:", participants);

    let newSplits: Split[] = [];

    if (type === "equal") {
      const shareAmount = amount / participants.length;
      newSplits = participants.map((p) => {
        if (!p.id) {
          console.error("Participant missing ID:", p);
          throw new Error("Invalid participant: missing ID");
        }
        return {
          userId: p.id,
          name: p.name,
          email: p.email,
          imageUrl: p.imageUrl,
          amount: shareAmount,
          percentage: 100 / participants.length,
          paid: p.id === paidByUserId,
        };
      });
    } else if (type === "percentage") {
      const evenPercentage = 100 / participants.length;
      newSplits = participants.map((p) => {
        if (!p.id) {
          console.error("Participant missing ID:", p);
          throw new Error("Invalid participant: missing ID");
        }
        return {
          userId: p.id,
          name: p.name,
          email: p.email,
          imageUrl: p.imageUrl,
          amount: (amount * evenPercentage) / 100,
          percentage: evenPercentage,
          paid: p.id === paidByUserId,
        };
      });
    } else if (type === "exact") {
      const evenAmount = amount / participants.length;
      newSplits = participants.map((p) => {
        if (!p.id) {
          console.error("Participant missing ID:", p);
          throw new Error("Invalid participant: missing ID");
        }
        return {
          userId: p.id,
          name: p.name,
          email: p.email,
          imageUrl: p.imageUrl,
          amount: evenAmount,
          percentage: (evenAmount / amount) * 100,
          paid: p.id === paidByUserId,
        };
      });
    }

    // Log the new splits to debug
    console.log("Created new splits:", newSplits);

    setSplits(newSplits);
    setTotalAmount(newSplits.reduce((sum, s) => sum + s.amount, 0));
    setTotalPercentage(newSplits.reduce((sum, s) => sum + s.percentage, 0));
    onSplitChange(newSplits);
  }, [type, amount, participants, paidByUserId, onSplitChange]);

  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const isAmountValid = Math.abs(totalAmount - amount) < 0.01;

  // --- Update Handlers ---
  const updatePercentageSplit = (userId: string, newPercentage: number) => {
    const updatedSplits = splits.map((split) =>
      split.userId === userId
        ? {
            ...split,
            percentage: newPercentage,
            amount: (amount * newPercentage) / 100,
          }
        : split
    );
    setSplits(updatedSplits);
    onSplitChange(updatedSplits);
    setTotalAmount(updatedSplits.reduce((sum, s) => sum + s.amount, 0));
    setTotalPercentage(updatedSplits.reduce((sum, s) => sum + s.percentage, 0));
  };

  const updateExactSplit = (userId: string, newAmount: string) => {
    const parsedAmount = parseFloat(newAmount) || 0;
    const updatedSplits = splits.map((split) =>
      split.userId === userId
        ? {
            ...split,
            amount: parsedAmount,
            percentage: amount > 0 ? (parsedAmount / amount) * 100 : 0,
          }
        : split
    );
    setSplits(updatedSplits);
    onSplitChange(updatedSplits);
    setTotalAmount(updatedSplits.reduce((sum, s) => sum + s.amount, 0));
    setTotalPercentage(updatedSplits.reduce((sum, s) => sum + s.percentage, 0));
  };

  // --- UI ---
  return (
    <div className="space-y-4 mt-4">
      {splits.map((split) => (
        <div
          key={`${split.userId}-${split.name}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 min-w-[120px]">
            <Avatar>
              <AvatarImage src={split.imageUrl} />
              <AvatarFallback>{split.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {split.userId === user?.id ? "You" : split.name}
            </span>
          </div>

          {type === "equal" && (
            <div className="text-sm text-right">
              ${split.amount.toFixed(2)} ({split.percentage.toFixed(1)}%)
            </div>
          )}

          {type === "percentage" && (
            <div className="flex items-center gap-4 flex-1">
              <Slider
                value={[split.percentage]}
                min={0}
                max={100}
                step={0.01}
                onValueChange={(values) =>
                  updatePercentageSplit(split.userId, parseFloat(values[0].toFixed(2)))
                }
                className="flex-1/2"
              />
              <div className="flex items-center gap-1 min-w-[100px]">
                <Input
                  className="w-20 h-8"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={split.percentage.toFixed(2)}
                  onChange={(e) =>
                    updatePercentageSplit(
                      split.userId,
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
                <span className="text-sm text-muted-foreground">%</span>
                <span className="text-sm ml-1">${split.amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {type === "exact" && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1"></div>
              <div className="flex gap-1 items-center">
                <span className="text-sm text-muted-foreground ml-1">$</span>
                <Input
                  type="number"
                  min="0"
                  value={split.amount.toFixed(2)}
                  onChange={(e) =>
                    updateExactSplit(split.userId, e.target.value)
                  }
                  className="text-sm w-30 h-8"
                />

                <span className="text-sm text-muted-foreground ml0-1">
                  ({split.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between border-t pt-3 mt-3">
        <span className="font-medium">Total</span>
        <div className="text-right">
          <span
            className={`font-medium ${!isAmountValid ? "text-amber-600" : ""}`}
          >
            ${totalAmount.toFixed(2)}
          </span>

          {type !== "equal" && (
            <span
              className={`text-sm ml-2 ${!isPercentageValid ? "text-amber-600" : ""}`}
            >
              ({totalPercentage.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>
      {!isPercentageValid && type === "percentage" && (
        <div className="text-amber-600 text-sm">Total must equal 100%</div>
      )}
      {!isAmountValid && type === "exact" && (
        <div className="text-amber-600 text-sm">Total amount mismatch</div>
      )}
    </div>
  );
};

export default SplitSelector;
