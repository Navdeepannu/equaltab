"use client";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { Participant } from "@/app/types";
import { SearchUserResult } from "@/convex/users";
import { Avatar } from "@radix-ui/react-avatar";
import { UserPlus, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface ParticipantSelectorProps {
  participants: Participant[];
  onParticipantsChange: (updatedParticipants: Participant[]) => void;
}

const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  participants,
  onParticipantsChange,
}) => {
  const { isAuthenticated } = useStoreUserEffect();
  const { data: currentUser, loading: isLoading } = useConvexQuery<
    Doc<"users">
  >(api.users.getCurrentUser, undefined, { enabled: isAuthenticated });

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Only search if authenticated and query is long enough
  const shouldSearch = isAuthenticated && searchQuery.length >= 2;

  // Search the users - use emptySearch query when not authenticated
  const { data: searchResults = [], loading } = useConvexQuery<
    SearchUserResult[]
  >(
    shouldSearch ? api.users.searchUsers : api.users.emptySearch,
    shouldSearch ? { query: searchQuery } : {}
  );


  // Add Participants
  const addParticipant = (user: SearchUserResult) => {
    // console.log("=== Adding Participant ===");
    // console.log("Input user:", user);

    if (!currentUser?._id) {
      console.error("No current user found or missing ID");
      return;
    }

    // Validate the user data
    if (!user.id || !user.tokenIdentifier) {
      console.error("Selected user missing required fields:", user);
      return;
    }

    // Don't add if already a participant
    if (participants.some((p) => p.id === user.id)) {
      console.log("User already added as participant:", user.id);
      return;
    }

    try {
      // Create new participant
      const participant: Participant = {
        id: user.id,
        name: user.name || "Unknown User",
        email: user.email || "",
        imageUrl: user.imageUrl,
        tokenIdentifier: user.tokenIdentifier,
      };


      // Create current user participant
      const currentUserParticipant: Participant = {
        id: currentUser._id,
        name: currentUser.name || "You",
        email: currentUser.email || "",
        imageUrl: currentUser.imageUrl,
        tokenIdentifier: currentUser.tokenIdentifier,
      };

      // Build updated participants list
      const updatedParticipants = [...participants];

      // Add current user if not present
      if (!updatedParticipants.some((p) => p.id === currentUser._id)) {
        updatedParticipants.push(currentUserParticipant);
      }

      // Add new participant
      updatedParticipants.push(participant);

      onParticipantsChange(updatedParticipants);
      setOpen(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating participant:", error);
      toast.error("Error adding participant");
    }
  };

  // Remove participant
  const removeParticipant = (userId: Id<"users">) => {
    if (!currentUser) {
      console.error("No current user found");
      return;
    }

    // Don't allow removing current user
    if (userId === currentUser._id) {
      console.log("Cannot remove current user");
      return;
    }

    const updatedParticipants = participants.filter((p) => p.id !== userId);
    // Ensure current user is still in the list
    if (!updatedParticipants.some((p) => p.id === currentUser._id)) {
      const currentUserParticipant: Participant = {
        id: currentUser._id,
        name: currentUser.name || "You",
        email: currentUser.email || "",
        imageUrl: currentUser.imageUrl,
        tokenIdentifier: currentUser.tokenIdentifier,
      };
      updatedParticipants.push(currentUserParticipant);
    }
    onParticipantsChange(updatedParticipants);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        Please sign in to add participants
      </div>
    );
  }

  if (isLoading || !currentUser) {
    return <div className="text-sm text-muted-foreground p-2">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Show all participants including current user */}
        {participants.map((participant) => {
          // Validate participant before rendering
          if (!participant.id || !participant.tokenIdentifier) {
            return null;
          }

          return (
            <Badge
              key={`participant-${participant.id}`}
              variant="outline"
              className="flex items-center gap-2 px-2 py-0.5"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage
                  src={participant.imageUrl}
                  className="rounded-full"
                />
                <AvatarFallback>
                  {participant.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {participant.id === currentUser?._id
                  ? "You"
                  : participant.name || participant.email}
              </span>
              {participant.id !== currentUser?._id && (
                <Button
                  variant="default"
                  type="button"
                  size="icon"
                  onClick={() => removeParticipant(participant.id)}
                  className="text-white bg-red-500 rounded-full"
                >
                  <X className="h-1 w-1" />
                </Button>
              )}
            </Badge>
          );
        })}

        {/* Add participant button - show only if we have less than 2 participants */}
        {participants.length < 2 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                type="button"
                disabled={!isAuthenticated}
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Person
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={
                    isAuthenticated
                      ? "Search by name or email..."
                      : "Please sign in to search"
                  }
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  disabled={!isAuthenticated}
                />
                <CommandList>
                  <CommandEmpty>
                    {!isAuthenticated ? (
                      <p className="py-3 px-4 text-sm text-center text-amber-600">
                        Please sign in to search for users
                      </p>
                    ) : searchQuery.length < 2 ? (
                      <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                        Type at least 2 characters to search
                      </p>
                    ) : loading ? (
                      <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                        Searching..
                      </p>
                    ) : (
                      <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                        No user found
                      </p>
                    )}
                  </CommandEmpty>
                  <CommandGroup heading="Users">
                    {searchResults?.map((user) => {

                      return (
                        <CommandItem
                          key={`search-result-${user.id}`}
                          value={`${user.name || ""}-${user.email || ""}`}
                          onSelect={() => {
                            // console.log("Selected user from search:", user);
                            addParticipant(user);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.imageUrl} />
                              <AvatarFallback>
                                {user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {user.name || "Unknown User"}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default ParticipantSelector;
