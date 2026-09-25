import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";
import { isValidBondNumber, DENOMINATIONS } from "@/lib/prize-bonds";
import type { CheckResult, Denomination, WinningDraw } from "@/types";

/**
 * POST /api/bonds/check
 * Body: { denomination: number, bond_numbers: string[] }
 * Checks a batch of bond numbers (no auth required) against winning_draws.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const denomination = Number(body?.denomination) as Denomination;
    const bondNumbersRaw: unknown = body?.bond_numbers;

    if (!DENOMINATIONS.includes(denomination)) {
      return NextResponse.json({ error: "Invalid denomination." }, { status: 400 });
    }
    if (!Array.isArray(bondNumbersRaw) || bondNumbersRaw.length === 0) {
      return NextResponse.json({ error: "Provide at least one bond number." }, { status: 400 });
    }
    if (bondNumbersRaw.length > 500) {
      return NextResponse.json(
        { error: "Please check at most 500 bond numbers at a time." },
        { status: 400 }
      );
    }

    const bondNumbers: string[] = bondNumbersRaw.map((n) => String(n));
    const invalid = bondNumbers.filter((n) => !isValidBondNumber(n));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid bond number(s): ${invalid.slice(0, 5).join(", ")}. Bond numbers must be exactly 6 digits.` },
        { status: 400 }
      );
    }

    const placeholders = bondNumbers.map(() => "?").join(",");
    const result = await turso.execute({
      sql: `SELECT id, denomination, draw_number, draw_date, winning_number, prize_position, prize_amount
            FROM winning_draws
            WHERE denomination = ? AND winning_number IN (${placeholders})`,
      args: [denomination, ...bondNumbers],
    });

    const winsByNumber = new Map<string, WinningDraw[]>();
    for (const row of result.rows) {
      const draw = row as unknown as WinningDraw;
      const key = String(draw.winning_number);
      const list = winsByNumber.get(key) ?? [];
      list.push(draw);
      winsByNumber.set(key, list);
    }

    const results: CheckResult[] = bondNumbers.map((bond_number) => {
      const matches = winsByNumber.get(bond_number) ?? [];
      return {
        bond_number,
        denomination,
        is_winner: matches.length > 0,
        matches,
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Bond check error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
