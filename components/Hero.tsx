"use client"

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import AppPreview from "./AppPreview";

const Hero = () => {
  return (
    <section className="relative mt-20 pb-12 px-5 overflow-hidden" data-testid="hero-section">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Text Content */}
          <div className="space-y-6 text-center lg:text-left">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Split Expenses, Not Friendships.
            </Badge>

            <h1 className="text-text mx-auto lg:mx-0 max-w-4xl text-3xl font-bold md:text-5xl lg:text-6xl xl:text-7xl md:tracking-wide">
              Split bills with friends, track expenses, and settle up in real-time.
            </h1>

            <p className="mx-auto lg:mx-0 max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Create groups, manage shared expenses, and get paid back instantly. Perfect for roommates, trips, and group activities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                size={"lg"}
                className="bg-primary text-teal hover:-translate-y-1 duration-500 transition-all cursor-pointer shadow-primary hover:shadow-xl text-lg"
              >
                <Link href={"/dashboard"}>Get Started</Link>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size={"lg"}
                className="text-teal hover:-translate-y-1 duration-500 transition-all cursor-pointer shadow-primary hover:shadow-xl text-lg"
              >
                <Link href={"#how-it-works"}>See How it works?</Link>
              </Button>
            </div>
          </div>

          {/* Right Column - App Preview */}
          <div className="hidden lg:block relative h-[500px]">
            <div className="absolute inset-0">
              <AppPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
