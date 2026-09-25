import { NextRequest, NextResponse } from "next/server";

import { isValidAdminRequest } from "@/lib/admin-auth";

import {
  parseCdnsText,
  DENOMINATIONS,
} from "@/lib/prize-bo";

import type {
  Denomination,
  ParsedDrawRecord,
} from "@/types";

interface DrawInput {
  url: string;
  draw_number: number;
  draw_date: string;
}

interface ParsedRecordWithDraw
  extends ParsedDrawRecord {
  draw_number: number;
  draw_date: string;
}

interface SuccessfulDrawResult {
  success: true;
  url: string;
  denomination: Denomination;
  draw_number: number;
  draw_date: string;
  total_parsed: number;
  used_fallback: boolean;
  sections: ReturnType<
    typeof parseCdnsText
  >["sections"];
  records: ParsedRecordWithDraw[];
}

interface FailedDrawResult {
  success: false;
  url: string;
  draw_number: number;
  draw_date: string;
  error: string;
}

type DrawResult =
  | SuccessfulDrawResult
  | FailedDrawResult;

/**
 * POST /api/admin/parse-draw
 *
 * Body:
 *
 * {
 *   denomination: 750,
 *   draws: [
 *     {
 *       url: "...",
 *       draw_number: 105,
 *       draw_date: "2026-03-16"
 *     },
 *     {
 *       url: "...",
 *       draw_number: 106,
 *       draw_date: "2026-06-15"
 *     }
 *   ]
 * }
 *
 * Fetches and parses ALL supplied CDNS files
 * concurrently.
 *
 * Does NOT write to the database.
 */
export async function POST(
  req: NextRequest
) {
  if (!isValidAdminRequest(req)) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await req.json();

    const denomination =
      Number(
        body?.denomination
      ) as Denomination;

    const draws =
      body?.draws as DrawInput[];

    /*
     * Validate denomination
     */
    if (
      !DENOMINATIONS.includes(
        denomination
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid denomination.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate draws array
     */
    if (
      !Array.isArray(draws) ||
      draws.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one draw is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Prevent accidental gigantic requests.
     *
     * You can increase this later if necessary.
     */
    if (draws.length > 50) {
      return NextResponse.json(
        {
          error:
            "Maximum 50 draws can be parsed at once.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate every draw BEFORE
     * making network requests.
     */
    for (
      let i = 0;
      i < draws.length;
      i++
    ) {
      const draw = draws[i];

      if (
        !draw ||
        typeof draw.url !==
          "string" ||
        !draw.url.trim() ||
        !/^https?:\/\//i.test(
          draw.url.trim()
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid CDNS URL for draw ${i + 1}.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isFinite(
          draw.draw_number
        ) ||
        draw.draw_number <= 0
      ) {
        return NextResponse.json(
          {
            error: `Invalid draw number for draw ${i + 1}.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          draw.draw_date
        )
      ) {
        return NextResponse.json(
          {
            error: `Invalid draw date for draw ${i + 1}. Use YYYY-MM-DD.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Fetch and parse every URL at once.
     *
     * Promise.allSettled is used instead of
     * Promise.all so one broken CDNS URL does
     * NOT destroy the successful results.
     */
    const settledResults =
      await Promise.allSettled(
        draws.map(
          async (
            draw
          ): Promise<DrawResult> => {
            const url =
              draw.url.trim();

            try {
              console.log(
                `[CDNS] Fetching draw ${draw.draw_number}: ${url}`
              );

              const response =
                await fetch(url, {
                  headers: {
                    "User-Agent":
                      "PrizeBondChecker/1.0",
                  },

                  /*
                   * CDNS files can sometimes
                   * take time to respond.
                   */
                  signal:
                    AbortSignal.timeout(
                      15000
                    ),
                });

              if (
                !response.ok
              ) {
                return {
                  success: false,
                  url,
                  draw_number:
                    draw.draw_number,
                  draw_date:
                    draw.draw_date,
                  error: `Failed to fetch CDNS URL (HTTP ${response.status}).`,
                };
              }

              const rawText =
                await response.text();

              console.log(
                `[CDNS] Parsing draw ${draw.draw_number}`
              );

              const parsed =
                parseCdnsText(
                  rawText,
                  denomination
                );

              if (
                parsed.records
                  .length === 0
              ) {
                return {
                  success: false,
                  url,
                  draw_number:
                    draw.draw_number,
                  draw_date:
                    draw.draw_date,
                  error:
                    "No 6-digit bond numbers were found in the fetched file.",
                };
              }

              /*
               * Attach draw metadata to every
               * parsed winning number.
               *
               * This is what allows multiple
               * draws to exist inside one preview.
               */
              const records: ParsedRecordWithDraw[] =
                parsed.records.map(
                  (record) => ({
                    ...record,
                    draw_number:
                      draw.draw_number,
                    draw_date:
                      draw.draw_date,
                  })
                );

              return {
                success: true,
                url,
                denomination,
                draw_number:
                  draw.draw_number,
                draw_date:
                  draw.draw_date,
                total_parsed:
                  records.length,
                used_fallback:
                  parsed.used_fallback,
                sections:
                  parsed.sections,
                records,
              };
            } catch (error) {
              console.error(
                `[CDNS] Error parsing draw ${draw.draw_number}:`,
                error
              );

              return {
                success: false,
                url,
                draw_number:
                  draw.draw_number,
                draw_date:
                  draw.draw_date,
                error:
                  "Could not reach or parse this CDNS URL. It may be offline or the link may be incorrect.",
              };
            }
          }
        )
      );

    /*
     * Convert Promise.allSettled results
     * into normal draw results.
     */
    const results: DrawResult[] =
      settledResults.map(
        (result, index) => {
          if (
            result.status ===
            "fulfilled"
          ) {
            return result.value;
          }

          const draw =
            draws[index];

          return {
            success: false,
            url: draw.url,
            draw_number:
              draw.draw_number,
            draw_date:
              draw.draw_date,
            error:
              "Unexpected error while processing this draw.",
          };
        }
      );

    /*
     * Successful draws
     */
    const successful =
      results.filter(
        (
          result
        ): result is SuccessfulDrawResult =>
          result.success
      );

    /*
     * Failed draws
     */
    const failed =
      results.filter(
        (
          result
        ): result is FailedDrawResult =>
          !result.success
      );

    /*
     * Combine all records into ONE preview.
     */
    const combinedRecords =
      successful.flatMap(
        (result) =>
          result.records
      );

    /*
     * Re-index records globally.
     *
     * Each individual parser starts its
     * index at 0, so we need a new unique
     * index for the combined preview.
     */
    const preview =
      combinedRecords.map(
        (record, index) => ({
          ...record,
          index,
        })
      );

    /*
     * Any file using fallback causes
     * the overall warning to appear.
     */
    const usedFallback =
      successful.some(
        (result) =>
          result.used_fallback
      );

    return NextResponse.json({
      denomination,

      total_draws:
        draws.length,

      successful_draws:
        successful.length,

      failed_draws:
        failed.length,

      total_parsed:
        preview.length,

      /*
       * Full per-draw result.
       * Useful for showing/debugging failed
       * URLs on the frontend.
       */
      draws: results,

      failed,

      /*
       * Combined records from ALL successful
       * draws.
       */
      preview,

      usedFallback,
    });
  } catch (err) {
    console.error(
      "Batch parse draw error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}