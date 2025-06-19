import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Split Buddy",
  description: "Manage shared expenses effortlessly. Split bills fairly, track spending in groups, and stay updated with an easy-to-use dashboard. Perfect for roommates, couples, and friends who want stress-free money management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo.jpg" sizes="any" />
        </head>
        <body className={`${inter.className} antialiased`}>
          <ConvexClientProvider >
            <Toaster 
              position="top-right"
              expand={true}
              richColors
              closeButton
              className="z-50"
            />
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
