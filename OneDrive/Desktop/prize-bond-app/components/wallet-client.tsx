"use client";

import { useEffect, useState, useCallback, type FormEvent, type ReactNode } from "react";
import { PlusCircle, RefreshCcw, Trash2, Wallet, Trophy, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DENOMINATIONS, formatPkr, parseBondNumberList } from "@/lib/prize-bonds";

interface UserBondRow {
  id: number;
  denomination: number;
  bond_number: string;
  created_at: string;
}

interface WinRow {
  user_bond_id: number;
  bond_number: string;
  denomination: number;
  draw_number: number;
  draw_date: string;
  prize_position: string;
  prize_amount: number;
}

interface Summary {
  total_bonds: number;
  total_winning_bonds: number;
  total_prize_amount: number;
}

type AddMode = "list" | "range";

export function WalletClient() {
  const { toast } = useToast();
  const [bonds, setBonds] = useState<UserBondRow[]>([]);
  const [wins, setWins] = useState<WinRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_bonds: 0,
    total_winning_bonds: 0,
    total_prize_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("list");
  const [denomination, setDenomination] = useState<number>(DENOMINATIONS[0]);
  const [listInput, setListInput] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bonds/user-bonds");
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "Failed to load wallet.");
        return;
      }
      setBonds(data.bonds ?? []);
      setWins(data.wins ?? []);
      setSummary(data.summary ?? summary);
    } catch {
      toast("error", "Network error while loading wallet.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function handleCheckWallet() {
    setChecking(true);
    await loadWallet();
    setChecking(false);
    toast("info", "Wallet re-checked against the latest draw results.");
  }

  async function handleAddBonds(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload =
        addMode === "range"
          ? { denomination, range_from: rangeFrom, range_to: rangeTo }
          : { denomination, bond_numbers: parseBondNumberList(listInput) };

      const res = await fetch("/api/bonds/user-bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error ?? "Failed to add bonds.");
        return;
      }
      toast("success", `Added ${data.added} bond(s) to your wallet.`);
      setListInput("");
      setRangeFrom("");
      setRangeTo("");
      setShowAddForm(false);
      loadWallet();
    } catch {
      toast("error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/bonds/user-bonds?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast("error", "Failed to remove bond.");
        return;
      }
      setBonds((prev) => prev.filter((b) => b.id !== id));
      toast("info", "Bond removed.");
    } catch {
      toast("error", "Network error. Please try again.");
    }
  }

  const winsByBondId = new Map<number, WinRow[]>();
  for (const w of wins) {
    const list = winsByBondId.get(w.user_bond_id) ?? [];
    list.push(w);
    winsByBondId.set(w.user_bond_id, list);
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<Ticket className="h-5 w-5 text-emerald-600" />} label="Bonds Saved" value={summary.total_bonds.toLocaleString()} />
        <SummaryCard icon={<Trophy className="h-5 w-5 text-amber-500" />} label="Winning Bonds" value={summary.total_winning_bonds.toLocaleString()} />
        <SummaryCard icon={<Wallet className="h-5 w-5 text-emerald-600" />} label="Total Prize Amount" value={formatPkr(summary.total_prize_amount)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowAddForm((s) => !s)}>
          <PlusCircle className="h-4 w-4" />
          Add Bonds
        </Button>
        <Button variant="outline" onClick={handleCheckWallet} loading={checking}>
          <RefreshCcw className="h-4 w-4" />
          Check My Wallet
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Bonds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAddMode("list")}
                className={`rounded-lg px-3 py-1.5 text-sm ${addMode === "list" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Individual numbers
              </button>
              <button
                type="button"
                onClick={() => setAddMode("range")}
                className={`rounded-lg px-3 py-1.5 text-sm ${addMode === "range" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Range
              </button>
            </div>

            <form onSubmit={handleAddBonds} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Denomination</label>
                <Select value={denomination} onChange={(e) => setDenomination(Number(e.target.value))}>
                  {DENOMINATIONS.map((d) => (
                    <option key={d} value={d}>
                      Rs. {d.toLocaleString()}
                    </option>
                  ))}
                </Select>
              </div>

              {addMode === "list" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Bond Numbers</label>
                  <Textarea
                    rows={3}
                    placeholder={"482910\n123456, 654321"}
                    value={listInput}
                    onChange={(e) => setListInput(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">From</label>
                    <Input
                      placeholder="001200"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">To</label>
                    <Input
                      placeholder="001250"
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" loading={submitting}>
                Add to Wallet
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Saved Bonds ({bonds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : bonds.length === 0 ? (
            <p className="text-sm text-slate-500">
              You haven&apos;t saved any bonds yet. Click &ldquo;Add Bonds&rdquo; to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 pr-4">Bond Number</th>
                    <th className="pb-2 pr-4">Denomination</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Draws</th>
                    <th className="pb-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {bonds.map((b) => {
                    const bondWins = winsByBondId.get(b.id) ?? [];
                    return (
                      <tr key={b.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono">{b.bond_number}</td>
                        <td className="py-2 pr-4">Rs. {b.denomination.toLocaleString()}</td>
                        <td className="py-2 pr-4">
                          {bondWins.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {bondWins.map((w, i) => (
                                <Badge key={i} variant="success">
                                  {w.prize_position} — {formatPkr(w.prize_amount)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="neutral">No prize</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          {bondWins.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {bondWins.map((w, i) => (
                                <Badge key={i} variant="success">
                                  {w.draw_date} - Draw #{w.draw_number}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="neutral">-</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="rounded-full bg-slate-100 p-3">{icon}</div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
