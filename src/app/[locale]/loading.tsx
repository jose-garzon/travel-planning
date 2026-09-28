import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Suspense fallback for `/[locale]` (plan "Accessibility notes": T02
 * owns the "signed in, loading your trips" announcement, always in
 * this file, whether or not the verify redirect turns out to have a
 * client-rendered gap). `sr-only` — plan "Left to implementation": the
 * announcement matters, a visible flash between screens does not.
 */
export default function Loading() {
  const translate = useTranslatable();

  return (
    <div aria-live="polite" className="sr-only">
      {translate({ translateId: "auth.signingIn.loading" })}
    </div>
  );
}
