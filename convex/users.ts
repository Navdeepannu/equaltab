import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export type User = {
  id: Id<"users">;
  name: string;
  email: string;
  tokenIdentifier: string;
  imageUrl: string;
};

export type SearchUserResult = {
  id: Id<"users">;
  name: string;
  email: string;
  imageUrl?: string;
  tokenIdentifier: string;
};

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identify = await ctx.auth.getUserIdentity();
    if (!identify) {
      throw new Error("Called storeUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identify.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      if (user.name !== identify.name) {
        await ctx.db.patch(user._id, { name: identify.name });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: identify.name ?? "Anonymous",
      tokenIdentifier: identify.tokenIdentifier,
      email: identify.email ?? "",
      imageUrl: identify.pictureUrl ?? "",
    });
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identify = await ctx.auth.getUserIdentity();
    if (!identify) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identify.tokenIdentifier)
      )
      .first();

    if (!user) {
      return null;
    }

    return user;
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<SearchUserResult[]> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    console.log("=== Search Users ===");
    console.log("Search query:", args.query);
    console.log("Current user:", currentUser);

    if (args.query.length < 2) {
      console.log("Query too short, returning empty array");
      return [];
    }

    // Get all users first for debugging
    const allUsers = await ctx.db.query("users").collect();
    console.log("Total users in database:", allUsers.length);

    // Search by name - using contains instead of search for more lenient matching
    const nameResults = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.gte(q.field("name"), args.query.toLowerCase()),
          q.lte(q.field("name"), args.query.toUpperCase())
        )
      )
      .collect();

    console.log("Name search results:", nameResults);

    // Search by email - using contains instead of search for more lenient matching
    const emailResults = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.gte(q.field("email"), args.query.toLowerCase()),
          q.lte(q.field("email"), args.query.toUpperCase())
        )
      )
      .collect();

    console.log("Email search results:", emailResults);

    // combine results
    const users = [
      ...nameResults,
      ...emailResults.filter(
        (email) => !nameResults.some((name) => name._id === email._id)
      ),
    ];

    console.log("Combined results before filtering:", users);

    // Filter out current user and map to SearchUserResult
    const results: SearchUserResult[] = users
      .filter((user) => {
        const isNotCurrentUser = user._id !== currentUser?._id;
        if (!isNotCurrentUser) {
          console.log("Filtered out current user:", user);
        }
        return isNotCurrentUser;
      })
      .map((user) => {
        // Validate user data
        if (!user._id || !user.name || !user.email || !user.tokenIdentifier) {
          console.error("Invalid user data in search results:", user);
          return null;
        }

        const result: SearchUserResult = {
          id: user._id,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          tokenIdentifier: user.tokenIdentifier,
        };
        console.log("Mapped user result:", result);
        return result;
      })
      .filter((result): result is SearchUserResult => result !== null);

    console.log("Final search results:", results);
    return results;
  },
});

export const emptyUser = query({
  handler: async () => ({
    id: "" as Id<"users">,
    name: "Guest",
    email: "",
    tokenIdentifier: "",
    imageUrl: "",
  }),
});

export const emptySearch = query({
  handler: async (ctx) => {
    return [];
  },
});

export const getUserById = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },
});