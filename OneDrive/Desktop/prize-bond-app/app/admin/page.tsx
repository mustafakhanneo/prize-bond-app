"use client";

import { useState, type FormEvent } from "react";
import { Lock, DownloadCloud, UploadCloud, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { DENOMINATIONS, formatPkr } from "@/lib/prize-bonds";
import { ADMIN_HEADER } from "@/lib/admin-auth";
import type { ParsedDrawRecord, ParsedSection, PrizePosition } from "@/types";

const TIER_BADGE_VARIANT: Record<PrizePosition, "success" | "warning" | "neutral"> = {
  "1st": "success",
  "2nd": "warning",
  "3rd": "neutral",
};

export default function AdminPage() {
  const { toast } = useToast();
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [url, setUrl] = useState("");
  const [denomination, setDenomination] = useState<number>(DENOMINATIONS[0]);
  const [drawNumber, setDrawNumber] = useState("");
  const [drawDate, setDrawDate] = useState("");

  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<ParsedDrawRecord[] | null>(null);
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [amountOverrides, setAmountOverrides] = useState<Partial<Record<PrizePosition, string>>>({});

  function handleUnlock(e: FormEvent) {
    e.preventDefault();
    if (!passcode) {
      toast("error", "Enter the admin passcode.");
      return;
    }
    setUnlocked(true);
  }

  async function handleParse() {
    if (!url || !drawNumber || !drawDate) {
      toast("error", "Fill in the CDNS URL, draw number, and draw date.");
      return;
    }
    setParsing(true);
    setPreview(null);
    setSections([]);
    setAmountOverrides({});
    try {
      const res = await fetch("/api/admin/parse-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ADMIN_HEADER]: passcode },
        body: JSON.stringify({ url, denomination, draw_number: Number(drawNumber), draw_date: drawDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setUnlocked(false);
        toast("error", data.error ?? "Failed to parse draw file.");
        return;
      }
      setPreview(data.preview);
      setSections(data.sections ?? []);
      setUsedFallback(!!data.used_fallback);
      if (data.used_fallback) {
        toast("info", `Parsed ${data.total_parsed} number(s), but no "Prize" headers were found — tiers are a rough guess.`);
      } else {
        toast("success", `Parsed ${data.total_parsed} bond number(s) across ${data.sections?.length ?? 0} section(s).`);
      }
    } catch {
      toast("error", "Network error while parsing.");
    } finally {
      setParsing(false);
    }
  }

  async function handleCommit() {
    if (!preview || preview.length === 0) return;
    setCommitting(true);
    try {
      const overridesAsNumbers: Partial<Record<PrizePosition, number>> = {};
      for (const [position, value] of Object.entries(amountOverrides)) {
        if (value && value.trim() !== "") {
          overridesAsNumbers[position as PrizePosition] = Number(value);
        }
      }

      const res = await fetch("/api/admin/commit-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ADMIN_HEADER]: passcode },
        body: JSON.stringify({
          denomination,
          draw_number: Number(drawNumber),
          draw_date: drawDate,
          records: preview,
          amount_overrides: overridesAsNumbers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setUnlocked(false);
        toast("error", data.error ?? "Failed to commit draw.");
        return;
      }
      toast("success", `Committed ${data.committed} record(s) to the database.`);
      setPreview(null);
      setSections([]);
      setAmountOverrides({});
      setUrl("");
      setDrawNumber("");
      setDrawDate("");
    } catch {
      toast("error", "Network error while committing.");
    } finally {
      setCommitting(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Draw Ingestion Portal</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fetch &amp; Parse CDNS Text File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">CDNS URL</label>
            <Input
              placeholder="https://savings.gov.pk/wp-content/uploads/2026/01/DRAW-RESULT-OF-RS.-750-DENOMINATION-105.txt"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Draw Number</label>
              <Input
                type="number"
                placeholder="105"
                value={drawNumber}
                onChange={(e) => setDrawNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Draw Date</label>
              <Input type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleParse} loading={parsing}>
            <DownloadCloud className="h-4 w-4" />
            Fetch &amp; Parse CDNS Text File
          </Button>
        </CardContent>
      </Card>

      {usedFallback && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            No &ldquo;First / Second / Third Prize&rdquo; headers were found in this file, so tiers
            below were guessed by position instead. Double-check every number against the source
            file before uploading, or fix the URL if this looks wrong.
          </p>
        </div>
      )}

      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Prize Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-slate-500">
              Amounts below were read directly from each section&apos;s header text in the file.
              Override any of them if they look wrong before committing.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {sections.map((s) => (
                <div key={s.prize_position} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant={TIER_BADGE_VARIANT[s.prize_position]}>{s.prize_position} Prize</Badge>
                    <span className="text-xs text-slate-400">{s.count} numbers</span>
                  </div>
                  <p className="mb-2 truncate text-xs text-slate-500" title={s.header_text}>
                    {s.header_text}
                  </p>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Prize amount (PKR)
                    {s.detected_amount != null && (
                      <span className="ml-1 font-normal text-slate-400">
                        detected: {formatPkr(s.detected_amount)}
                      </span>
                    )}
                  </label>
                  <Input
                    type="number"
                    placeholder={s.detected_amount != null ? String(s.detected_amount) : "e.g. 9300"}
                    value={amountOverrides[s.prize_position] ?? ""}
                    onChange={(e) =>
                      setAmountOverrides((prev) => ({ ...prev, [s.prize_position]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({preview.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Bond Number</th>
                    <th className="px-3 py-2">Prize Tier</th>
                    <th className="px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => {
                    const override = amountOverrides[r.prize_position];
                    const effectiveAmount =
                      override && override.trim() !== "" ? Number(override) : r.prize_amount_hint;
                    return (
                      <tr key={r.index} className="border-b border-slate-100">
                        <td className="px-3 py-1.5 text-slate-400">{r.index + 1}</td>
                        <td className="px-3 py-1.5 font-mono">{r.winning_number}</td>
                        <td className="px-3 py-1.5">
                          <Badge variant={TIER_BADGE_VARIANT[r.prize_position]}>{r.prize_position}</Badge>
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {effectiveAmount != null ? formatPkr(effectiveAmount) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Button className="mt-4" onClick={handleCommit} loading={committing}>
              <UploadCloud className="h-4 w-4" />
              Confirm &amp; Upload to Turso Database
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
