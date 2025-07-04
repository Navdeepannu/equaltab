"use client";

import { BarLoader } from "react-spinners";

import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { isLoading } = useStoreUserEffect();
  const path = usePathname();

  return (
    <header className="fixed top-0 w-full border bg-white/95 backdrop-blur-2xl z-50 supports-[backdrop-filter]:bg-white/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex-1 text-2xl">
          <Link href="/" className="flex items-center">
            <h1 className="text-4xl font-bold tracking-tight text-teal drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
              S
            </h1>
            <h1 className="font-bold tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] transition-all duration-300 -translate-y-0.5 hover:-translate-y-1">
              plitBuddy
            </h1>
          </Link>
        </div>

        {path === "/" && (
          <div className="hidden md:flex flex-1 justify-center items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition duration-300"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-green-600 transition duration-300"
            >
              How it Works
            </Link>
          </div>
        )}

        <div className="flex-1 flex justify-end gap-4 items-center">
          <Authenticated>
            <Link href="/dashboard">
              <Button
                variant={"outline"}
                className="hidden gap-2 items-center md:inline-flex hover:text-green-600 hover:border-green-600 transition cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>

              <Button variant={"outline"} className="md:hidden cursor-pointer">
                <LayoutDashboard className="w-4" />
              </Button>
            </Link>
            
            <UserButton />
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button
                variant={"outline"}
                className="cursor-pointer hover:bg-gray-100 transition"
              >
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button className="cursor-pointer bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>

      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
};

export default Navbar;
