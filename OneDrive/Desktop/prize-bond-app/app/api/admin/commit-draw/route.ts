import { NextRequest, NextResponse } from "next/server";
import { isValidAdminRequest } from "@/lib/admin-auth";
import { turso } from "@/lib/turso";
import { DENOMINATIONS, PRIZE_AMOUNT_TABLE } from "@/lib/prize-bonds";
import type { Denomination, ParsedDrawRecord, PrizePosition } from "@/types";

/**
 * POST /api/admin/commit-draw
 * Body: { denomination, draw_number, draw_date, records: ParsedDrawRecord[],
 *          amount_overrides?: Partial<Record<PrizePosition, number>> }
 * Bulk-inserts the (admin-reviewed) parsed records into winning_draws using
 * INSERT OR IGNORE so re-commits of the same draw are safe no-ops.
 *
 * Amount precedence per record, highest first:
 *   1. amount_overrides[position]   — admin manually typed/edited a value
 *   2. record.prize_amount_hint     — amount read directly from the CDNS
 *                                      section header (e.g. "Rs 9300/-each")
 *   3. PRIZE_AMOUNT_TABLE fallback  — used only if neither of the above exists
 */
export async function POST(req: NextRequest) {
  if (!isValidAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const denomination = Number(body?.denomination) as Denomination;
    const drawNumber = Number(body?.draw_number);
    const drawDate = String(body?.draw_date ?? "").trim();
    const records = body?.records as ParsedDrawRecord[] | undefined;
    const amountOverrides = (body?.amount_overrides ?? {}) as Partial<Record<PrizePosition, number>>;

    if (!DENOMINATIONS.includes(denomination)) {
      return NextResponse.json({ error: "Invalid denomination." }, { status: 400 });
    }
    if (!Number.isFinite(drawNumber) || drawNumber <= 0) {
      return NextResponse.json({ error: "Invalid draw number." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(drawDate)) {
      return NextResponse.json({ error: "Draw date must be in YYYY-MM-DD format." }, { status: 400 });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records to commit." }, { status: 400 });
    }

    const fallbackTable = PRIZE_AMOUNT_TABLE[denomination];

    const statements = records.map((record) => {
      const override = amountOverrides[record.prize_position];
      const amount =
        override ?? record.prize_amount_hint ?? fallbackTable[record.prize_position] ?? 0;

      return {
        sql: `INSERT OR IGNORE INTO winning_draws
                (denomination, draw_number, draw_date, winning_number, prize_position, prize_amount)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [denomination, drawNumber, drawDate, record.winning_number, record.prize_position, amount],
      };
    });

    await turso.batch(statements, "write");

    return NextResponse.json({ committed: statements.length }, { status: 201 });
  } catch (err) {
    console.error("Commit draw error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
