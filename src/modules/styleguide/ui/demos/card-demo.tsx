// Client component: passes an onClick handler down to CardButton (a
// Client Component), which a Server Component cannot do.
"use client";

import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Card, CardButton } from "@/shared/ui/components/card";
import { Stack } from "@/shared/ui/components/stack";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Card demo: `CardButton` figures Default/Hover/Focus/Active share the
 * same long heading (truncates, tooltip on hover/focus), a static `Card`
 * with the same heading wraps instead, and a short `CardButton` "Café"
 * never shows a tooltip (plan "Demo content"). Every card sits in a
 * `max-w-card` wrapper (primitives take no `className`) so the long
 * heading overflows at any viewport.
 */
export function CardDemo() {
  const translate = useTranslatable();

  function handleClick() {
    // Demo only: shows the clickable states, does not navigate anywhere.
  }

  return (
    <section aria-labelledby="card-demo-heading" className="mt-16 border-t border-border pt-16">
      <h3 id="card-demo-heading" className="text-accent">
        {translate({ translateId: "styleguide.card.title" })}
      </h3>
      <Stack direction="horizontal" wrap gap="4">
        <StateSample label={{ translateId: "styleguide.card.states.default" }}>
          <div className="max-w-card">
            <CardButton
              heading={{ translateId: "styleguide.card.heading" }}
              onClick={handleClick}
            />
          </div>
        </StateSample>
        <StateSample label={{ translateId: "styleguide.card.states.hover" }} preview="hover">
          <div className="max-w-card">
            <CardButton
              heading={{ translateId: "styleguide.card.heading" }}
              onClick={handleClick}
            />
          </div>
        </StateSample>
        <StateSample label={{ translateId: "styleguide.card.states.focus" }} preview="focus">
          <div className="max-w-card">
            <CardButton
              heading={{ translateId: "styleguide.card.heading" }}
              onClick={handleClick}
            />
          </div>
        </StateSample>
        <StateSample label={{ translateId: "styleguide.card.states.active" }} preview="active">
          <div className="max-w-card">
            <CardButton
              heading={{ translateId: "styleguide.card.heading" }}
              onClick={handleClick}
            />
          </div>
        </StateSample>
      </Stack>
      <div className="max-w-card">
        <Card heading={{ translateId: "styleguide.card.heading" }} />
      </div>
      <div className="max-w-card">
        <CardButton
          heading={{ translateId: "styleguide.card.shortHeading" }}
          onClick={handleClick}
        />
      </div>
    </section>
  );
}
