import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { action } from "./_generated/server";

// Types
interface CurrentUser {
  _id: Id<"users">;
  name: string;
  email: string;
  imageUrl?: string;
}

export type ContactStatus = "pending" | "accepted" | "blocked";
export type ConnectionType = "friend" | "family" | "colleague" | "other";

export type Contact = {
  id: Id<"contacts">;
  userId: Id<"users">;
  contactId: Id<"users">;
  status: ContactStatus;
  connectionType?: ConnectionType;
  connectionDate: number;
  notes?: string;
  verificationMethod?: string;
  lastInteractionDate: number;
  contactDetails?: {
    name: string;
    email: string;
    imageUrl?: string;
  };
};

export const getAllContacts = query({
  handler: async (
    ctx
  ): Promise<{
    users: {
      id: Id<"users">;
      name: string;
      email: string;
      imageUrl?: string;
      type: "user";
    }[];
    groups: {
      id: Id<"groups">;
      name: string;
      description: string;
      memberCount: number;
      type: "group";
    }[];
  }> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      return { users: [], groups: [] };
    }

    const expenseYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const expenseNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    const personalExpenses = [...expenseYouPaid, ...expenseNotPaidByYou];

    const contactIds: Set<Id<"users">> = new Set();
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id)
        contactIds.add(exp.paidByUserId);

      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) contactIds.add(s.userId);
      });
    });

    const contactUsers = await Promise.all(
      [...contactIds].map(async (id: Id<"users">) => {
        const u: Doc<"users"> | null = await ctx.db.get(id);
        return u
          ? {
              id: u._id,
              name: u.name,
              email: u.email,
              imageUrl: u.imageUrl,
              type: "user" as const,
            }
          : null;
      })
    );

    const userGroups = (await ctx.db.query("groups").collect())
      .filter((g) => g.members.some((m) => m.userId === currentUser._id))
      .map((g) => ({
        id: g._id,
        name: g.name,
        description: g.description,
        memberCount: g.members.length,
        type: "group" as const,
      }));

    const filteredContactUsers = contactUsers.filter(
      (u): u is NonNullable<typeof u> => u !== null
    );
    filteredContactUsers.sort((a, b) => a.name.localeCompare(b.name));

    const filteredUserGroups = userGroups.filter(
      (g): g is NonNullable<typeof g> => g !== null
    );
    filteredUserGroups.sort((a, b) => a.name.localeCompare(b.name));

    return {
      users: filteredContactUsers,
      groups: filteredUserGroups,
    };
  },
});

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args): Promise<Doc<"groups">> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    if (!args.name.trim()) {
      throw new Error("Group name cannot be empty.");
    }

    const uniqueMembers = new Set(args.members);
    uniqueMembers.add(currentUser._id);

    for (const id of uniqueMembers) {
      const user = await ctx.db.get(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
    }

    const groupDoc = {
      name: args.name.trim(),
      description: args.description?.trim() ?? "",
      createdBy: currentUser._id,
      members: [...uniqueMembers].map((id) => ({
        userId: id,
        role: id === currentUser._id ? "admin" : "member",
        joinedAt: Date.now(),
      })),
    };

    const groupId = await ctx.db.insert("groups", groupDoc);
    const createdGroup = await ctx.db.get(groupId);

    if (!createdGroup) {
      throw new Error("Failed to retrieve created group.");
    }

    return createdGroup;
  },
});

export const emptyContacts = query({
  handler: async () => ({
    users: [],
    groups: [],
  }),
});

// Get all contacts for current user
export const getContacts = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Contact[]> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      return [];
    }

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => 
        args.status ? q.eq(q.field("status"), args.status) : q.neq(q.field("status"), "")
      )
      .collect();

    // Get contact details
    const contactsWithDetails = await Promise.all(
      contacts.map(async (contact) => {
        const contactUser = await ctx.db.get(contact.contactId);
        return {
          id: contact._id,
          userId: contact.userId,
          contactId: contact.contactId,
          status: contact.status as ContactStatus,
          connectionType: contact.connectionType as ConnectionType | undefined,
          connectionDate: contact.connectionDate,
          notes: contact.notes,
          verificationMethod: contact.verificationMethod,
          lastInteractionDate: contact.lastInteractionDate,
          contactDetails: contactUser ? {
            name: contactUser.name,
            email: contactUser.email,
            imageUrl: contactUser.imageUrl,
          } : undefined,
        };
      })
    );

    return contactsWithDetails;
  },
});

