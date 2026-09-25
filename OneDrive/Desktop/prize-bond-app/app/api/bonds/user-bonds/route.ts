import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";
import { getCurrentUser } from "@/lib/auth";
import { isValidBondNumber, expandBondRange, DENOMINATIONS } from "@/lib/prize-bonds";
import type { Denomination } from "@/types";

/** GET /api/bonds/user-bonds — list saved bonds + run the wallet-wide winner check. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const bondsResult = await turso.execute({
      sql: "SELECT id, denomination, bond_number, created_at FROM user_bonds WHERE user_id = ? ORDER BY created_at DESC",
      args: [user.userId],
    });

    // Single JOIN query matching this user's bonds against winning_draws.
    const winsResult = await turso.execute({
      sql: `SELECT ub.id as user_bond_id, ub.bond_number, ub.denomination,
                   wd.draw_number, wd.draw_date, wd.prize_position, wd.prize_amount
            FROM user_bonds ub
            JOIN winning_draws wd
              ON wd.denomination = ub.denomination AND wd.winning_number = ub.bond_number
            WHERE ub.user_id = ?`,
      args: [user.userId],
    });

    const totalPrizeAmount = winsResult.rows.reduce(
      (sum, row) => sum + Number(row.prize_amount ?? 0),
      0
    );

    return NextResponse.json({
      bonds: bondsResult.rows,
      wins: winsResult.rows,
      summary: {
        total_bonds: bondsResult.rows.length,
        total_winning_bonds: new Set(winsResult.rows.map((r) => r.user_bond_id)).size,
        total_prize_amount: totalPrizeAmount,
      },
    });
  } catch (err) {
    console.error("Fetch wallet error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/**
 * POST /api/bonds/user-bonds — add bonds to the wallet.
 * Body (individual numbers): { denomination, bond_numbers: string[] }
 * Body (range):              { denomination, range_from: string, range_to: string }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const denomination = Number(body?.denomination) as Denomination;

    if (!DENOMINATIONS.includes(denomination)) {
      return NextResponse.json({ error: "Invalid denomination." }, { status: 400 });
    }

    let bondNumbers: string[] = [];

    if (body?.range_from && body?.range_to) {
      try {
        bondNumbers = expandBondRange(String(body.range_from), String(body.range_to));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Invalid range.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else if (Array.isArray(body?.bond_numbers)) {
      bondNumbers = body.bond_numbers.map((n: unknown) => String(n));
    } else {
      return NextResponse.json(
        { error: "Provide either bond_numbers or a range_from/range_to pair." },
        { status: 400 }
      );
    }

    const invalid = bondNumbers.filter((n) => !isValidBondNumber(n));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid bond number(s): ${invalid.slice(0, 5).join(", ")}.` },
        { status: 400 }
      );
    }
    if (bondNumbers.length === 0) {
      return NextResponse.json({ error: "No bond numbers to add." }, { status: 400 });
    }

    const statements = bondNumbers.map((bond_number) => ({
      sql: "INSERT OR IGNORE INTO user_bonds (user_id, denomination, bond_number) VALUES (?, ?, ?)",
      args: [user.userId, denomination, bond_number],
    }));

    await turso.batch(statements, "write");

    return NextResponse.json({ added: bondNumbers.length }, { status: 201 });
  } catch (err) {
    console.error("Add bond error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** DELETE /api/bonds/user-bonds?id=123 — remove a single saved bond. */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing bond id." }, { status: 400 });
  }

  try {
    await turso.execute({
      sql: "DELETE FROM user_bonds WHERE id = ? AND user_id = ?",
      args: [id, user.userId],
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete bond error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
