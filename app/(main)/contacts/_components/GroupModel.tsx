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
import { Id } from "@/convex/_generated/dataModel";
import ContactSelector, { Participant } from "@/app/components/ContactSelector";

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
  onSuccess: (groupId: Id<"groups">) => void;
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);

  const { data: currentUser } = useConvexQuery<CurrentUser | null>(
    api.users.getCurrentUser
  );

  const createGroup = useConvexMutation(api.contacts.createGroup);

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
    setParticipants([]);
    onClose();
  };

  const onSubmit = async (data: GroupFormValues) => {
    try {
      const memberIds = participants.map((participant) => participant.id);
      const group = await createGroup.mutate({
        name: data.name,
        description: data.description,
        members: memberIds,
      });

      // Success
      toast.success("Group Created Successfully.");
      reset();
      setParticipants([]);
      onClose();

      if (onSuccess && group._id) {
        onSuccess(group._id);
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
            <ContactSelector
              participants={participants}
              onParticipantsChange={setParticipants}
              showCurrentUser={true}
              allowNewContacts={true}
              placeholder="Add Group Member"
            />
          </div>

          {participants.length === 0 && (
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
              disabled={isSubmitting || participants.length === 0}
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
