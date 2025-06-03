import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { GetGroupOrMembersResult } from "../app/types/index";

export type Balance = {
  id: Id<"groups">;
  name: string;
  imageUrl?: string;
  role: string;
  totalBalance: number;
  owes: {
    to: Id<"users">;
    amount: number;
  }[];
  owedBy: {
    from: Id<"users">;
    amount: number;
  }[];
};

export const getGroupExpense = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    // current user
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group Not Found!");

    if (!group.members.some((m) => m.userId === currentUser._id)) {
      throw new Error("You are not a member of this group.");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), groupId))
      .collect();

    //   Member map
    const memberDetails = await Promise.all(
      group.members.map(async (m) => {
        const u = await ctx.db.get(m.userId);

        return {
          id: u?._id,
          name: u?.name,
          imageUrl: u?.imageUrl,
          role: m.role,
        };
      })
    );

    const ids: Id<"users">[] = memberDetails
      .map((m) => m.id)
      .filter((id): id is Id<"users"> => id !== undefined);

    // Balance Calculation
    // Format : {userId1: balance1, user2: balance2 ...}

    const totals = Object.fromEntries(ids.map((id) => [id, 0]));

    // 2-D ledger to track who owes who
    // legder[A][B] = how much A owes B --> Id, balance : number

    const ledger: Record<
      Id<"users">,
      Record<Id<"users">, number>
    > = {} as const;

    ids.forEach((a: Id<"users">) => {
      ledger[a] = {} as Record<Id<"users">, number>;

      ids.forEach((b: Id<"users">) => {
        if (a != b) {
          ledger[a][b] = 0;
        }
      });
    });

    // Apply expenses to balances

    for (const exp of expenses) {
      const payer = exp.paidByUserId;

      for (const split of exp.splits) {
        if (split.userId === payer || split.paid) continue;

        const debtor = split.userId;
        const amt = split.amount;

        // Update totals
        totals[payer] += amt;
        totals[debtor] -= amt;

        // update ledger
        ledger[debtor][payer] += amt;
      }
    }

    // Apply settlements to balances
    for (const s of settlements) {
      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;

      // update ledger
      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;
    }

    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a > b) return;

        // calculate the new debt between 2 users
        const diff = ledger[a][b] - ledger[b][a];

        if (diff > 0) {
          // User A owes User B (net)
          ledger[a][b] = diff;
          ledger[b][a] = 0;
        } else if (diff < 0) {
          ledger[b][a] = -diff;
          ledger[a][b] = 0;
        } else {
          ledger[a][b] = ledger[b][a] = 0;
        }
      });
    });

    // Format data
    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: totals[m.id!],
      owes: Object.entries(ledger[m.id!])
        .filter(([, v]) => (v as number) > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledger[other][m.id!] > 0)
        .map((from) => ({ from, amount: ledger[from][m.id!] })),
    }));

    // Create userLookupMap with consistent structure
    const userLookupMap: Record<
      Id<"users">,
      {
        id: Id<"users">;
        name: string;
        imageUrl?: string;
      }
    > = {};

    memberDetails.forEach((member) => {
      if (member.id) {
        userLookupMap[member.id] = {
          id: member.id,
          name: member.name || "Unknown User",
          imageUrl: member.imageUrl,
        };
      }
    });

    return {
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      members: memberDetails,
      expenses,
      settlements,
      balances,
      userLookupMap,
    };
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrentUser);

    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    // Check if user is authorized to delete the expense
    if (expense.createdBy !== user._id && expense.paidByUserId !== user._id) {
      throw new Error("You don't have permission to deletre this expense");
    }

    await ctx.db.delete(args.expenseId);
    return {
      success: true,
    };
  },
});

export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args): Promise<GetGroupOrMembersResult> => {
    const currentUsers = await ctx.runQuery(api.users.getCurrentUser);

    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups.filter((group) =>
      group.members.some((member) => member.userId == currentUsers._id)
    );

    if (args.groupId) {
      const selectedGroup = userGroups.find(
        (group) => group._id === args.groupId
      );

      if (!selectedGroup) {
        throw new Error("Group not found or you're not a member.");
      }

      const memberDetails = await Promise.all(
        selectedGroup.members.map(async (member) => {
          const user = await ctx.db.get(member.userId);
          if (!user) return null;

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            role: member.role,
          };
        })
      );

      const validMembers = memberDetails.filter(
        (member): member is NonNullable<typeof member> => member !== null
      );

      return {
        selectedGroup: {
          id: selectedGroup._id,
          name: selectedGroup.name,
          description: selectedGroup.description,
          createdBy: selectedGroup.createdBy,
          members: validMembers,
        },
        groups: userGroups.map((group) => ({
          id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
        })),
      };
    }

    // if no groupId, return only group list
    return {
      groups: userGroups.map((group) => ({
        id: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
      })),
    };
  },
});

export const emptyGroup = query({
  handler: async () => ({
    users: [],
    expenses: [],
  }),
});
