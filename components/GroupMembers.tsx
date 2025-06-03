"use client";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

// Defining member type
export type Member = {
  id: Id<"users">;
  name: string;
  imageUrl?: string;
  role: "admin" | "member" | null;
};

type GroupMembersProps = {
  members: Member[];
};

const GroupMembers: React.FC<GroupMembersProps> = ({ members }) => {
  const { isAuthenticated } = useStoreUserEffect();

  const { data: currentUser } = useConvexQuery<Doc<"users">>(
    isAuthenticated ? api.users.getCurrentUser : api.users.emptyUser
  );

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No members in this group 🙃
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.id === currentUser?._id;
        const isAdmin = member.role === "admin";

        return (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.imageUrl} />
                <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex justify-center gap-2">
                  <span>{member.name}</span>
                  <div className="text-sm font-medium">
                    {isCurrentUser && (
                      <Badge
                        variant={"secondary"}
                        className="text-xs py-0 h-5 text-white"
                      >
                        You
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  {isAdmin && (
                    <span className="text-xs text-muted-foreground">Admin</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupMembers;
