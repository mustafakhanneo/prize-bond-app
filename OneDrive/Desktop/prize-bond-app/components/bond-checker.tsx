"use client";

import { useState } from "react";

import {
  Search,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Textarea,
  Select,
} from "@/components/ui/input";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { useToast } from "@/components/ui/toast";

import {
  DENOMINATIONS,
  formatPkr,
  parseBondNumberList,
} from "@/lib/prize-bonds";

import type {
  CheckResult,
} from "@/types";

export function BondChecker() {
  const { toast } =
    useToast();

  const [
    denomination,
    setDenomination,
  ] = useState<number>(
    DENOMINATIONS[0]
  );

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    results,
    setResults,
  ] = useState<
    CheckResult[] | null
  >(null);

  async function handleCheck() {
    const bondNumbers =
      parseBondNumberList(
        input
      );

    if (
      bondNumbers.length === 0
    ) {
      toast(
        "error",
        "Enter at least one 6-digit bond number."
      );

      return;
    }

    /*
     * Optional protection against
     * accidentally sending an enormous
     * request.
     */
    if (
      bondNumbers.length > 500
    ) {
      toast(
        "error",
        "Please check a maximum of 500 bond numbers at a time."
      );

      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res =
        await fetch(
          "/api/bonds/check",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              denomination,

              bond_numbers:
                bondNumbers,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        toast(
          "error",
          data.error ??
            "Something went wrong."
        );

        return;
      }

      const checkedResults =
        data.results as CheckResult[];

      setResults(
        checkedResults
      );

      const winners =
        checkedResults.filter(
          (result) =>
            result.is_winner
        ).length;

      if (
        winners > 0
      ) {
        toast(
          "success",
          `🎉 ${winners} winning bond(s) found!`
        );
      } else {
        toast(
          "info",
          "No winners found among the numbers checked."
        );
      }
    } catch {
      toast(
        "error",
        "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="bond-checker"
      aria-labelledby="checker-title"
    >
      <Card>
        <CardContent className="space-y-5 p-6 sm:p-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-600" />

              <h2
                id="checker-title"
                className="text-xl font-semibold text-slate-900"
              >
                Quick Prize Bond
                Checker
              </h2>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter one or more six-digit
              Pakistani prize bond numbers
              separated by commas or new
              lines.
            </p>
          </div>

          {/* Form */}
          <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
            {/* Denomination */}
            <div>
              <label
                htmlFor="bond-denomination"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Denomination
              </label>

              <Select
                id="bond-denomination"
                value={
                  denomination
                }
                onChange={(e) =>
                  setDenomination(
                    Number(
                      e.target
                        .value
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
            </div>

            {/* Bond numbers */}
            <div>
              <label
                htmlFor="bond-numbers"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Bond Number(s)
              </label>

              <Textarea
                id="bond-numbers"
                rows={5}
                placeholder={
                  "482910\n123456, 654321"
                }
                value={input}
                onChange={(e) =>
                  setInput(
                    e.target.value
                  )
                }
              />

              <p className="mt-1 text-xs text-slate-400">
                Example: 482910 or
                multiple numbers separated
                by commas/new lines.
              </p>
            </div>
          </div>

          {/* Button */}
          <Button
            onClick={
              handleCheck
            }
            loading={loading}
            className="w-full sm:w-auto"
          >
            <Search className="h-4 w-4" />
            Check Bonds
          </Button>

          {/* Results */}
          {results && (
            <div
              className="mt-6 space-y-3"
              aria-live="polite"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Check Results
                </h3>

                <span className="text-xs text-slate-500">
                  {results.length}{" "}
                  bond
                  {results.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  checked
                </span>
              </div>

              {results.map(
                (r) => (
                  <div
                    key={
                      r.bond_number
                    }
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
                      r.is_winner
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {
                          r.bond_number
                        }
                      </span>

                      <span className="text-xs text-slate-500">
                        Rs.{" "}
                        {r.denomination.toLocaleString()}
                      </span>
                    </div>

                    {r.is_winner ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {r.matches.map(
                          (m) => (
                            <Badge
                              key={
                                m.id
                              }
                              variant="success"
                            >
                              <Trophy className="mr-1 h-3 w-3" />

                              {
                                m.prize_position
                              }

                              {" — "}

                              {formatPkr(
                                m.prize_amount
                              )}

                              {" in Draw #"}

                              {
                                m.draw_number
                              }

                              {" on "}

                              {
                                m.draw_date
                              }
                            </Badge>
                          )
                        )}
                      </div>
                    ) : (
                      <Badge variant="neutral">
                        No prize
                      </Badge>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}