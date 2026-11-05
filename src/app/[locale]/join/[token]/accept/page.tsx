import { redirect } from "next/navigation";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";

/**
 * Joins the signed-in visitor through a link, right after the magic link
 * (feature 009 D-3, D-10). It is a page, not a route handler: a server
 * action redirect into a route handler leaves the browser on this URL.
 * Every outcome is a `redirect()` during render: the trip with a toast,
 * the join page with its expired or full state, or name capture first
 * for a new user. `joinTrip` is idempotent, so a repeat render is safe.
 */
export default async function AcceptPage({ params }: PageProps<"/[locale]/join/[token]/accept">) {
  const { locale, token } = await params;
  const joinPage = `/${locale}/join/${token}`;

  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    redirect(joinPage);
  }

  if (currentUser.needsDisplayName) {
    const acceptPage = `${joinPage}/accept`;
    redirect(`/${locale}?next=${encodeURIComponent(acceptPage)}`);
  }

  const result = await tripMembers.joinTrip({ userId: currentUser.id, token, now: new Date() });
  if (!result.ok) {
    if (result.error.code === "INVITE_EXPIRED") {
      redirect(`${joinPage}?expired=1`);
    }
    if (result.error.code === "TRIP_FULL") {
      redirect(`${joinPage}?full=1`);
    }
    redirect(joinPage);
  }

  const toast = result.value.alreadyMember ? "already=1" : "joined=1";
  redirect(`/${locale}/trips/${result.value.tripId}?${toast}`);
}
