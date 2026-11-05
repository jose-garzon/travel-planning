import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { agent, budget, itinerary } from "@/app/_composition/trip-context";
import { tripMembers } from "@/app/_composition/trip-members";
import { AgentPanel, AssistantDock } from "@/modules/agent/ui/entries/agent";
import { getCurrentUser } from "@/modules/auth";
import { BudgetCard, BudgetCosts } from "@/modules/budget/ui/entries/budget";
import { ItineraryStop } from "@/modules/itinerary/ui/entries/itinerary";
import { getTrip } from "@/modules/trips";
import { ShareTripBox, ShareTripButton, TravelersCard } from "@/modules/trips/ui/entries/members";
import { TicketStrip, TripSummary } from "@/modules/trips/ui/entries/summary";
import { redirect } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";
import { SectionHeader } from "@/shared/ui/components/section-header";
import { StopAccordion } from "@/shared/ui/components/stop-accordion";
import { Toast } from "@/shared/ui/components/toast";
import { formatMoney } from "@/shared/ui/money";
import { groupByStop } from "./plan";

export default async function TripPage({
  params,
  searchParams,
}: PageProps<"/[locale]/trips/[tripId]">) {
  const { locale, tripId } = await params;
  setRequestLocale(locale);

  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    redirect({ href: "/", locale });
    return null;
  }

  // Happy path reads the trip directly; only on failure do we pay for the
  // access check that tells a removed member (home + toast, feature 009 D-4)
  // from a missing trip (404). Keeps added queries within budget.
  const result = await getTrip({ userId: currentUser.id, tripId, locale: locale as Locale });
  if (!result.ok) {
    const access = await tripMembers.getTripAccess({ userId: currentUser.id, tripId });
    if (access === "not-member") {
      redirect({ href: { pathname: "/", query: { removed: "1" } }, locale });
      return null;
    }
    notFound();
  }

  const [members, activities, costs] = await Promise.all([
    tripMembers.listTripMembers({ userId: currentUser.id, tripId }),
    itinerary.listActivities({ userId: currentUser.id, tripId }),
    budget.getBudget({ userId: currentUser.id, tripId }),
  ]);
  if (!members.ok || !activities.ok || !costs.ok) {
    notFound();
  }
  const memberNames = namesById(members.value);

  const { joined, already, invite } = await searchParams;
  const t = await getTranslations({ locale, namespace: "trips.edit" });
  const tj = await getTranslations({ locale, namespace: "trips.join" });

  const trip = result.value;
  const legs = trip.legs;
  const origin = legs[0]?.from.name ?? null;
  const stops = legs.map((leg, index) => ({
    city: leg.to.name,
    from: leg.date,
    to: legs[index + 1]?.date ?? null,
  }));
  const routeNames = origin === null ? [] : [origin, ...stops.map((stop) => stop.city)];
  const routeCodes = codesOf(legs);
  const hasAgent = agent.isEnabled();
  // The train needs every leg dated; an undated leg parks it off the line.
  const legDates = legs.every((leg) => leg.date !== null)
    ? legs.map((leg) => leg.date as string)
    : [];
  // UTC day, matching how leg dates are stored.
  const today = new Date().toISOString().slice(0, 10);
  const myShare = formatMoney(costs.value.mine, costs.value.currency, locale);

  const plan = groupByStop(stops, activities.value.activities, costs.value.items);

  const isOwner = trip.role === "owner";
  const alone = members.value.length === 1;
  const hasRail = hasAgent || isOwner;

  return (
    <main className="mx-auto w-full max-w-page px-6 pt-4 pb-launcher lg:pt-10 lg:pb-16">
      <JoinToasts
        joined={joined === "1"}
        already={already === "1"}
        message={tj("joined", { trip: trip.name })}
        alreadyMessage={tj("already")}
      />
      <div className={hasRail ? "lg:grid lg:grid-cols-rail lg:items-start lg:gap-10" : undefined}>
        <div className="flex min-w-0 flex-col gap-8 [timeline-scope:--ticket]">
          <TicketStrip
            name={trip.name}
            routeCodes={routeCodes}
            myShare={myShare}
            shareLabel={t("fieldShare")}
            legDates={legDates}
            endDate={trip.endDate}
            today={today}
          />
          <TripSummary
            tripId={tripId}
            name={trip.name}
            routeNames={routeNames}
            routeCodes={routeCodes}
            startDate={trip.startDate}
            endDate={trip.endDate}
            crewCount={members.value.length}
            myShare={myShare}
            shareHint={shareHintFor(costs.value.mine, t("shareEmptyHint"))}
            legDates={legDates}
            today={today}
            total={formatMoney(costs.value.summary.total, costs.value.currency, locale)}
            actions={
              <TicketShare
                show={isOwner && !alone}
                tripId={tripId}
                tripName={trip.name}
                openInvite={invite === "1"}
              />
            }
          />
          <AloneInvite
            show={isOwner && alone}
            tripId={tripId}
            tripName={trip.name}
            openInvite={invite === "1"}
          />
          <div className="mt-6 flex flex-col gap-16">
            <section
              id="itinerary"
              aria-labelledby="itinerary-heading"
              className="flex scroll-mt-20 flex-col gap-4"
            >
              <SectionHeader id="itinerary-heading" title={t("planHeading")} />
              {plan.map((group, index) => {
                const stop = group.stop === null ? null : stops[group.stop];
                const from = stop === undefined || stop === null ? trip.startDate : stop.from;
                const to =
                  stop === undefined || stop === null ? trip.endDate : (stop.to ?? trip.endDate);
                const meta = stopMeta({
                  whole: group.stop === null,
                  activityCount: group.activities.length,
                  costTotal: group.costs.reduce((sum, cost) => sum + cost.amountInTripCurrency, 0),
                  format: (minor) => formatMoney(minor, costs.value.currency, locale),
                  t,
                });
                return (
                  <StopAccordion
                    key={group.stop ?? "whole"}
                    title={stop?.city ?? t("wholeTrip")}
                    tone={group.stop === null ? "whole" : "stop"}
                    dates={formatRange(from, to, locale)}
                    meta={meta}
                    defaultOpen={index === 0}
                  >
                    <ItineraryStop
                      tripId={tripId}
                      currency={activities.value.currency}
                      activities={group.activities}
                      startDate={from}
                      endDate={to}
                      memberNames={memberNames}
                    />
                    <BudgetCosts
                      tripId={tripId}
                      budget={costs.value}
                      viewerId={currentUser.id}
                      memberNames={memberNames}
                      items={group.costs}
                      stop={group.stop}
                    />
                  </StopAccordion>
                );
              })}
            </section>
            <BudgetCard
              tripId={tripId}
              budget={costs.value}
              viewerId={currentUser.id}
              memberNames={memberNames}
            />
            <TravelersCard
              tripId={tripId}
              tripName={trip.name}
              viewerId={currentUser.id}
              members={members.value}
              role={trip.role}
              inviteInRail={isOwner}
            />
          </div>
        </div>
        <TripRail
          share={
            isOwner ? (
              <ShareTripBox
                tripId={tripId}
                tripName={trip.name}
                alone={members.value.length === 1}
                openInvite={invite === "1"}
                railOnly
              />
            ) : null
          }
          assistant={
            hasAgent ? (
              <AssistantDock label={t("askLauncher")} closeLabel={t("close")}>
                <AgentPanel
                  tripId={tripId}
                  viewerId={currentUser.id}
                  tripCurrency={trip.currency}
                  origin={origin}
                  stops={stops}
                />
              </AssistantDock>
            ) : null
          }
        />
      </div>
    </main>
  );
}

