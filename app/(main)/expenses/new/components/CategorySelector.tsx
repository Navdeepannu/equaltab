"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  isDefault?: string;
};

interface CategorySelectorProps {
  categories: Category[];
  onChange: (selectedCategoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  onChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);

    if (onChange && categoryId !== selectedCategory) {
      onChange(categoryId);
    }
  };

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      const defaultCategory =
        categories.find((cat) => cat.isDefault) || categories[0];

      setTimeout(() => {
        setSelectedCategory(defaultCategory.id);

        if (onChange) {
          onChange(defaultCategory.id);
        }
      }, 0);
    }
  }, [selectedCategory, categories, onChange]);

  if (!categories || categories.length === 0) {
    return <div>No categories available</div>;
  }

  return (
    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem value={category.id} key={category.id}>
            <div className="flex items-center gap-2">
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
