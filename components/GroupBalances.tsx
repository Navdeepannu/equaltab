"use client";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import React from "react";
import { Balance } from "@/convex/groups";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Badge } from "./ui/badge";

type GroupBalancesProps = {
  balances: Balance[];
};

const GroupBalances: React.FC<GroupBalancesProps> = ({ balances }) => {
  const { isAuthenticated } = useStoreUserEffect();

  const { data: currentUser } = useConvexQuery<Doc<"groups">>(
    isAuthenticated ? api.users.getCurrentUser : api.users.emptyUser
  );

  if (!balances.length || !currentUser) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No balances information available
      </div>
    );
  }

  const me = balances.find((b) => b.id === currentUser._id);
  if (!me) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        You&apos;re not part of this group.
      </div>
    );
  }

  const userMap = Object.fromEntries(balances.map((b) => [b.id, b]));

  //   Who owes me?
  const owedByMembers = me.owedBy
    .map(({ from, amount }) => ({ ...userMap[from], amount }))
    .sort((a, b) => b.amount - a.amount);

  const owingToMembers = me.owes
    .map(({ to, amount }) => ({ ...userMap[to], amount }))
    .sort((a, b) => b.amount - a.amount);

  const isAllSettledUp =
    me.totalBalance === 0 &&
    owedByMembers.length === 0 &&
    owingToMembers.length === 0;

  return (
    <div className="space-y-4">
      <div className="text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
        <p
          className={`text-2xl font-bold ${me.totalBalance > 0 ? "text-green-600" : me.totalBalance < 0 ? "text-red-600" : ""}`}
        >
          {me.totalBalance > 0
            ? `+$${me.totalBalance.toFixed(2)}`
            : me.totalBalance < 0
              ? `-$${Math.abs(me.totalBalance).toFixed(2)}`
              : "$0.00"}
        </p>
      </div>

      {isAllSettledUp ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Everyone is settled up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {owedByMembers.length > 0 && (
            <div>
              <Badge
                variant="outline"
                className="text-sm font-medium flex items-center mb-3 text-teal"
              >
                <ArrowUpCircle className="h-4 w-4 mr-1 text-green-600" />
                Owed to you
              </Badge>
              <div className="space-y-3">
                {owedByMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback>
                          <span>{member.name?.charAt(0) ?? "?"}</span>
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm capitalize">{member.name}</span>
                    </div>
                    <span className="font-bold text-green-600">
                      ${member.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {owingToMembers.length > 0 && (
            <div>
              <Badge
                variant="outline"
                className="text-sm font-medium flex items-center mb-3 text-teal"
              >
                <ArrowDownCircle className="h-4 w-4 mr-1 text-red-500" />
                You Owe
              </Badge>
              <div className="space-y-3">
                {owingToMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl} />
                        <AvatarFallback>
                          <span>{member.name?.charAt(0) ?? "?"}</span>
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm capitalize">{member.name}</span>
                    </div>
                    <span className="font-medium text-red-500">
                      ${member.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupBalances;
