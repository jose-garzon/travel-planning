import { setRequestLocale } from "next-intl/server";
import { getCurrentUser, setDisplayName } from "@/modules/auth";
import { LandingScreen, LinkExpiredScreen, NameCaptureScreen } from "@/modules/auth/ui";
import { getHomeTripsSummary } from "@/modules/trips";
import { HomeScreen } from "@/modules/trips/ui";
import { redirect } from "@/shared/i18n/navigation";
import { FocusHeading } from "@/shared/ui/components/focus-heading";

// Better Auth's magic-link plugin redirects a signed-out visitor here
// with this code when the verify token is missing, already consumed
// or past its expiry (plan "Risks": confirmed at
// `node_modules/better-auth/dist/plugins/magic-link`, not guessed).
const EXPIRED_LINK_ERROR = "INVALID_TOKEN";

// Three-way branch on `getCurrentUser()` (plan "Architecture"): signed
// out sees the landing page (or, if Better Auth's verify redirect
// carried an error, the expired-link screen), signed in with no name
// yet sees the one-time name form, signed in with a name sees the
// home page.
export default async function HomePage({ params, searchParams }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const { error, nameError } = await searchParams;
  setRequestLocale(locale);

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
      redirect({ href: { pathname: "/", query: { nameError: "1" } }, locale });
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

  const summary = await getHomeTripsSummary(currentUser.email);

  return (
    <>
      <FocusHeading />
      <HomeScreen displayName={currentUser.displayName} summary={summary} />
    </>
  );
}
