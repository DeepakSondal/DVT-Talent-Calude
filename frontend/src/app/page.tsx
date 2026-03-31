import { redirect } from "next/navigation";

/**
 * Root page — redirect to dashboard if logged in, else to login.
 * Token check happens server-side via middleware.ts (which handles
 * the actual auth guard). This page just ensures "/" always redirects.
 */
export default function RootPage() {
  redirect("/dashboard");
}
