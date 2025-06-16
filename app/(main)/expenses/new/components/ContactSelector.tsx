"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Id, Doc } from "@/convex/_generated/dataModel";
import { useConvexQuery, useConvexMutation } from "@/hooks/useConvexQuery";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { Contact, ContactStatus } from "@/convex/contacts";
import { UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useAction } from "convex/react";

export type Participant = {
  id: Id<"users">;
  name: string;
  email: string;
  imageUrl?: string;
  tokenIdentifier: string;
};

// Type for contacts from search results
type SearchContact = {
  contactId: Id<"users">;
  status: ContactStatus;
  contactDetails: {
    name: string;
    email: string;
    imageUrl?: string;
  };
};

interface ContactSelectorProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
}

interface NewContactFormData {
  name: string;
  email: string;
  connectionType?: "friend" | "family" | "colleague" | "other";
  notes?: string;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  participants,
  onParticipantsChange,
}) => {
  const { isAuthenticated } = useStoreUserEffect();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [newContactData, setNewContactData] = useState<NewContactFormData>({
    name: "",
    email: "",
    connectionType: "friend",
  });

  // Get current user
  const { data: currentUser, loading: isLoadingCurrentUser } = useConvexQuery<Doc<"users"> | null>(
    isAuthenticated ? api.users.getCurrentUser : api.users.emptyUser
  );

  // Get contacts
  const { data: contacts, loading: isLoadingContacts } = useConvexQuery<Contact[]>(
    isAuthenticated ? api.contacts.getContacts : api.contacts.emptySearch,
    { status: "accepted" }
  );

  // Get suggested users
  const { data: suggestedUsers, loading: isLoadingSuggested } = useConvexQuery<Array<{
    id: Id<"users">;
    name: string;
    email: string;
    imageUrl?: string;
    type: "user";
    isContact: boolean;
  }>>(
    isAuthenticated ? api.contacts.getSuggestedUsers : api.contacts.emptySearch
  );

  // Search potential contacts
  const { data: searchResults, loading: isLoadingSearch } = useConvexQuery<SearchContact[]>(
    isAuthenticated && searchQuery.length >= 2
      ? api.contacts.searchPotentialContacts
      : api.contacts.emptySearch,
    { query: searchQuery }
  );

  // Add mutation for creating new contact
  const createContact = useMutation(api.contacts.createContact);
  const sendContactInvitation = useAction(api.email.sendContactInvitation);
  const getUserById = useMutation(api.users.getUserById);

  const isLoading = isLoadingCurrentUser || isLoadingContacts || isLoadingSearch || isLoadingSuggested;

  // Add Participant
  const addParticipant = (contact: Contact | SearchContact) => {
    if (!currentUser?._id) {
      console.error("No current user found or missing ID");
      return;
    }

    // Get the user ID from either contact type
    const userId = contact.contactId;
    if (!userId || !contact.contactDetails) {
      console.error("Selected contact missing required fields:", contact);
      return;
    }

    // Don't add if already a participant
    if (participants.some((p) => p.id === userId)) {
      console.log("Contact already added as participant:", userId);
      return;
    }

    try {
      // Create new participant from contact
      const participant: Participant = {
        id: userId,
        name: contact.contactDetails.name,
        email: contact.contactDetails.email,
        imageUrl: contact.contactDetails.imageUrl,
        tokenIdentifier: "", // This will be filled in by the backend
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

  // Remove Participant
  const removeParticipant = (participantId: Id<"users">) => {
    if (!currentUser?._id) return;

    // Don't allow removing current user
    if (participantId === currentUser._id) {
      toast.error("Cannot remove yourself from the expense");
      return;
    }

    const updatedParticipants = participants.filter(
      (p) => p.id !== participantId
    );

    // Ensure current user is still in the list
    if (!updatedParticipants.some((p) => p.id === currentUser._id)) {
      updatedParticipants.push({
        id: currentUser._id,
        name: currentUser.name || "You",
        email: currentUser.email || "",
        imageUrl: currentUser.imageUrl,
        tokenIdentifier: currentUser.tokenIdentifier,
      });
    }

    onParticipantsChange(updatedParticipants);
  };

  const handleAddNewContact = async () => {
    if (!currentUser?._id) {
      toast.error("Please sign in to add a contact");
      return;
    }

    if (!newContactData.name || !newContactData.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      // Create the contact
      const contact = await createContact({
        name: newContactData.name,
        email: newContactData.email,
        connectionType: newContactData.connectionType,
        notes: newContactData.notes,
      });

      // Add the new contact as a participant
      if (contact && contact.contactDetails) {
        const participant: Participant = {
          id: contact.contactId,
          name: contact.contactDetails.name,
          email: contact.contactDetails.email,
          imageUrl: contact.contactDetails.imageUrl,
          tokenIdentifier: "", // This will be filled in when they join
        };

        // Create current user participant if not present
        const currentUserParticipant: Participant = {
          id: currentUser._id,
          name: currentUser.name || "You",
          email: currentUser.email || "",
          imageUrl: currentUser.imageUrl,
          tokenIdentifier: currentUser.tokenIdentifier,
        };

        const updatedParticipants = [...participants];
        if (!updatedParticipants.some((p) => p.id === currentUser._id)) {
          updatedParticipants.push(currentUserParticipant);
        }
        updatedParticipants.push(participant);

        onParticipantsChange(updatedParticipants);
        setIsAddingNewContact(false);
        setNewContactData({ name: "", email: "", connectionType: "friend" });

        // Send invitation email if this is a new user (no tokenIdentifier means they haven't joined yet)
        const contactUser = await getUserById({ userId: contact.contactId });
        if (!contactUser?.tokenIdentifier) {
          const result = await sendContactInvitation({
            toEmail: contact.contactDetails.email,
            toName: contact.contactDetails.name,
            fromName: currentUser.name,
            fromEmail: currentUser.email,
          });

          if (result.success) {
            toast.success("Contact invitation sent! They'll receive an email to join.");
          } else {
            console.error("Failed to send invitation email:", result.error);
            toast.error("Contact added but failed to send invitation email");
          }
        } else {
          toast.success("Contact added successfully!");
        }
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Error adding contact");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        Please sign in to add participants
      </div>
    );
  }

  if (isLoading) {
    return <BarLoader width={"100%"} color="#36b7b7" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-sm"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={participant.imageUrl} />
              <AvatarFallback>
                {participant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              {participant.id === currentUser?._id
                ? "You"
                : participant.name}
            </span>
            {participant.id !== currentUser?._id && (
              <button
                onClick={() => removeParticipant(participant.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {participants.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No participants added yet
          </div>
        )}

        {participants.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="h-8 px-3"
              >
                <UserPlus className="h-4 w-4" />
                Add Participant
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search your contacts and expense partners..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchQuery.length >= 2 ? (
                      <div className="p-4 text-sm">
                        <p className="text-muted-foreground mb-2">
                          No matching users found. Would you like to add a new contact?
                        </p>
                        <Dialog open={isAddingNewContact} onOpenChange={setIsAddingNewContact}>
                          <DialogTrigger asChild>
                            <Button variant="link" className="text-teal hover:underline flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Add New Contact
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Contact</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  value={newContactData.name}
                                  onChange={(e) => setNewContactData(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Enter their name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={newContactData.email}
                                  onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="Enter their email"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Connection Type</Label>
                                <select
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={newContactData.connectionType}
                                  onChange={(e) => setNewContactData(prev => ({ 
                                    ...prev, 
                                    connectionType: e.target.value as "friend" | "family" | "colleague" | "other" 
                                  }))}
                                >
                                  <option value="friend">Friend</option>
                                  <option value="family">Family</option>
                                  <option value="colleague">Colleague</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                  value={newContactData.notes || ""}
                                  onChange={(e) => setNewContactData(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Add any notes about this contact"
                                />
                              </div>
                              <Button 
                                onClick={handleAddNewContact}
                                className="w-full"
                                disabled={!newContactData.name || !newContactData.email}
                              >
                                Send Invitation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">
                        Start typing to search your contacts and expense partners...
                      </div>
                    )}
                  </CommandEmpty>

                  {!searchQuery && suggestedUsers && suggestedUsers.length > 0 && (
                    <CommandGroup heading="Your Contacts & Expense Partners">
                      {suggestedUsers.map((user) => (
                        <CommandItem
                          key={`suggested-${user.id}`}
                          value={`${user.name}-${user.email}`}
                          onSelect={() => addParticipant({
                            contactId: user.id,
                            status: user.isContact ? "accepted" : "pending",
                            contactDetails: {
                              name: user.name,
                              email: user.email,
                              imageUrl: user.imageUrl
                            }
                          })}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.imageUrl} />
                              <AvatarFallback>
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{user.name}</span>
                                {user.isContact && (
                                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    Contact
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchQuery.length >= 2 && searchResults && (
                    <CommandGroup heading="Search Results">
                      {searchResults.map((contact) => (
                        <CommandItem
                          key={`search-result-${contact.contactId}`}
                          value={`${contact.contactDetails?.name || ""}-${
                            contact.contactDetails?.email || ""
                          }`}
                          onSelect={() => addParticipant(contact)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={contact.contactDetails?.imageUrl}
                              />
                              <AvatarFallback>
                                {contact.contactDetails?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {contact.contactDetails?.name || "Unknown User"}
                                </span>
                                {contact.status === "accepted" && (
                                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    Contact
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {contact.contactDetails?.email}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {!searchQuery && (!suggestedUsers || suggestedUsers.length === 0) && (
                    <CommandGroup>
                      <div className="p-4 text-sm">
                        <p className="text-muted-foreground mb-2">
                          You don't have any contacts yet. Add some contacts to start splitting expenses!
                        </p>
                        <Dialog open={isAddingNewContact} onOpenChange={setIsAddingNewContact}>
                          <DialogTrigger asChild>
                            <Button variant="link" className="text-teal hover:underline flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Add Your First Contact
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Contact</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  value={newContactData.name}
                                  onChange={(e) => setNewContactData(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Enter their name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={newContactData.email}
                                  onChange={(e) => setNewContactData(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="Enter their email"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Connection Type</Label>
                                <select
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={newContactData.connectionType}
                                  onChange={(e) => setNewContactData(prev => ({ 
                                    ...prev, 
                                    connectionType: e.target.value as "friend" | "family" | "colleague" | "other" 
                                  }))}
                                >
                                  <option value="friend">Friend</option>
                                  <option value="family">Family</option>
                                  <option value="colleague">Colleague</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Input
                                  value={newContactData.notes || ""}
                                  onChange={(e) => setNewContactData(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="Add any notes about this contact"
                                />
                              </div>
                              <Button 
                                onClick={handleAddNewContact}
                                className="w-full"
                                disabled={!newContactData.name || !newContactData.email}
                              >
                                Send Invitation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default ContactSelector; 