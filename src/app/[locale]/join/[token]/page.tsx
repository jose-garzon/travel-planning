import { setRequestLocale } from "next-intl/server";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";
import { MagicLinkForm } from "@/modules/auth/ui";
import { InviteExpiredScreen, JoinScreen, TripFullScreen } from "@/modules/trips/ui";
import { redirect } from "@/shared/i18n/navigation";

/**
 * The join page for a link (feature 009 D-3). A signed-out visitor gets the
 * sign-in form in the slot; the accept route sends a failed join back here
 * with `expired=1` (mid-join, so the owner cannot be named) or `full=1`.
 */
export default async function JoinPage({
  params,
  searchParams,
}: PageProps<"/[locale]/join/[token]">) {
  const { locale, token } = await params;
  const { expired, full } = await searchParams;
  setRequestLocale(locale);

  const preview = await tripMembers.getInvitePreview({ token, now: new Date() });
  const currentUser = await getCurrentUser();

  // A member opening the link goes straight to the trip (EC-1, UC-2 alternate 1a).
  if (preview.ok && currentUser !== null) {
    const access = await tripMembers.getTripAccess({
      userId: currentUser.id,
      tripId: preview.value.tripId,
    });
    if (access === "member") {
      redirect({ href: `/trips/${preview.value.tripId}?already=1`, locale });
    }
  }

  return (
    <main className="mx-auto w-full max-w-dialog px-6 pt-4 pb-6 lg:pt-10">
      {preview.ok ? (
        full === "1" ? (
          <TripFullScreen />
        ) : (
          <JoinScreen token={token} preview={preview.value} signedIn={currentUser !== null}>
            <MagicLinkForm callbackURL={`/${locale}/join/${token}/accept`} />
          </JoinScreen>
        )
      ) : (
        <InviteExpiredScreen
          ownerName={expired === "1" ? undefined : preview.error.ownerName}
          askTripOwner={expired === "1"}
        />
      )}
    </main>
  );
}
