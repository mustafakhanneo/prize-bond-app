import type {
  CdnsParseResult,
  Denomination,
  ParsedDrawRecord,
  ParsedSection,
  PrizePosition,
} from "@/types";

export const DENOMINATIONS: Denomination[] = [100, 200, 750, 1500, 25000, 40000];

/**
 * Reference prize amounts (PKR) by denomination and position.
 */
export const PRIZE_AMOUNT_TABLE: Record<
  Denomination,
  Record<PrizePosition, number>
> = {
  100: { "1st": 700000, "2nd": 200000, "3rd": 1000 },
  200: { "1st": 1500000, "2nd": 500000, "3rd": 1850 },
  750: { "1st": 1500000, "2nd": 500000, "3rd": 9300 },
  1500: { "1st": 3000000, "2nd": 1000000, "3rd": 18500 },
  25000: { "1st": 40000000, "2nd": 15000000, "3rd": 312500 },
  40000: { "1st": 80000000, "2nd": 30000000, "3rd": 500000 },
};

/**
 * Matches exactly 6-digit numbers.
 *
 * Examples:
 * 355591
 * 081180
 * 000752
 *
 * Word boundaries prevent matching part of a larger number.
 */
const SIX_DIGIT_RE = /\b\d{6}\b/g;

/** Validates that a string is a well-formed 6-digit bond number. */
export function isValidBondNumber(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

/** Normalizes a bond number. */
export function normalizeBondNumber(value: string): string {
  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed) && trimmed.length <= 6) {
    return trimmed.padStart(6, "0");
  }

  return trimmed;
}

/** Splits user-entered bond numbers. */
export function parseBondNumberList(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(normalizeBondNumber);
}

/** Expands a "from"–"to" range (inclusive). */
export function expandBondRange(from: string, to: string): string[] {
  const start = parseInt(from, 10);
  const end = parseInt(to, 10);

  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    throw new Error(
      "Invalid range: 'from' must be a number less than or equal to 'to'."
    );
  }

  if (end - start > 5000) {
    throw new Error(
      "Range too large: please limit ranges to 5,000 numbers at a time."
    );
  }

  const result: string[] = [];

  for (let n = start; n <= end; n++) {
    result.push(String(n).padStart(6, "0"));
  }

  return result;
}

/**
 * Extracts ALL 6-digit numbers from the text in their original order.
 *
 * No dependency on:
 * - First Prize headers
 * - Second Prize headers
 * - Third Prize headers
 * - Prize amounts
 * - Formatting
 * - Number of columns
 * - Blank lines
 * - CDNS section names
 *
 * This makes the parser resilient to changes in the CDNS text format.
 */
function extractSixDigitNumbers(text: string): string[] {
  const matches = text.match(SIX_DIGIT_RE) ?? [];

  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const number of matches) {
    if (seen.has(number)) {
      continue;
    }

    seen.add(number);
    ordered.push(number);
  }

  return ordered;
}

/**
 * Determines the prize position purely from the number's
 * position in the extracted sequence.
 *
 * Sequence:
 *
 * 0        -> 1st prize
 * 1,2,3    -> 2nd prize
 * 4+       -> 3rd prize
 */
function getPrizePosition(index: number): PrizePosition {
  if (index === 0) {
    return "1st";
  }

  if (index <= 3) {
    return "2nd";
  }

  return "3rd";
}

/**
 * Parses CDNS draw text.
 *
 * The parser intentionally ignores the document's formatting and
 * section headings.
 *
 * It simply:
 *
 * 1. Finds every 6-digit number.
 * 2. Preserves their order.
 * 3. Assigns:
 *      first number     -> 1st prize
 *      next 3 numbers   -> 2nd prize
 *      remaining        -> 3rd prize
 */
export function parseCdnsText(
  rawText: string,
  denomination: Denomination
): CdnsParseResult {
  const numbers = extractSixDigitNumbers(rawText);

  const records: ParsedDrawRecord[] = numbers.map(
    (winning_number, index) => {
      const prize_position: PrizePosition =
        index === 0
          ? "1st"
          : index <= 3
            ? "2nd"
            : "3rd";

      return {
        winning_number,
        index,
        prize_position,
        prize_amount_hint: PRIZE_AMOUNT_TABLE[denomination][prize_position],
      };
    }
  );

  return {
    records,
    sections: [
      {
        prize_position: "1st",
        header_text: "First prize",
        detected_amount: PRIZE_AMOUNT_TABLE[denomination]["1st"],
        count: numbers.length >= 1 ? 1 : 0,
      },
      {
        prize_position: "2nd",
        header_text: "Second prize",
        detected_amount: PRIZE_AMOUNT_TABLE[denomination]["2nd"],
        count: Math.min(Math.max(numbers.length - 1, 0), 3),
      },
      {
        prize_position: "3rd",
        header_text: "Third prize",
        detected_amount: PRIZE_AMOUNT_TABLE[denomination]["3rd"],
        count: Math.max(numbers.length - 4, 0),
      },
    ],
    used_fallback: false,
  };
}

/** Formats an integer amount as PKR currency for display. */
export function formatPkr(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}