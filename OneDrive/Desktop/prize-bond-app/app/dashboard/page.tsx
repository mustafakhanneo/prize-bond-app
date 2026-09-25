import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WalletClient } from "@/components/wallet-client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>
        <p className="text-sm text-slate-500">Signed in as {user.email}</p>
      </div>
      <WalletClient />
    </div>
  );
}
