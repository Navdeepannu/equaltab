import React from "react";
import { Badge } from "./ui/badge";
import { FEATURES } from "@/lib/landing";
import { Card } from "./ui/card";

const Features = () => {
  return (
    <div className="bg-gray-50 py-20" id="features">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Features
        </Badge>

        <h2 className="text-teal mt-2 text-3xl md:text-4xl font-bold">
          Everything you need to split expenses
        </h2>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, Icon, bg, color, description }) => (
            <Card
              key={title}
              className="flex flex-col items-center space-y-4 p-6 text-center"
            >
              <div className={`rounded-full p-3 ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>

              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-gray-500">{description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