/** Phones: the invite strip under the ticket while the owner is still alone. */
function AloneInvite({
  show,
  ...share
}: {
  show: boolean;
  tripId: string;
  tripName: string;
  openInvite: boolean;
}) {
  return show ? <ShareTripBox {...share} alone phoneOnly /> : null;
}

/** Phones: Share on the ticket once the crew has more than the owner. */
function TicketShare({
  show,
  ...share
}: {
  show: boolean;
  tripId: string;
  tripName: string;
  openInvite: boolean;
}) {
  return show ? <ShareTripButton {...share} /> : null;
}

/**
 * Desktop: a floating column that stays in view, share first, then the
 * assistant filling the rest. Phones: its pieces are fixed overlays
 * (the assistant drawer), so the column itself takes no space.
 */
function TripRail({ share, assistant }: { share: ReactNode; assistant: ReactNode }) {
  if (share === null && assistant === null) {
    return null;
  }
  return (
    <aside className="max-lg:contents lg:sticky lg:top-6 lg:flex lg:h-rail lg:flex-col lg:gap-4">
      {share}
      {assistant}
    </aside>
  );
}

type JoinToastsProps = {
  joined: boolean;
  already: boolean;
  message: string;
  alreadyMessage: string;
};

/** Confirms an invite on arrival: just joined, or already a member. */
function JoinToasts({ joined, already, message, alreadyMessage }: JoinToastsProps) {
  if (joined) {
    return <Toast tone="success">{message}</Toast>;
  }
  return already ? <Toast tone="success">{alreadyMessage}</Toast> : null;
}

/** Each route city's own station code: the origin, then every stop. */
/** The empty share explains how it fills up; a real share speaks for itself. */
function shareHintFor(mine: number, hint: string): string | undefined {
  return mine === 0 ? hint : undefined;
}

function codesOf(legs: { from: { code: string }; to: { code: string } }[]): string[] {
  const first = legs[0];
  return first === undefined ? [] : [first.from.code, ...legs.map((leg) => leg.to.code)];
}

/** One quiet line under a stop: what it is (whole trip), what is planned, what it costs. */
function stopMeta({
  whole,
  activityCount,
  costTotal,
  format,
  t,
}: {
  whole: boolean;
  activityCount: number;
  costTotal: number;
  format: (minor: number) => string;
  t: Awaited<ReturnType<typeof getTranslations<"trips.edit">>>;
}): string {
  return [
    whole ? t("wholeTripHint") : null,
    t("stopMeta", { count: activityCount }),
    costTotal === 0 ? null : t("stopCosts", { amount: format(costTotal) }),
  ]
    .filter((part) => part !== null)
    .join(" · ");
}

function namesById(members: { userId: string; name: string }[]): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.userId, member.name]));
}

/** "Nov 3 – Nov 7", one day alone, or null when the stop is undated. */
function formatRange(from: string | null, to: string | null, locale: string): string | null {
  if (from === null) {
    return null;
  }
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const day = (iso: string) => format.format(new Date(`${iso}T00:00:00Z`));
  return to === null || to === from ? day(from) : `${day(from)} – ${day(to)}`;
}