// Send a contact request
export const sendContactRequest = mutation({
  args: {
    contactId: v.id("users"),
    connectionType: v.optional(v.string()),
    notes: v.optional(v.string()),
    verificationMethod: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"contacts">> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Check if contact exists
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Check if connection already exists
    const existingConnection = await ctx.db
      .query("contacts")
      .withIndex("by_user_and_contact", (q) =>
        q.eq("userId", currentUser._id).eq("contactId", args.contactId)
      )
      .first();

    if (existingConnection) {
      throw new Error("Connection already exists");
    }

    // Create contact request
    const contactId = await ctx.db.insert("contacts", {
      userId: currentUser._id,
      contactId: args.contactId,
      status: "pending" as ContactStatus,
      connectionType: args.connectionType as ConnectionType | undefined,
      connectionDate: Date.now(),
      notes: args.notes,
      verificationMethod: args.verificationMethod,
      lastInteractionDate: Date.now(),
    });

    return contactId;
  },
});

// Accept a contact request
export const acceptContactRequest = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args): Promise<Id<"contacts">> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact request not found");
    }

    if (contact.contactId !== currentUser._id) {
      throw new Error("Not authorized to accept this request");
    }

    if (contact.status !== "pending") {
      throw new Error("Contact request is not pending");
    }

    // Update contact status
    await ctx.db.patch(args.contactId, {
      status: "accepted" as ContactStatus,
      lastInteractionDate: Date.now(),
    });

    // Create reverse connection
    await ctx.db.insert("contacts", {
      userId: currentUser._id,
      contactId: contact.userId,
      status: "accepted" as ContactStatus,
      connectionType: contact.connectionType as ConnectionType | undefined,
      connectionDate: Date.now(),
      lastInteractionDate: Date.now(),
    });

    return args.contactId;
  },
});

// Remove or block a contact
export const updateContactStatus = mutation({
  args: {
    contactId: v.id("contacts"),
    status: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"contacts">> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (contact.userId !== currentUser._id) {
      throw new Error("Not authorized to update this contact");
    }

    // Update contact status
    await ctx.db.patch(args.contactId, {
      status: args.status as ContactStatus,
      lastInteractionDate: Date.now(),
    });

    // If blocking, also update reverse connection if it exists
    if (args.status === "blocked") {
      const reverseConnection = await ctx.db
        .query("contacts")
        .withIndex("by_user_and_contact", (q) =>
          q.eq("userId", contact.contactId).eq("contactId", currentUser._id)
        )
        .first();

      if (reverseConnection) {
        await ctx.db.patch(reverseConnection._id, {
          status: "blocked" as ContactStatus,
          lastInteractionDate: Date.now(),
        });
      }
    }

    return args.contactId;
  },
});

// Search for potential contacts (only show users you're not connected with)
export const searchPotentialContacts = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<Array<Omit<Contact, "id">>> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      return [];
    }

    if (args.query.length < 2) {
      return [];
    }

    // Get all existing contacts
    const existingContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const existingContactIds = new Set(
      existingContacts.map((c) => c.contactId)
    );

    // Get users from shared expenses
    const expenseYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const expenseNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    const personalExpenses = [...expenseYouPaid, ...expenseNotPaidByYou];
    const expenseUserIds = new Set<Id<"users">>();
    
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id) {
        expenseUserIds.add(exp.paidByUserId);
      }
      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) {
          expenseUserIds.add(s.userId);
        }
      });
    });

    // Combine all relevant user IDs (only contacts and expense partners)
    const relevantUserIds = new Set([
      ...existingContactIds,
      ...expenseUserIds
    ]);

    // Get all relevant users
    const relevantUsers = await Promise.all(
      [...relevantUserIds].map(async (id) => {
        const user = await ctx.db.get(id);
        return user;
      })
    );

    // Filter users based on search query
    const searchResults = relevantUsers
      .filter((user): user is NonNullable<typeof user> => 
        user !== null &&
        (
          user.name.toLowerCase().includes(args.query.toLowerCase()) ||
          user.email.toLowerCase().includes(args.query.toLowerCase())
        )
      )
      .map((user) => ({
        userId: currentUser._id,
        contactId: user._id,
        status: existingContactIds.has(user._id) ? "accepted" as ContactStatus : "pending" as ContactStatus,
        connectionDate: Date.now(),
        lastInteractionDate: Date.now(),
        contactDetails: {
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
        },
      }));

    return searchResults;
  },
});

