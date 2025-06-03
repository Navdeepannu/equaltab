"use client";

import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useConvexMutation, useConvexQuery } from "@/hooks/useConvexQuery";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { User } from "@/convex/users";
import { toast } from "sonner";
import Error from "next/error";

// Define GroupType (adjust this to your actual type if needed)
type CreatedGroup = {
  id: string;
  name: string;
  description?: string;
};

type CurrentUser = {
  name: string;
  imageUrl?: string;
};

type GroupModelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (group: CreatedGroup) => void;
};

// Zod validation schema
const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

const GroupModel: React.FC<GroupModelProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  const { data: currentUser } = useConvexQuery<CurrentUser | null>(
    api.users.getCurrentUser
  );

  const { data: searchResults, loading: isSearching } = useConvexQuery<User[]>(
    api.users.searchUsers,
    { query: searchQuery }
  );

  const createGroup = useConvexMutation(api.contacts.createGroup);

  const addMember = (user: User) => {
    if (!selectedMembers.some((m) => m.id == user.id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setCommandOpen(false);
  };

  const removeMember = (userId: User["id"]) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleClose = () => {
    reset();
    setSelectedMembers([]);
    onClose();
  };

  const onSubmit = async (data: GroupFormValues) => {
    try {
      const memberIds = selectedMembers.map((member) => member.id);
      const groupId = await createGroup.mutate({
        name: data.name,
        description: data.description,
        members: memberIds,
      });

      // Success
      toast.success("Group Created Successfully.");
      reset();
      setSelectedMembers([]);
      onClose();

      if (onSuccess) {
        onSuccess(groupId);
      }
    } catch (error: any) {
      toast.error(`Failed to create group: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="Enter group name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter group description"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Members</Label>

            <div className="flex flex-wrap gap-2 mb-2">
              {currentUser && (
                <Badge variant={"outline"} className="px-3 py-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      className="rounded-full"
                      src={currentUser?.imageUrl}
                      alt={currentUser?.name}
                    />
                    <AvatarFallback>
                      {currentUser?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{currentUser?.name} (You)</span>
                </Badge>
              )}
            </div>

            {/* selected members */}
            <div>
              {selectedMembers.map((member) => (
                <Badge
                  variant={"outline"}
                  key={member.id}
                  className="px-3 py-1"
                >
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage
                      className="rounded-full"
                      src={member?.imageUrl}
                      alt={member?.name}
                    />
                    <AvatarFallback>
                      {member?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member?.name}</span>

                  <Button
                    size="icon"
                    variant={"outline"}
                    onClick={() => removeMember(member.id)}
                    className="ml-2 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X />
                  </Button>
                </Badge>
              ))}
            </div>
            {/* add users to selected  */}
            <Popover open={commandOpen} onOpenChange={setCommandOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 gap-1 text-sm cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Member
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start" side="bottom">
                <Command className="rounded-lg border shadow-md md:min-w-[450px]">
                  <CommandInput
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchQuery.length < 2 ? (
                        <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                          Type at least 2 characters to search
                        </p>
                      ) : isSearching ? (
                        <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                          Searching...
                        </p>
                      ) : (
                        <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                          No users found
                        </p>
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="Users">
                      {searchResults?.map((user: User) => (
                        <CommandItem
                          key={user.id}
                          value={user.id + user.email}
                          onSelect={() => addMember(user)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.imageUrl} />
                              <AvatarFallback>
                                {user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">{user.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedMembers.length === 0 && (
            <p className="text-sm text-amber-600">
              Add at least one person to the group
            </p>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              className="text-md"
              type="button"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedMembers.length === 0}
              className="bg-secondary cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupModel;
