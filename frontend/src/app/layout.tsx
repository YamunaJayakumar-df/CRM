import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import "./globals.css";

// next/font downloads DM Sans at build time and serves it from our own site,
// so the browser never calls Google. It exposes the font as --font-dm-sans,
// which globals.css uses as the default sans font. DM Sans was chosen
// (2026-10-29) for its readability in small table text.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora CRM",
  description:
    "Internal CRM for managing customers, interactions, and follow-ups.",
};

// The root layout wraps every page with the app shell:
// sidebar on the left (or MobileNav on phones), top bar, then the page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-page font-sans text-ink">
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
