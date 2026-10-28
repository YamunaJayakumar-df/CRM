// DashboardGreeting: the dashboard title ("Good morning" / "Good afternoon" /
// "Good evening") and today's date on the right, both in India time.
//
// Why `await io()` first: with cacheComponents, Next.js prebuilds as much
// of each page as it can ahead of time. Reading the clock (new Date()) during
// that prebuild would freeze one time into the page for every visitor.
// `await io()` tells Next.js "stop prebuilding here, run the rest per
// request", so the greeting and date are always current. The page wraps
// this component in <Suspense> with DashboardGreetingSkeleton as the
// placeholder shown until it is ready.
// No user name yet: there is no login. The Auth step will add it.
import { io } from "next/cache";
import { CalendarDays, Moon, Sun } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { formatLongToday, greetingFor, todayInKolkata } from "@/lib/format/dates";
import { DASHBOARD_SUBTITLE } from "./DashboardGreetingSkeleton";

const titleIconProps = { size: 24, strokeWidth: 1.75, "aria-hidden": true } as const;

export default async function DashboardGreeting() {
  await io();
  const now = new Date();
  const greeting = greetingFor(now);

  return (
    <PageHeader
      icon={greeting === "Good evening" ? <Moon {...titleIconProps} /> : <Sun {...titleIconProps} />}
      title={greeting}
      subtitle={DASHBOARD_SUBTITLE}
      right={
        <p className="flex items-center gap-2 text-sm text-muted">
          <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
          <time dateTime={todayInKolkata(now)}>{formatLongToday(now)}</time>
        </p>
      }
    />
  );
}