// Empty search result for unauthenticated users
export const emptySearch = query({
  handler: async () => {
    return [];
  },
});

// Create a contact for a new user who isn't on the platform yet
export const createContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    connectionType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Contact> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists with this email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    let contactUserId: Id<"users">;
    
    if (existingUser) {
      // User exists, check if connection already exists
      const existingConnection = await ctx.db
        .query("contacts")
        .withIndex("by_user_and_contact", (q) =>
          q.eq("userId", currentUser._id).eq("contactId", existingUser._id)
        )
        .first();

      if (existingConnection) {
        throw new Error("Connection already exists with this user");
      }

      contactUserId = existingUser._id;
    } else {
      // Create a new user account
      contactUserId = await ctx.db.insert("users", {
        name: args.name,
        email: args.email.toLowerCase(),
        tokenIdentifier: "", // This will be set when they join
        imageUrl: "", // This will be set when they join
      });
    }

    // Create the contact connection
    const contactId = await ctx.db.insert("contacts", {
      userId: currentUser._id,
      contactId: contactUserId,
      status: "pending" as ContactStatus,
      connectionType: args.connectionType as ConnectionType | undefined,
      connectionDate: Date.now(),
      notes: args.notes,
      lastInteractionDate: Date.now(),
    });

    // Get the created contact with details
    const contact = await ctx.db.get(contactId);
    if (!contact) {
      throw new Error("Failed to create contact");
    }

    const contactUser = await ctx.db.get(contactUserId);
    if (!contactUser) {
      throw new Error("Failed to get contact user details");
    }

    return {
      id: contact._id,
      userId: contact.userId,
      contactId: contact.contactId,
      status: contact.status as ContactStatus,
      connectionType: contact.connectionType as ConnectionType | undefined,
      connectionDate: contact.connectionDate,
      notes: contact.notes,
      lastInteractionDate: contact.lastInteractionDate,
      contactDetails: {
        name: contactUser.name,
        email: contactUser.email,
        imageUrl: contactUser.imageUrl,
      },
    };
  },
});

// Get suggested users for participant selector
export const getSuggestedUsers = query({
  handler: async (ctx): Promise<Array<{
    id: Id<"users">;
    name: string;
    email: string;
    imageUrl?: string;
    type: "user";
    isContact: boolean;
  }>> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (!currentUser) {
      return [];
    }

    // Get all existing contacts
    const existingContacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const existingContactIds = new Set(
      existingContacts.map((c) => c.contactId)
    );

    // Get users from shared expenses
    const expenseYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const expenseNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    const personalExpenses = [...expenseYouPaid, ...expenseNotPaidByYou];
    const expenseUserIds = new Set<Id<"users">>();
    
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id) {
        expenseUserIds.add(exp.paidByUserId);
      }
      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) {
          expenseUserIds.add(s.userId);
        }
      });
    });

    // Get users from shared groups
    const allGroups = await ctx.db
      .query("groups")
      .collect();

    const userGroups = allGroups.filter(group => 
      group.members.some(member => member.userId === currentUser._id)
    );

    // Combine all relevant user IDs
    const relevantUserIds = new Set([
      ...expenseUserIds,
      ...userGroups.flatMap(g => g.members.map(m => m.userId)),
      ...existingContactIds // Include existing contacts
    ]);

    // Get all relevant users
    const relevantUsers = await Promise.all(
      [...relevantUserIds].map(async (id) => {
        const user = await ctx.db.get(id);
        return user;
      })
    );

    // Format results including contact status
    const suggestedUsers = relevantUsers
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        type: "user" as const,
        isContact: existingContactIds.has(user._id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return suggestedUsers;
  },
});
