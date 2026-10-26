// Dashboard (/): the first screen after opening the CRM.
// Look and layout only for now. Numbers show "—" and lists are empty;
// real data is connected in a later step (step 7).
import {
  CalendarCheck,
  CalendarDays,
  ClockAlert,
  Inbox,
  MessagesSquare,
  Sun,
  Users,
} from "lucide-react";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ViewAllLink from "@/components/ViewAllLink";

const statIconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;
const emptyIconProps = { size: 28, strokeWidth: 1.5, "aria-hidden": true } as const;

export default function DashboardPage() {
  return (
    // Two-column frame: the main column now, and room for a right-hand
    // column later. A later step will show a customer detail panel there
    // when the URL has ?customer=12. Until then the main column fills the width.
    <div className="flex flex-col gap-8 xl:flex-row">
      <div className="min-w-0 flex-1">
        {/*
          The greeting is fixed text for now. A later step will pick
          "Good morning / afternoon / evening" from the time of day.
        */}
        <PageHeader
          icon={<Sun size={24} strokeWidth={1.75} aria-hidden="true" />}
          title="Good morning"
          subtitle="Here's what's happening with your customers today."
          right={
            // Date placeholder. We do not call new Date() here on purpose:
            // with cacheComponents, reading the current time makes the page
            // wait for a request instead of being prebuilt. The real date
            // comes in a later step.
            <p className="flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />
              Today
            </p>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Customers"
            value="—"
            icon={<Users {...statIconProps} />}
          />
          <StatCard
            label="Open Follow-ups"
            value="—"
            icon={<CalendarCheck {...statIconProps} />}
          />
          <StatCard
            label="Overdue Tasks"
            value="—"
            icon={<ClockAlert {...statIconProps} />}
          />
          <StatCard
            label="Recent Interactions"
            value="—"
            icon={<MessagesSquare {...statIconProps} />}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="Upcoming Follow-ups"
            action={<ViewAllLink href="/follow-ups" />}
          >
            <EmptyState
              icon={<Inbox {...emptyIconProps} />}
              message="No upcoming follow-ups"
              hint="Follow-ups due soon will appear here."
            />
          </Card>
          <Card
            title="Recent Activity"
            action={<ViewAllLink href="/interactions" />}
          >
            <EmptyState
              icon={<MessagesSquare {...emptyIconProps} />}
              message="No recent activity"
              hint="Calls, emails and meetings will appear here."
            />
          </Card>
        </div>
      </div>

      {/* Right-hand customer panel goes here in a later step. */}
    </div>
  );
}
