import React from "react";
import { Badge } from "./ui/badge";
import { STEPS } from "@/lib/landing";

const Process = () => {
  return (
    <section className="py-20" id="how-it-works">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-green-100 text-green-800">
          How it Works
        </Badge>

        <h2 className="text-teal mt-2 text-3xl md:text-4xl font-bold">
          Splitting expenses has never been easier
        </h2>
        <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-lg/relaxed">
          Follow these simple steps to start tracking and splitting expenses
          with friends
        </p>

        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
          {STEPS.map(({ title, label, description }) => (
            <div className="flex flex-col items-center space-y-4" key={title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-teal">
                {label}
              </div>
              <div className="text-xl font-bold">{title}</div>
              <div className="text-gray-500 text-center">{description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
