import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pakistani Prize Bond Checker & Wallet Tracker",
  description:
    "Check your Pakistani prize bonds against official CDNS draw results and track your bonds in a personal wallet.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <head>
        <link
  rel="icon"
  href="/icon?<generated>"
  type="image/<generated>"
  sizes="<generated>"
/>
<meta name="google-site-verification" content="bcBPmPxBCrCW21e6a8IrzqmfBsBy7PM6cqPV46g3w7I" />
<meta name="msvalidate.01" content="32D39459ECC60DB8B84C29317DC629F4" />
<meta property="og:image" content="<generated>" />
<meta property="og:image:alt" content="Prize bond checker" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased">
        <ToastProvider>
          <Navbar isAuthed={!!user} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            For informational purposes only. Always verify results against official CDNS draw
            lists before claiming a prize.
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
