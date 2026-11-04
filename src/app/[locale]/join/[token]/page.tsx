import { setRequestLocale } from "next-intl/server";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";
import { InviteExpiredScreen, JoinScreen } from "@/modules/trips/ui";
import { redirect } from "@/shared/i18n/navigation";

/** The join page for a link (feature 009 D-3; the sign-in slot arrives with T04). */
export default async function JoinPage({ params }: PageProps<"/[locale]/join/[token]">) {
  const { locale, token } = await params;
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
        <JoinScreen token={token} preview={preview.value} signedIn={currentUser !== null} />
      ) : (
        <InviteExpiredScreen ownerName={preview.error.ownerName} />
      )}
    </main>
  );
}
