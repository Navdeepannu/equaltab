import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <section className="py-20 gradient">
      <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
          Ready to simplify expense sharing?
        </h2>

        <p className="mx-auto max-w-[600px] text-green-100 md:text-lg/relaxed">
          Join others users who have made splitting expenses stress-free.
        </p>

        <Button
          size={"lg"}
          className="bg-black text-white hover:-translate-y-1 duration-500 transition-all cursor-pointer shadow-primary hover:shadow-xl text-lg"
        >
          <Link href={"/dashboard"}>Get Started</Link>
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default Footer;
