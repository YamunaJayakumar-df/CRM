import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import "./globals.css";

// next/font downloads Inter at build time and serves it from our own site,
// so the browser never calls Google. It exposes the font as --font-inter,
// which globals.css uses as the default sans font.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM",
  description:
    "Internal CRM for managing customers, interactions, and follow-ups.",
};

// The root layout wraps every page with the app shell:
// sidebar on the left (or MobileNav on phones), top bar, then the page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-cream font-sans text-ink">
        <div className="flex min-h-screen">
          <Sidebar />
          {/* min-w-0 lets this column shrink on small screens instead of
              pushing the page wider than the phone. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileNav />
            <TopBar />
            <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
