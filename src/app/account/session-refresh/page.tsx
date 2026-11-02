import { SessionRefresh } from "@/components/account/session-refresh";

export const metadata = { robots: { index: false, follow: false } };

export default async function SessionRefreshPage({ searchParams }: PageProps<"/account/session-refresh">) {
  const { next } = await searchParams;
  return <SessionRefresh next={typeof next === "string" ? next : undefined} />;
}
