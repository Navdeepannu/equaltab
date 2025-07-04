"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Users, Receipt, Wallet, TrendingUp } from "lucide-react";

const AppPreview: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center ">
      {/* Main preview container as a simple card with left-to-right animation */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg w-[500px] h-[600px] flex flex-col gap-4 overflow-hidden border border-gray-200"
      >
        {/* Recent Expenses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-h-0"
        >
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5">
              <CardTitle className="text-xs font-semibold">
                Recent Expenses
              </CardTitle>
              <Receipt className="h-3.5 w-3.5 text-teal-600" />
            </CardHeader>
            <CardContent className="p-1.5 pt-0">
              <div className="space-y-1">
                {[
                  {
                    name: "Lunch",
                    amount: "$24.50",
                    date: "2h",
                    category: "Food",
                  },
                  {
                    name: "Movie",
                    amount: "$32.00",
                    date: "5h",
                    category: "Fun",
                  },
                ].map((expense, index) => (
                  <motion.div
                    key={expense.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2  hover:bg-gray-50/50 rounded transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-[11px] text-gray-900">
                        {expense.name}
                      </p>
                      <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[9px] text-gray-500">{expense.date}</p>
                      <p className="font-semibold text-[11px] text-teal-600">
                        {expense.amount}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 min-h-0"
        >
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5">
              <CardTitle className="text-xs font-semibold">Balance</CardTitle>
              <Wallet className="h-3.5 w-3.5 text-teal-600" />
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1">
                <div className="flex items-center justify-between p-1 hover:bg-gray-50/50 rounded transition-colors">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-[11px] text-gray-900">
                      Owe Alex
                    </p>
                    <p className="text-[9px] text-gray-500">2h</p>
                  </div>
                  <p className="font-semibold text-[11px] text-red-500">
                    -$15.25
                  </p>
                </div>
                <div className="flex items-center justify-between p-1 hover:bg-gray-50/50 rounded transition-colors">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-[11px] text-gray-900">
                      Sarah owes
                    </p>
                    <p className="text-[9px] text-gray-500">1d</p>
                  </div>
                  <p className="font-semibold text-[11px] text-green-500">
                    +$32.00
                  </p>
                </div>
                <div className="mt-1 pt-1 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-medium text-gray-600">Net</p>
                    <p className="font-semibold text-[11px] text-teal-600">
                      +$16.75
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Groups Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex-1 min-h-0"
        >
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5">
              <CardTitle className="text-xs font-semibold">Groups</CardTitle>
              <Users className="h-3.5 w-3.5 text-teal-600" />
            </CardHeader>
            <CardContent className="p-1.5 pt-0">
              <div className="space-y-1">
                {[
                  {
                    name: "Roommates",
                    members: 4,
                    total: "$1.2k",
                    recent: "5m",
                    trend: "+$120",
                  },
                  {
                    name: "NYC Trip",
                    members: 6,
                    total: "$3.4k",
                    recent: "2h",
                    trend: "+$450",
                  },
                ].map((group, index) => (
                  <motion.div
                    key={group.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-1 hover:bg-gray-50/50 rounded transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-[11px] text-gray-900">
                        {group.name}
                      </p>
                      <span className="text-[9px] text-gray-500">
                        {group.members}p
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[9px] text-gray-500">{group.recent}</p>
                      <div className="flex items-center gap-0.5">
                        <TrendingUp
                          className={cn(
                            "h-2 w-2",
                            group.trend.startsWith("+")
                              ? "text-green-500"
                              : "text-red-500 rotate-180"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[9px]",
                            group.trend.startsWith("+")
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          {group.trend}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AppPreview;
