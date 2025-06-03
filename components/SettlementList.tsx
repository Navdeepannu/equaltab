import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import React from "react";
import { Card, CardContent } from "./ui/card";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { SettlementListProps, UserLookupMap } from "@/app/types";

type User = {
  _id: Id<"users">;
  name: string;
  imageUrl?: string;
};

type Settlement = {
  _id: Id<"settlements">;
  paidByUserId: Id<"users">;
  receivedByUserId: Id<"users">;
  date: Date;
  amount: number;
  note: string;
  createdAt: number;
  groupId?: Id<"groups">;
};

const SettlementList: React.FC<SettlementListProps> = ({
  settlements,
  isGroupSettlements = false,
  userLookupMap,
}) => {
  const { data: currentUser } = useConvexQuery<User | null>(
    api.users.getCurrentUser
  );

  if (!settlements || !settlements.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No Settlements found.
        </CardContent>
      </Card>
    );
  }

  // User Details
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

  return (
    <div className="flex flex-col gap-4">
      {settlements.map((settlement) => {
        const payer = getUserDetails(settlement.paidByUserId);
        const receiver = getUserDetails(settlement.receivedByUserId);
        const isCurrentUserPayer = settlement.paidByUserId === currentUser?._id;
        const isCurrentUserReceiver =
          settlement.receivedByUserId === currentUser?._id;

        return (
          <Card
            className="hover:bg-muted/30 transition-colors"
            key={settlement._id}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-medium">
                      {isCurrentUserPayer
                        ? `You paid ${receiver.name}`
                        : isCurrentUserReceiver
                          ? `${payer.name} paid you`
                          : `${payer.name} paid ${receiver.name}`}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {format(new Date(settlement.date), "MMM d, yyyy")}
                      </span>

                      {settlement.note && (
                        <>
                          <span>.</span>
                          <span>{settlement.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    ${settlement.amount.toFixed(2)}
                  </div>

                  {isGroupSettlements ? (
                    <Badge className="mt-1" variant="outline">
                      Group Settlement
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isCurrentUserPayer ? (
                        <span className="text-amber-600">You paid</span>
                      ) : isCurrentUserReceiver ? (
                        <span className="text-green-600">You received</span>
                      ) : (
                        <span>Payment</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SettlementList;
