import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Process from "@/components/Process";

export default function Home() {
  return (
    <div className="flex flex-col pt-16">
      <Hero />
      <Features />
      <Process />
      <Footer />
    </div>
  );
}
