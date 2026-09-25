import { NextRequest } from "next/server";

const ADMIN_HEADER = "x-admin-passcode";

/**
 * Verifies the admin passcode sent via header (used by the /admin page's
 * fetch calls). This is a lightweight gate suitable for a small internal
 * tool — for a production deployment handling real financial data, prefer
 * upgrading this to a proper admin role on the `users` table plus JWT auth.
 */
export function isValidAdminRequest(req: NextRequest): boolean {
  const configured = process.env.ADMIN_PASSCODE;
  if (!configured) return false;

  const provided = req.headers.get(ADMIN_HEADER);
  return !!provided && provided === configured;
}

export { ADMIN_HEADER };
