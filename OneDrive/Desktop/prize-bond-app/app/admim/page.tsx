"use client";

import { useState, type FormEvent } from "react";
import {
  Lock,
  DownloadCloud,
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

import {
  DENOMINATIONS,
  formatPkr,
} from "@/lib/prize-bonds";

import { ADMIN_HEADER } from "@/lib/admin-auth";

import type {
  ParsedDrawRecord,
  ParsedSection,
  PrizePosition,
} from "@/types";

const TIER_BADGE_VARIANT: Record<
  PrizePosition,
  "success" | "warning" | "neutral"
> = {
  "1st": "success",
  "2nd": "warning",
  "3rd": "neutral",
};

type DrawInput = {
  id: number;
  url: string;
  draw_number: string;
  draw_date: string;
};

type ParsedRecordWithDraw = ParsedDrawRecord & {
  draw_number: number;
  draw_date: string;
};

export default function AdminPage() {
  const { toast } = useToast();

  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const [denomination, setDenomination] = useState<number>(
    DENOMINATIONS[0]
  );

  const [draws, setDraws] = useState<DrawInput[]>([
    {
      id: 1,
      url: "",
      draw_number: "",
      draw_date: "",
    },
  ]);

  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [preview, setPreview] = useState<
    ParsedRecordWithDraw[] | null
  >(null);

  const [sections, setSections] = useState<ParsedSection[]>(
    []
  );

  const [usedFallback, setUsedFallback] =
    useState(false);

  const [amountOverrides, setAmountOverrides] =
    useState<
      Partial<Record<PrizePosition, string>>
    >({});

  function handleUnlock(e: FormEvent) {
    e.preventDefault();

    if (!passcode) {
      toast(
        "error",
        "Enter the admin passcode."
      );
      return;
    }

    setUnlocked(true);
  }

  function addDraw() {
    setDraws((prev) => [
      ...prev,
      {
        id: Date.now(),
        url: "",
        draw_number: "",
        draw_date: "",
      },
    ]);
  }

  function removeDraw(id: number) {
    setDraws((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter(
        (draw) => draw.id !== id
      );
    });
  }

  function updateDraw(
    id: number,
    field: keyof Omit<DrawInput, "id">,
    value: string
  ) {
    setDraws((prev) =>
      prev.map((draw) =>
        draw.id === id
          ? {
              ...draw,
              [field]: value,
            }
          : draw
      )
    );
  }

  async function handleParse() {
    if (draws.length === 0) {
      toast(
        "error",
        "Add at least one draw."
      );
      return;
    }

    const invalidDraw = draws.find(
      (draw) =>
        !draw.url.trim() ||
        !draw.draw_number ||
        !draw.draw_date
    );

    if (invalidDraw) {
      toast(
        "error",
        "Fill in URL, draw number, and draw date for every draw."
      );
      return;
    }

    setParsing(true);
    setPreview(null);
    setSections([]);
    setAmountOverrides({});
    setUsedFallback(false);

    try {
      const res = await fetch(
        "/api/admin/parse-dra",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [ADMIN_HEADER]: passcode,
          },
          body: JSON.stringify({
            denomination,

            draws: draws.map((draw) => ({
              url: draw.url.trim(),
              draw_number: Number(
                draw.draw_number
              ),
              draw_date: draw.draw_date,
            })),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setUnlocked(false);
        }

        toast(
          "error",
          data.error ??
            "Failed to parse draws."
        );

        return;
      }

      const parsedPreview =
        (data.preview ??
          []) as ParsedRecordWithDraw[];

      setPreview(parsedPreview);

      /*
       * Since all uploaded draws have the same
       * denomination, prize amounts are the same
       * for every draw.
       *
       * Build one combined section summary.
       */
      const prizePositions: PrizePosition[] = [
        "1st",
        "2nd",
        "3rd",
      ];

      const aggregatedSections: ParsedSection[] =
        prizePositions.map((position) => {
          const matchingRecords =
            parsedPreview.filter(
              (record) =>
                record.prize_position ===
                position
            );

          const firstRecord =
            matchingRecords[0];

          return {
            prize_position: position,
            header_text:
              position === "1st"
                ? "First prize"
                : position === "2nd"
                  ? "Second prize"
                  : "Third prize",
            detected_amount:
              firstRecord?.prize_amount_hint ??
              null,
            count: matchingRecords.length,
          };
        });

      setSections(aggregatedSections);

      setUsedFallback(
        Boolean(data.used_fallback)
      );

      if (data.failed_draws > 0) {
        toast(
          "info",
          `Parsed ${data.successful_draws}/${data.total_draws} draws. ${data.failed_draws} draw(s) failed.`
        );
      } else {
        toast(
          "success",
          `Parsed ${data.total_parsed} bond number(s) from ${data.successful_draws} draw(s).`
        );
      }
    } catch (error) {
      console.error(
        "Batch parse error:",
        error
      );

      toast(
        "error",
        "Network error while parsing."
      );
    } finally {
      setParsing(false);
    }
  }

  async function handleCommit() {
    if (!preview || preview.length === 0) {
      return;
    }

    setCommitting(true);

    try {
      const overridesAsNumbers: Partial<
        Record<PrizePosition, number>
      > = {};

      for (const [
        position,
        value,
      ] of Object.entries(amountOverrides)) {
        if (
          value &&
          value.trim() !== ""
        ) {
          const numberValue =
            Number(value);

          if (
            Number.isFinite(
              numberValue
            ) &&
            numberValue >= 0
          ) {
            overridesAsNumbers[
              position as PrizePosition
            ] = numberValue;
          }
        }
      }

      const res = await fetch(
        "/api/admin/commit-dra",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [ADMIN_HEADER]: passcode,
          },
          body: JSON.stringify({
            denomination,

            /*
             * Keep the complete draw metadata.
             * The records themselves also contain
             * draw_number and draw_date.
             */
            draws: draws.map((draw) => ({
              url: draw.url.trim(),
              draw_number: Number(
                draw.draw_number
              ),
              draw_date: draw.draw_date,
            })),

            records: preview,

            amount_overrides:
              overridesAsNumbers,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setUnlocked(false);
        }

        toast(
          "error",
          data.error ??
            "Failed to commit draws."
        );

        return;
      }

      toast(
        "success",
        `Committed ${data.committed} record(s) to the database.`
      );

      setPreview(null);
      setSections([]);
      setAmountOverrides({});
      setUsedFallback(false);

      setDraws([
        {
          id: Date.now(),
          url: "",
          draw_number: "",
          draw_date: "",
        },
      ]);
    } catch (error) {
      console.error(
        "Commit error:",
        error
      );

      toast(
        "error",
        "Network error while committing."
      );
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
            <form
              onSubmit={handleUnlock}
              className="space-y-4"
            >
              <Input
                type="password"
                placeholder="Admin passcode"
                value={passcode}
                onChange={(e) =>
                  setPasscode(
                    e.target.value
                  )
                }
              />

              <Button
                type="submit"
                className="w-full"
              >
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
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />

        <h1 className="text-2xl font-bold text-slate-900">
          Draw Ingestion Portal
        </h1>
      </div>

      {/* Fetch / Parse Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fetch &amp; Parse CDNS Text Files
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Denomination */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Denomination
            </label>

            <Select
              value={denomination}
              onChange={(e) =>
                setDenomination(
                  Number(
                    e.target.value
                  )
                )
              }
            >
              {DENOMINATIONS.map(
                (d) => (
                  <option
                    key={d}
                    value={d}
                  >
                    Rs.{" "}
                    {d.toLocaleString()}
                  </option>
                )
              )}
            </Select>

            <p className="mt-1 text-xs text-slate-500">
              All draws in this batch
              must use the same
              denomination.
            </p>
          </div>

          {/* Draws */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-slate-900">
                  Draw Files
                </h3>

                <p className="text-xs text-slate-500">
                  Add multiple draws.
                  All files will be
                  fetched and parsed
                  simultaneously.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDraw}
              >
                <Plus className="h-4 w-4" />
                Add Draw
              </Button>
            </div>

            {draws.map(
              (
                draw,
                index
              ) => (
                <div
                  key={draw.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Draw{" "}
                      {index + 1}
                    </span>

                    {draws.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeDraw(
                            draw.id
                          )
                        }
                        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1fr_140px_180px]">
                    {/* URL */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        CDNS URL
                      </label>

                      <Input
                        placeholder="https://savings.gov.pk/.../DRAW-RESULT-OF-RS.-750-DENOMINATION-105.txt"
                        value={
                          draw.url
                        }
                        onChange={(
                          e
                        ) =>
                          updateDraw(
                            draw.id,
                            "url",
                            e.target
                              .value
                          )
                        }
                      />
                    </div>

                    {/* Draw number */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Draw Number
                      </label>

                      <Input
                        type="number"
                        placeholder="105"
                        value={
                          draw.draw_number
                        }
                        onChange={(
                          e
                        ) =>
                          updateDraw(
                            draw.id,
                            "draw_number",
                            e.target
                              .value
                          )
                        }
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Draw Date
                      </label>

                      <Input
                        type="date"
                        value={
                          draw.draw_date
                        }
                        onChange={(
                          e
                        ) =>
                          updateDraw(
                            draw.id,
                            "draw_date",
                            e.target
                              .value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Parse */}
          <Button
            onClick={handleParse}
            loading={parsing}
          >
            <DownloadCloud className="h-4 w-4" />
            Fetch &amp; Parse All Draws
          </Button>
        </CardContent>
      </Card>

      {/* Fallback warning */}
      {usedFallback && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <p>
            No &ldquo;First /
            Second / Third
            Prize&rdquo; headers
            were found in one or
            more files, so tiers
            were assigned by
            position. Double-check
            the numbers against the
            source files before
            uploading.
          </p>
        </div>
      )}

      {/* Sections / Prize Amounts */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Prize Amounts
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="mb-4 text-xs text-slate-500">
              These amounts apply to
              every draw in this batch.
              Override them if needed
              before committing.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {sections.map(
                (section) => (
                  <div
                    key={
                      section.prize_position
                    }
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge
                        variant={
                          TIER_BADGE_VARIANT[
                            section
                              .prize_position
                          ]
                        }
                      >
                        {
                          section.prize_position
                        }{" "}
                        Prize
                      </Badge>

                      <span className="text-xs text-slate-400">
                        {section.count.toLocaleString()}{" "}
                        numbers
                      </span>
                    </div>

                    <p
                      className="mb-2 truncate text-xs text-slate-500"
                      title={
                        section.header_text
                      }
                    >
                      {
                        section.header_text
                      }
                    </p>

                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Prize amount (PKR)

                      {section.detected_amount !=
                        null && (
                        <span className="ml-1 font-normal text-slate-400">
                          detected:{" "}
                          {formatPkr(
                            section.detected_amount
                          )}
                        </span>
                      )}
                    </label>

                    <Input
                      type="number"
                      placeholder={
                        section.detected_amount !=
                        null
                          ? String(
                              section.detected_amount
                            )
                          : "e.g. 9300"
                      }
                      value={
                        amountOverrides[
                          section
                            .prize_position
                        ] ??
                        ""
                      }
                      onChange={(
                        e
                      ) =>
                        setAmountOverrides(
                          (prev) => ({
                            ...prev,
                            [section.prize_position]:
                              e.target
                                .value,
                          })
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>
              Preview (
              {preview.length.toLocaleString()}{" "}
              records)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="max-h-[500px] overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-2">
                      #
                    </th>

                    <th className="px-3 py-2">
                      Draw
                    </th>

                    <th className="px-3 py-2">
                      Date
                    </th>

                    <th className="px-3 py-2">
                      Bond Number
                    </th>

                    <th className="px-3 py-2">
                      Prize Tier
                    </th>

                    <th className="px-3 py-2">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {preview.map(
                    (r, index) => {
                      const override =
                        amountOverrides[
                          r.prize_position
                        ];

                      const effectiveAmount =
                        override &&
                        override.trim() !==
                          ""
                          ? Number(
                              override
                            )
                          : r.prize_amount_hint;

                      return (
                        <tr
                          key={`${r.draw_number}-${r.draw_date}-${r.winning_number}-${index}`}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-1.5 text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-3 py-1.5 font-semibold text-slate-700">
                            {
                              r.draw_number
                            }
                          </td>

                          <td className="px-3 py-1.5 whitespace-nowrap text-slate-500">
                            {
                              r.draw_date
                            }
                          </td>

                          <td className="px-3 py-1.5 font-mono">
                            {
                              r.winning_number
                            }
                          </td>

                          <td className="px-3 py-1.5">
                            <Badge
                              variant={
                                TIER_BADGE_VARIANT[
                                  r.prize_position
                                ]
                              }
                            >
                              {
                                r.prize_position
                              }
                            </Badge>
                          </td>

                          <td className="px-3 py-1.5 text-slate-600">
                            {effectiveAmount !=
                            null
                              ? formatPkr(
                                  effectiveAmount
                                )
                              : "—"}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            <Button
              className="mt-4"
              onClick={
                handleCommit
              }
              loading={
                committing
              }
            >
              <UploadCloud className="h-4 w-4" />
              Confirm &amp; Upload to
              Turso Database
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}