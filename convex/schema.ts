import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" }),

  contacts: defineTable({
    userId: v.id("users"),
    contactId: v.id("users"),
    status: v.string(), // "pending", "accepted", "blocked"
    connectionType: v.optional(v.string()), // "friend", "family", "colleague", etc.
    connectionDate: v.number(),
    notes: v.optional(v.string()),
    verificationMethod: v.optional(v.string()), // "email", "phone", etc.
    lastInteractionDate: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_contact", ["contactId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_contact", ["userId", "contactId"]),

  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_date", ["date"]),

  groups: defineTable({
    name: v.string(),
    description: v.string(),
    createdBy: v.id("users"),
    members: v.array(
      v.object({
        userId: v.id("users"),
        role: v.string(),
        joinedAt: v.number(),
      })
    ),
  }),

  settlements: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.number(),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
    createdBy: v.id("users"),
  }).index("by_user_and_group", ["paidByUserId", "groupId"]),
});
