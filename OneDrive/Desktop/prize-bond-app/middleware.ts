import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight edge-level gate: redirects unauthenticated visitors away from
 * /dashboard before the page even renders. The dashboard page itself also
 * verifies the JWT server-side (via getCurrentUser) as the source of truth —
 * this middleware only checks for cookie presence, since verifying the JWT
 * signature requires the Node.js crypto APIs that aren't available in the
 * default edge runtime.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
