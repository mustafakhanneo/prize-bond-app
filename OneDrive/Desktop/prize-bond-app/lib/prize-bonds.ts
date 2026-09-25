import type {
  CdnsParseResult,
  Denomination,
  ParsedDrawRecord,
  ParsedSection,
  PrizePosition,
} from "@/types";

export const DENOMINATIONS: Denomination[] = [
  100,
  200,
  750,
  1500,
  25000,
  40000,
];

/**
 * Reference prize amounts (PKR)
 * by denomination and prize position.
 */
export const PRIZE_AMOUNT_TABLE: Record<
  Denomination,
  Record<PrizePosition, number>
> = {
  100: {
    "1st": 700000,
    "2nd": 200000,
    "3rd": 1000,
  },

  200: {
    "1st": 1500000,
    "2nd": 500000,
    "3rd": 1850,
  },

  750: {
    "1st": 1500000,
    "2nd": 500000,
    "3rd": 9300,
  },

  1500: {
    "1st": 3000000,
    "2nd": 1000000,
    "3rd": 18500,
  },

  25000: {
    "1st": 40000000,
    "2nd": 15000000,
    "3rd": 312500,
  },

  40000: {
    "1st": 80000000,
    "2nd": 30000000,
    "3rd": 500000,
  },
};

/**
 * Matches exactly 6-digit numbers.
 *
 * Examples:
 *
 * 355591
 * 081180
 * 000752
 *
 * Word boundaries prevent matching part
 * of a larger number.
 */
const SIX_DIGIT_RE =
  /\b\d{6}\b/g;

/**
 * Validates that a string is a
 * well-formed 6-digit bond number.
 */
export function isValidBondNumber(
  value: string
): boolean {
  return /^\d{6}$/.test(
    value.trim()
  );
}

/**
 * Normalizes a bond number.
 *
 * Examples:
 *
 * "123"    -> "000123"
 * "81180"  -> "081180"
 * "355591" -> "355591"
 */
export function normalizeBondNumber(
  value: string
): string {
  const trimmed =
    value.trim();

  if (
    /^\d+$/.test(
      trimmed
    ) &&
    trimmed.length <= 6
  ) {
    return trimmed.padStart(
      6,
      "0"
    );
  }

  return trimmed;
}

/**
 * Splits user-entered bond numbers.
 */
export function parseBondNumberList(
  input: string
): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) =>
      s.trim()
    )
    .filter(
      (s) =>
        s.length > 0
    )
    .map(
      normalizeBondNumber
    );
}

/**
 * Expands a "from"–"to" range
 * inclusive.
 */
export function expandBondRange(
  from: string,
  to: string
): string[] {
  const start =
    parseInt(from, 10);

  const end =
    parseInt(to, 10);

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start > end
  ) {
    throw new Error(
      "Invalid range: 'from' must be a number less than or equal to 'to'."
    );
  }

  if (
    end - start >
    5000
  ) {
    throw new Error(
      "Range too large: please limit ranges to 5,000 numbers at a time."
    );
  }

  const result: string[] =
    [];

  for (
    let n = start;
    n <= end;
    n++
  ) {
    result.push(
      String(n).padStart(
        6,
        "0"
      )
    );
  }

  return result;
}

/**
 * Extracts ALL 6-digit numbers from
 * the text in their original order.
 *
 * Duplicates are removed while the
 * original first-seen order is preserved.
 */
function extractSixDigitNumbers(
  text: string
): string[] {
  const matches =
    text.match(
      SIX_DIGIT_RE
    ) ?? [];

  const seen =
    new Set<string>();

  const ordered: string[] =
    [];

  for (const number of matches) {
    if (
      seen.has(number)
    ) {
      continue;
    }

    seen.add(number);
    ordered.push(number);
  }

  return ordered;
}

/**
 * Determines the prize position
 * purely from the extracted number's
 * position.
 *
 * Sequence:
 *
 * 0        -> 1st prize
 * 1,2,3    -> 2nd prize
 * 4+       -> 3rd prize
 */
function getPrizePosition(
  index: number
): PrizePosition {
  if (index === 0) {
    return "1st";
  }

  if (index <= 3) {
    return "2nd";
  }

  return "3rd";
}

/**
 * Parses one CDNS draw text file.
 *
 * The parser itself is intentionally
 * independent of draw number/date.
 *
 * Multiple files are handled by the
 * API route, which attaches:
 *
 * - draw_number
 * - draw_date
 *
 * to every returned record.
 */
export function parseCdnsText(
  rawText: string,
  denomination: Denomination
): CdnsParseResult {
  const numbers =
    extractSixDigitNumbers(
      rawText
    );

  const records: ParsedDrawRecord[] =
    numbers.map(
      (
        winning_number,
        index
      ) => {
        const prize_position =
          getPrizePosition(
            index
          );

        return {
          winning_number,

          index,

          prize_position,

          prize_amount_hint:
            PRIZE_AMOUNT_TABLE[
              denomination
            ][
              prize_position
            ],
        };
      }
    );

  /*
   * The parser uses the known denomination
   * prize table for the amount.
   *
   * This means the frontend can display
   * the correct expected amount even when
   * the CDNS text formatting changes.
   */
  const sections: ParsedSection[] =
    [
      {
        prize_position:
          "1st",

        header_text:
          "First prize",

        detected_amount:
          PRIZE_AMOUNT_TABLE[
            denomination
          ]["1st"],

        count:
          numbers.length >=
          1
            ? 1
            : 0,
      },

      {
        prize_position:
          "2nd",

        header_text:
          "Second prize",

        detected_amount:
          PRIZE_AMOUNT_TABLE[
            denomination
          ]["2nd"],

        count: Math.min(
          Math.max(
            numbers.length -
              1,
            0
          ),
          3
        ),
      },

      {
        prize_position:
          "3rd",

        header_text:
          "Third prize",

        detected_amount:
          PRIZE_AMOUNT_TABLE[
            denomination
          ]["3rd"],

        count:
          Math.max(
            numbers.length -
              4,
            0
          ),
      },
    ];

  return {
    records,

    sections,

    /*
     * The current parser intentionally
     * assigns tiers based on position.
     */
    used_fallback: false,
  };
}

/**
 * Formats an integer amount
 * as PKR currency.
 */
export function formatPkr(
  amount: number
): string {
  return new Intl.NumberFormat(
    "en-PK",
    {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}