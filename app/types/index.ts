import { Doc, Id } from "../../convex/_generated/dataModel";

// Common user info type used in userLookupMap
export type UserInfo = {
  id: Id<"users">;
  name: string;
  email?: string;
  imageUrl?: string;
  role: "admin" | "member" | null;
};

export type Split = {
  userId: Id<"users">;
  amount: number;
  paid: boolean;
};

export type Expense = {
  _id: Id<"expenses">;
  _creationTime: number;
  amount: number;
  category?: string;
  description: string;
  date: number;
  paidByUserId: Id<"users">;
  splitType: string;
  splits: Split[];
  groupId?: Id<"groups">;
  createdBy: Id<"users">;
};

export type UserLookupMap = {
  [key: Id<"users">]: {
    id: Id<"users">;
    name: string;
    imageUrl?: string;
  };
};

// Props for ExpenseList
export type ExpenseListProps = {
  expenses: Expense[];
  showOtherPerson?: boolean;
  otherPersonId: string | string[];
  userLookupMap: UserLookupMap;
  isGroupExpense: boolean;
};

// Props for SettlementList
export type SettlementListProps = {
  settlements: Doc<"settlements">[];
  isGroupSettlements?: boolean;
  userLookupMap: UserLookupMap;
};

type Group = {
  name: string;
  description: string;
};

type Balance = {
  id: Id<"groups">;
  // add other properties you expect on each balance, e.g.:
  // amount: number;
  // name: string;
};

export type GroupExpenseData = {
  group: Group;
  members: UserInfo[];
  expenses: Expense[];
  settlements: Doc<"settlements">[];
  balances: Balance[] | null;
  userLookupMap: UserLookupMap;
};

export type GetGroupOrMembersResult = {
  selectedGroup?: {
    id: Id<"groups">;
    name: string;
    description?: string;
    createdBy: Id<"users">;
    members: {
      id: Id<"users">;
      name?: string;
      email?: string;
      imageUrl?: string;
      role: string;
    }[];
  };
  groups: {
    id: Id<"groups">;
    name: string;
    description?: string;
    memberCount: number;
  }[];
};
