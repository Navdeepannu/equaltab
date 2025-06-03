import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="mt-20 pb-12 space-y-10 md:space-y-20 px-5">
      <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Split Expenses, Not Friendships.
        </Badge>

        <h1 className="text-text mx-auto max-w-4xl text-4xl font-bold md:text-7xl md:tracking-wide">
          Keep your finances fair and your relationships stress-free.
        </h1>

        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
          Track expenses, split bills easily, and settle up fast—no more awkward
          money talks.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
    </section>
  );
};

export default Hero;
