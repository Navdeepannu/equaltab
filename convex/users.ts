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
      throw new Error("Not Authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identify.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<SearchUserResult[]> => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);

    if (args.query.length < 2) {
      return [];
    }

    const nameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .collect();

    const emailResults = await ctx.db
      .query("users")
      .withSearchIndex("search_email", (q) => q.search("email", args.query))
      .collect();

    // combine results
    const users = [
      ...nameResults,
      ...emailResults.filter(
        (email) => !nameResults.some((name) => name._id === email._id)
      ),
    ];

    return users
      .filter((user) => user._id !== currentUser._id)
      .map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
      }));
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