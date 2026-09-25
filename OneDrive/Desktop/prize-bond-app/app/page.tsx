import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

import {
  Search,
  ShieldCheck,
  Trophy,
  FileCheck2,
  CalendarDays,
  Banknote,
} from "lucide-react";

import { BondChecker } from "@/components/bond-checker";
import { Card, CardContent } from "@/components/ui/card";

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://YOUR-DOMAIN.com";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Prize Bond Checker";

export const metadata: Metadata = {
  title: {
    default: "Prize Bond Checker Online – Check Prize Bond Results",
    template: "%s | Prize Bond Checker",
  },

  description:
    "Check prize bonds online by bond number and denomination. Use prize bond pk to find prize bond results, winning numbers, prize amounts, draw numbers and dates.",

  keywords: [
    "prize bond",
    "prize bond check",
    "prize bond check online",
    "prize bond results",
    "prize bond checker online",
    "prize bond checker",
    "Pakistan prize bond checker",
    "Pakistani prize bond",
    "prize bond result Pakistan",
    "prize bond number checker",
    "prize bond draw results",
    "CDNS prize bond results",
    "100 prize bond result",
    "200 prize bond result",
    "750 prize bond result",
    "1500 prize bond result",
    "25000 prize bond result",
    "40000 prize bond result",
  ],

  authors: [
    {
      name: SITE_NAME,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  metadataBase: new URL(WEBSITE_URL),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_PK",
    url: WEBSITE_URL,
    siteName: SITE_NAME,

    title: "Prize Bond Checker Online – Check Prize Bond Results",

    description:
      "Check Pakistani prize bonds online by bond number. Find prize bond results, winning numbers, prize amounts, draw numbers and draw dates.",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prize Bond Checker – Check Pakistani Prize Bond Results Online",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Prize Bond Checker Online",

    description:
      "Check prize bonds online and find prize bond results, winning numbers, prize amounts and draw details.",

    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "finance",
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",

  name: SITE_NAME,
  url: WEBSITE_URL,

  logo: `${WEBSITE_URL}/logo.png`,

  description:
    "Prize Bond Checker is an online tool for checking Pakistani prize bonds and viewing available prize bond draw results.",
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",

  name: SITE_NAME,
  url: WEBSITE_URL,

  description:
    "Check Pakistani prize bonds online and find available prize bond results, winning numbers, prize amounts and draw information.",

  inLanguage: "en-PK",
};

export const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",

  name: "Prize Bond Checker Online",
  url: WEBSITE_URL,

  description:
    "Check prize bonds online by entering bond numbers and selecting a denomination. Find available prize bond results, winning numbers, prize amounts and draw details.",

  isPartOf: {
    "@type": "WebSite",
    name: SITE_NAME,
    url: WEBSITE_URL,
  },

  about: {
    "@type": "Thing",
    name: "Pakistani Prize Bonds",
  },

  inLanguage: "en-PK",
};

export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",

  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: WEBSITE_URL,
    },
  ],
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",

  mainEntity: [
    {
      "@type": "Question",

      name: "How can I check my prize bond online?",

      acceptedAnswer: {
        "@type": "Answer",

        text:
          "Enter your six-digit prize bond number, select the prize bond denomination and click Check Bonds. The checker compares your number with the prize bond draw results available in the system.",
      },
    },

    {
      "@type": "Question",

      name: "Where can I check Pakistani prize bond results?",

      acceptedAnswer: {
        "@type": "Answer",

        text:
          "You can use the Prize Bond Checker to check Pakistani prize bond numbers against the available draw results. Enter one or more six-digit bond numbers and select the relevant denomination.",
      },
    },

    {
      "@type": "Question",

      name: "Which prize bond denominations can I check?",

      acceptedAnswer: {
        "@type": "Answer",

        text:
          "The checker currently supports Rs. 100, Rs. 200, Rs. 750, Rs. 1,500, Rs. 25,000 and Rs. 40,000 prize bonds.",
      },
    },

    {
      "@type": "Question",

      name: "Can I check multiple prize bond numbers online?",

      acceptedAnswer: {
        "@type": "Answer",

        text:
          "Yes. You can enter multiple six-digit prize bond numbers separated by commas or new lines and check them together.",
      },
    },

    {
      "@type": "Question",

      name: "What information is shown for a winning prize bond?",

      acceptedAnswer: {
        "@type": "Answer",

        text:
          "When a matching winning number is found, the checker can show the prize position, prize amount, draw number and draw date.",
      },
    },

    {
      "@type": "Question",

      name: "Are the prize bond results official?",

      acceptedAnswer: {
        "@type": "Answer",

        text:
          "The results displayed on this website are based on draw data entered into the system. Users should verify winning numbers with the official National Savings/CDNS announcements before making financial decisions.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Structured Data */}

      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            organizationSchema
          ),
        }}
      />

      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            websiteSchema
          ),
        }}
      />

      <Script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema
          ),
        }}
      />

      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ),
        }}
      />

      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqSchema
          ),
        }}
      />

      <div className="space-y-10">
        {/* Hero */}
        <section
          className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 py-12 text-white sm:px-12"
          aria-labelledby="hero-title"
        >
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Pakistani Prize Bond Results
            </div>

            <h1
              id="hero-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Pakistani Prize Bond
              Checker
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-100 sm:text-lg">
              Check your Pakistani prize
              bonds online by entering
              your bond number and
              selecting the denomination.
              Find matching prize bond
              results, prize amounts,
              draw numbers and draw dates.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <Search className="h-4 w-4" />
                Check multiple numbers
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <Trophy className="h-4 w-4" />
                Find winning bonds
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <CalendarDays className="h-4 w-4" />
                View draw dates
              </div>
            </div>
          </div>
        </section>

        {/* Ad slot */}
        <div
          className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400"
          aria-label="Advertisement"
        >
          Ad slot
        </div>

        {/* Interactive checker */}
        <BondChecker />

        {/* SEO content */}
        <section
          className="space-y-8"
          aria-labelledby="about-title"
        >
          <div>
            <h2
              id="about-title"
              className="text-2xl font-bold tracking-tight text-slate-900"
            >
              Check Pakistani Prize
              Bonds Online
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              The Pakistani Prize Bond
              Checker lets you check your
              six-digit prize bond numbers
              against available draw
              results. Select your bond
              denomination, enter one or
              more numbers, and check the
              results in seconds.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <Search className="h-7 w-7 text-emerald-600" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Check Multiple Bonds
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Enter multiple six-digit
                  bond numbers using commas
                  or separate lines. You can
                  check them together instead
                  of entering each number
                  individually.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Trophy className="h-7 w-7 text-emerald-600" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Find Winning Numbers
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Matching numbers can show
                  the relevant prize position,
                  prize amount, draw number
                  and draw date.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Banknote className="h-7 w-7 text-emerald-600" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Different Denominations
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select the denomination of
                  your bond before checking
                  its number against the
                  corresponding draw results.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section
          aria-labelledby="how-title"
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        >
          <h2
            id="how-title"
            className="text-2xl font-bold text-slate-900"
          >
            How to Check a Prize
            Bond
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                1
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Select denomination
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select the denomination
                printed on your prize bond.
              </p>
            </div>

            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                2
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Enter bond numbers
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter one or more six-digit
                bond numbers separated by
                commas or new lines.
              </p>
            </div>

            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                3
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Check the results
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review whether your number
                matches an available winning
                result.
              </p>
            </div>
          </div>
        </section>

        {/* Supported denominations */}
        <section
          aria-labelledby="denominations-title"
        >
          <h2
            id="denominations-title"
            className="text-2xl font-bold text-slate-900"
          >
            Prize Bond
            Denominations
          </h2>

          <p className="mt-2 text-slate-600">
            Select the denomination that
            matches your prize bond when
            using the checker.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              100,
              200,
              750,
              1500,
              25000,
              40000,
            ].map((amount) => (
              <div
                key={amount}
                className="rounded-xl border border-slate-200 bg-white p-4 text-center"
              >
                <p className="text-xs text-slate-500">
                  Denomination
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  Rs.{" "}
                  {amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq-title"
          className="space-y-4"
        >
          <h2
            id="faq-title"
            className="text-2xl font-bold text-slate-900"
          >
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            <details className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-slate-900">
                How can I check my Pakistani
                prize bond?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Select your prize bond
                denomination and enter your
                six-digit bond number. You can
                enter multiple numbers separated
                by commas or new lines and then
                select Check Bonds.
              </p>
            </details>

            <details className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-slate-900">
                Can I check multiple bond
                numbers at once?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. Enter multiple six-digit
                numbers separated by commas or
                new lines. The checker processes
                the numbers together.
              </p>
            </details>

            <details className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-slate-900">
                What happens if my bond is a
                winner?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The results can show the prize
                position, prize amount, draw
                number and draw date associated
                with the matching result.
              </p>
            </details>

            <details className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-slate-900">
                Are these official CDNS
                results?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The website displays draw data
                entered into its database. Always
                verify a winning number against
                the official National Savings/CDNS
                announcement before making a
                financial decision.
              </p>
            </details>

            <details className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-slate-900">
                Which prize bond denominations
                are supported?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The current checker supports
                Rs. 100, Rs. 200, Rs. 750,
                Rs. 1,500, Rs. 25,000 and
                Rs. 40,000 denominations.
              </p>
            </details>
          </div>
        </section>

        {/* Official source notice */}
        <section
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"
          aria-label="Important information"
        >
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <p>
            Results are sourced from draw
            data entered into this system and
            may not reflect the most recent
            official announcement. Always
            cross-check winning numbers with{" "}
            <a
              href="https://savings.gov.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 underline"
            >
              National Savings / CDNS
            </a>{" "}
            before making any financial
            decisions.
          </p>
        </section>
      </div>
    </>
  );
}