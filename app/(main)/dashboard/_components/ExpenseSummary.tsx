"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlySpendingItem = {
  month: string; // ISO string or any parsable date format
  total: number;
};

type ExpenseSummaryProps = {
  monthlySpending: MonthlySpendingItem[];
  totalSpent: number;
};

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  monthlySpending,
  totalSpent,
}) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData =
    monthlySpending?.map((item) => {
      const date = new Date(item.month);

      return { name: monthNames[date.getMonth()], amount: item.total };
    }) || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  console.log(chartData);
  console.log(monthlySpending);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total this month</p>
            <h3 className="text-2xl font-bold mt-1">
              $
              {typeof monthlySpending?.[currentMonth]?.total === "number"
                ? monthlySpending[currentMonth].total.toFixed(2)
                : "0.00"}
            </h3>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total this year</p>
            <h3 className="text-2xl font-bold mt-1">
              ${typeof totalSpent === "number" ? totalSpent.toFixed(2) : "0.00"}
            </h3>
          </div>
        </div>

        <div className="h-64 mt-6">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toFixed(2)}`,
                  "Amount",
                ]}
                labelFormatter={() => "Spending"}
              />
              <Bar dataKey="amount" fill="#6dd08e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Monthy spending of {currentYear}
        </p>
      </CardContent>
    </Card>
  );
};

export default ExpenseSummary;
