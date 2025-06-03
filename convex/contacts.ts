import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

// Types
interface CurrentUser {
  _id: Id<"users">;
  name: string;
  email: string;
  imageUrl?: string;
}

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
    const currentUser: CurrentUser = await ctx.runQuery(
      api.users.getCurrentUser
    );

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
