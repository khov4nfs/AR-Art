import { redirect } from "next/navigation";

/** Legacy URL only. EVERIE login is the sole sign-in for both commerce and AR. */
export default async function LegacyArLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const destination = typeof next === "string" && next.startsWith("/")
    && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/gallery";
  redirect(`/login?next=${encodeURIComponent(destination)}`);
}
