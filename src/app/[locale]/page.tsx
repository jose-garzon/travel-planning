import { cookies } from "next/headers";
import { redirect as nextRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { itinerary, transfers } from "@/app/_composition/trip-context";
import { getCurrentUser, setDisplayName } from "@/modules/auth";
import {
  LandingScreen,
  LinkExpiredScreen,
  NameCaptureScreen,
  safeNextPath,
} from "@/modules/auth/ui";
import { nextTransfer } from "@/modules/transfers";
import { getHomeTrips } from "@/modules/trips";
import { buildNextStop, HomeScreen, type HomeTransfer } from "@/modules/trips/ui";
import { redirect } from "@/shared/i18n/navigation";
import type { Locale } from "@/shared/i18n/routing";
import { FocusHeading } from "@/shared/ui/components/focus-heading";
import { TIME_ZONE_COOKIE } from "@/shared/ui/components/time-zone-cookie";

// Better Auth's magic-link plugin redirects a signed-out visitor here
// with this code when the verify token is missing, already consumed
// or past its expiry (plan "Risks": confirmed at
// `node_modules/better-auth/dist/plugins/magic-link`, not guessed).
const EXPIRED_LINK_ERROR = "INVALID_TOKEN";

const DAY_MS = 86_400_000;

/** Whole days from `today` to `date` (both `YYYY-MM-DD`); never negative. */
function daysFrom(today: string, date: string): number {
  return Math.max(
    0,
    Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS),
  );
}

/** Home reminds of a transfer from the day before it leaves. */
const REMIND_DAYS = 1;

/**
 * The trip's next transfer as home shows it, or null until the day before
 * it leaves. Transfers is wired here so trips never imports it
 * (architecture.md "Crossing modules").
 */
async function loadNextTransfer(
  userId: string,
  tripId: string,
  locale: Locale,
  today: string,
): Promise<HomeTransfer | null> {
  const listed = await transfers.listTransfers({ userId, tripId, locale });
  const next = listed.ok ? nextTransfer(listed.value.transfers, Date.now()) : null;
  const daysAway = next === null ? null : daysFrom(today, next.departDate);
  if (next === null || daysAway === null || daysAway > REMIND_DAYS) {
    return null;
  }
  return {
    id: next.id,
    mode: next.mode,
    from: next.from,
    to: next.to,
    departDate: next.departDate,
    departTime: next.departTime,
    daysAway,
  };
}

/** `YYYY-MM-DD` in the user's zone (the `tz` cookie); UTC when absent or invalid (plan D-5). */
function todayIn(timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// Three-way branch on `getCurrentUser()` (plan "Architecture"): signed
// out sees the landing page (or, if Better Auth's verify redirect
// carried an error, the expired-link screen), signed in with no name
// yet sees the one-time name form, signed in with a name sees the
// home page.
export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const { error, nameError, created, deleted, left, removed, next } = await searchParams;
  setRequestLocale(locale);
  // A join link sends a new user here with `next` set to its accept path (feature 009 D-3).
  const nextPath = safeNextPath(typeof next === "string" ? next : undefined);

  // Thin Server Action (architecture.md rule 7: only `app/` calls a
  // module's `index.ts`; `NameCaptureScreen` only receives it as a
  // prop and binds it to the form). Redirects back to "/" either way,
  // so this page's branch above re-evaluates `getCurrentUser()`:
  // success clears `needsDisplayName` and now renders `HomeScreen`;
  // failure carries `nameError=1` back for the inline error (plan
  // "Steps" T02.5, feature.md EC-5).
  async function submitDisplayName(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "");
    const result = await setDisplayName(name);

    if (!result.ok) {
      const query = nextPath === null ? { nameError: "1" } : { nameError: "1", next: nextPath };
      redirect({ href: { pathname: "/", query }, locale });
    }

    if (nextPath !== null) {
      nextRedirect(nextPath);
    }
    redirect({ href: "/", locale });
  }

  const currentUser = await getCurrentUser();

  if (currentUser === null) {
    if (error === EXPIRED_LINK_ERROR) {
      return <LinkExpiredScreen />;
    }
    return <LandingScreen />;
  }

  if (currentUser.needsDisplayName) {
    return <NameCaptureScreen action={submitDisplayName} error={nameError === "1"} />;
  }

  const createdTripId = typeof created === "string" ? created : undefined;
  const today = todayIn((await cookies()).get(TIME_ZONE_COOKIE)?.value);
  const summary = await getHomeTrips({
    userId: currentUser.id,
    locale: locale as Locale,
    today,
  });

  // The spotlight needs the next trip's activities; itinerary is wired
  // here so trips never imports it (architecture.md "Crossing modules").
  const nextTrip = summary.nextTrip;
  const activities =
    nextTrip === null || nextTrip.startDate === null
      ? null
      : await itinerary.listActivities({ userId: currentUser.id, tripId: nextTrip.id });
  const nextStop =
    nextTrip === null
      ? null
      : buildNextStop(
          nextTrip,
          activities?.ok
            ? activities.value.activities.map((activity) => ({
                id: activity.id,
                date: activity.date,
                title: activity.title,
                startTime: activity.startTime,
                durationMinutes: activity.durationMinutes,
                subscribed: activity.subscribed,
                goingCount: activity.participantIds.length,
              }))
            : [],
          today,
        );

  // The next trip's next transfer goes on its board.
  const homeTransfer =
    nextStop === null || nextTrip === null
      ? null
      : await loadNextTransfer(currentUser.id, nextTrip.id, locale as Locale, today);

  return (
    <>
      <FocusHeading />
      <HomeScreen
        displayName={currentUser.displayName}
        summary={summary}
        nextStop={nextStop}
        nextTransfer={homeTransfer}
        today={today}
        justCreated={createdTripId !== undefined}
        createdTripId={createdTripId}
        justDeleted={deleted === "1"}
        leftTrip={typeof left === "string" ? left : undefined}
        justRemoved={removed === "1"}
      />
    </>
  );
}
