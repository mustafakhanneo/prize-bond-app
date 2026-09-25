export type Denomination = 100 | 200 | 750 | 1500 | 25000 | 40000;

export const DENOMINATIONS: Denomination[] = [100, 200, 750, 1500, 25000, 40000];

export type PrizePosition = "1st" | "2nd" | "3rd";

export interface WinningDraw {
  id: number;
  denomination: Denomination;
  draw_number: number;
  draw_date: string;
  winning_number: string;
  prize_position: PrizePosition;
  prize_amount: number;
}

export interface UserBond {
  id: number;
  user_id: string;
  denomination: Denomination;
  bond_number: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface CheckResult {
  bond_number: string;
  denomination: Denomination;
  is_winner: boolean;
  matches: WinningDraw[];
}

export interface ParsedDrawRecord {
  winning_number: string;
  prize_position: PrizePosition;
  index: number;
  /** Prize amount read directly from that section's header text, if found. */
  prize_amount_hint: number | null;
}

/** Summary of one "First/Second/Third Prize" section found in a CDNS file. */
export interface ParsedSection {
  prize_position: PrizePosition;
  header_text: string;
  detected_amount: number | null;
  count: number;
}

export interface CdnsParseResult {
  records: ParsedDrawRecord[];
  sections: ParsedSection[];
  /** True if no "First/Second/Third Prize" headers were found and the
   *  parser fell back to guessing tiers by position — much less reliable. */
  used_fallback: boolean;
}

export interface DashboardSummary {
  total_bonds: number;
  total_winning_bonds: number;
  total_prize_amount: number;
}

export interface DrawInput {
  url: string;
  draw_number: number;
  draw_date: string;
}

export interface ParsedDrawRecor {
  winning_number: string;
  index: number;
  prize_position: PrizePosition;
  prize_amount_hint: number;

  draw_number?: number;
  draw_date?: string;
}

export interface ParsedDrawBatch {
  url: string;
  denomination: Denomination;
  draw_number: number;
  draw_date: string;
  total_parsed: number;
  used_fallback: boolean;
  sections: ParsedSection[];
  records: ParsedDrawRecor[];
}