import LandingPage from "@/components/layout/LandingPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Root page — serves the premium landing page.
 * If a valid dvt_token cookie is present, redirect to dashboard.
 */
export default function RootPage() {
  return <LandingPage />;
}
