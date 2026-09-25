import { NextRequest, NextResponse } from "next/server";
import { isValidAdminRequest } from "@/lib/admin-auth";
import { parseCdnsText, DENOMINATIONS } from "@/lib/prize-bonds";
import type { Denomination } from "@/types";

/**
 * POST /api/admin/parse-draw
 * Body: { url: string, denomination: number, draw_number: number, draw_date: string }
 * Fetches the raw CDNS text file, extracts 6-digit numbers, and returns a
 * preview with assigned prize tiers. Does NOT write to the database.
 */
export async function POST(req: NextRequest) {
  if (!isValidAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const url = String(body?.url ?? "").trim();
    const denomination = Number(body?.denomination) as Denomination;
    const drawNumber = Number(body?.draw_number);
    const drawDate = String(body?.draw_date ?? "").trim();

    if (!url || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Provide a valid CDNS URL (http/https)." }, { status: 400 });
    }
    if (!DENOMINATIONS.includes(denomination)) {
      return NextResponse.json({ error: "Invalid denomination." }, { status: 400 });
    }
    if (!Number.isFinite(drawNumber) || drawNumber <= 0) {
      return NextResponse.json({ error: "Invalid draw number." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) {
      return NextResponse.json({ error: "Draw date must be in YYYY-MM-DD format." }, { status: 400 });
    }

    let rawText: string;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "PrizeBondChecker/1.0" },
        // CDNS files can be large; avoid hanging forever.
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch CDNS URL (HTTP ${response.status}).` },
          { status: 502 }
        );
      }
      rawText = await response.text();
    } catch (fetchErr) {
      console.error("CDNS fetch error:", fetchErr);
      return NextResponse.json(
        { error: "Could not reach the CDNS URL. It may be offline or the link may be incorrect." },
        { status: 502 }
      );
    }

    const parsed = parseCdnsText(rawText, denomination);

    if (parsed.records.length === 0) {
      return NextResponse.json(
        { error: "No 6-digit bond numbers were found in the fetched file." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      denomination,
      draw_number: drawNumber,
      draw_date: drawDate,
      total_parsed: parsed.records.length,
      used_fallback: parsed.used_fallback,
      sections: parsed.sections,
      preview: parsed.records,
    });
  } catch (err) {
    console.error("Parse draw error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
