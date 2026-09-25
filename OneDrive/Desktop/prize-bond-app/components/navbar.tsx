"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function Navbar({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    toast("info", "You have been logged out.");
    router.push("/");
    router.refresh();
  }

  const website_name = process.env.NEXT_PUBLIC_SITE_NAME || "Prize Bond PK";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <Ticket className="h-6 w-6 text-emerald-600" />
          <span>{website_name}</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-600 hover:text-slate-900">
            Check Bonds
          </Link>
          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
          <Link href="/admin" className="flex items-center gap-1 text-slate-400 hover:text-slate-600" title="Admin">
            <ShieldCheck className="h-4 w-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
