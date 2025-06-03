"use client";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import React, { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
interface Group {
  id: string;
  name: string;
  members?: { id: string; name: string }[];
}

interface GroupQueryResult {
  groups: Group[];
}

interface GroupSelectorProps {
  onChange: (group: Group) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ onChange }) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const { data, loading } = useConvexQuery<GroupQueryResult>(
    api.groups.getGroupOrMembers,
    selectedGroup ? { groupId: selectedGroup } : {}
  );

  useEffect(() => {
    if (selectedGroup && data?.groups) {
      const fullGroup = data.groups.find((g) => g.id === selectedGroup);
      if (fullGroup && onChange) {
        onChange(fullGroup);
      }
    }
  }, [selectedGroup, data?.groups, onChange]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
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

  return <div className="space-y-2"></div>;
};

export default GroupSelector;
