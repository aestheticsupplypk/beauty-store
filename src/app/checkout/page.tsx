import { cookies } from "next/headers";
import CheckoutClient from "./CheckoutClient";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Server Component: Reads aff_ref cookie (httpOnly) and passes to client.
 * This enables affiliate code pre-fill without exposing the cookie to JavaScript.
 */
export default async function CheckoutPage() {
  const cookieStore = cookies();
  const affRef = cookieStore.get("aff_ref")?.value ?? null;

  return <CheckoutClient initialReferralCode={affRef} />;
}
