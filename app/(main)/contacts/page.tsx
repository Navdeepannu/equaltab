"use client";
import { api } from "@/convex/_generated/api";
import React, { useDebugValue, useEffect, useState } from "react";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Plus, User, Users } from "lucide-react";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Id } from "@/convex/_generated/dataModel";
import GroupModel from "./_components/GroupModel";
import { useRouter, useSearchParams } from "next/navigation";

export interface UserType {
  id: Id<"users">;
  name: string;
  email: string;
  imageUrl?: string;
}

export interface GroupType {
  id: Id<"groups">;
  name: string;
  description: string;
  memberCount: number;
}

const page = () => {
  const { isAuthenticated } = useStoreUserEffect();

  // Only fetch contacts when user is fully authaticated
  const { data, loading, error } = useConvexQuery<{
    users: UserType[];
    groups: GroupType[];
  }>(
    isAuthenticated ? api.contacts.getAllContacts : api.contacts.emptyContacts
  );

  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const createGroupParam = searchParams.get("createGroup");

    if (createGroupParam === "true") {
      setIsCreateGroupModalOpen(true);

      const url = new URL(window.location.href);
      url.searchParams.delete("createGroup");

      router.replace(url.pathname + url.search);
    }
  }, [router, searchParams]);

  if (loading) {
    return (
      <div>
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  const users = data?.users ?? [];
  const groups = data?.groups ?? [];

  return (
    <div className="container mx-auto mt-24 mb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="gradient-title text-5xl">CONTACTS</h1>
        <Button
          size={"lg"}
          className="bg-primary text-teal duration-500 transition-all cursor-pointer shadow-primary hover:shadow-md text-lg"
          onClick={() => setIsCreateGroupModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="h-4 w-4 mr-1" />
            People
          </h2>
          {users.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No contacts yet. Add and expense with someone to see them here.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user: UserType) => (
                <Link href={`/person/${user.id}`} key={user.id}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Groups
          </h2>
          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No groups yet. Create a group to start tracking shared expenses.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group: GroupType) => (
                <Link href={`/groups/${group.id}`} key={group.id}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {group.memberCount} members
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Model */}
      <GroupModel
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(groupId) => {
          router.push(`/groups/${groupId}`);
        }}
      />
    </div>
  );
};

export default page;
