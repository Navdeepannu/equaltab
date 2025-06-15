"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { GetGroupOrMembersResult } from "@/app/types";

interface GroupSelectorProps {
  onChange: (group: GetGroupOrMembersResult["selectedGroup"]) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ onChange }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);

  const { data, loading } = useConvexQuery<GetGroupOrMembersResult>(
    api.groups.getGroupOrMembers,
    selectedGroupId ? { groupId: selectedGroupId } : {}
  );

  useEffect(() => {
    if (selectedGroupId && data?.selectedGroup) {
      onChange(data.selectedGroup);
    }
  }, [selectedGroupId, data?.selectedGroup, onChange]);

  const handleGroupChange = (groupId: Id<"groups">) => {
    setSelectedGroupId(groupId);
  };

  if (loading) {
    return <BarLoader width={"100%"} color="#36b7b7" />;
  }

  if (!data?.groups || data.groups.length === 0) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        You need to create a group first before adding a group expense.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        onChange={(e) => handleGroupChange(e.target.value as Id<"groups">)}
        value={selectedGroupId || ""}
      >
        <option value="">Select a group</option>
        {data.groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name} ({group.memberCount} members)
          </option>
        ))}
      </select>
    </div>
  );
};

export default GroupSelector;
