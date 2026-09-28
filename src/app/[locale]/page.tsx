import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/modules/auth";
import { LandingScreen, NameCaptureScreen } from "@/modules/auth/ui";
import { getHomeTripsSummary } from "@/modules/trips";
import { HomeScreen } from "@/modules/trips/ui";

// Three-way branch on `getCurrentUser()` (plan "Architecture"): signed
// out sees the landing page, signed in with no name yet sees the
// one-time name form, signed in with a name sees the home page.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currentUser = await getCurrentUser();

  if (currentUser === null) {
    return <LandingScreen />;
  }

  if (currentUser.needsDisplayName) {
    return <NameCaptureScreen />;
  }

  const summary = await getHomeTripsSummary(currentUser.email);

  return <HomeScreen displayName={currentUser.displayName} summary={summary} />;
}
