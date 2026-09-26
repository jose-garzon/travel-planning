import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Input } from "@/shared/ui/components/input";
import { Stack } from "@/shared/ui/components/stack";
import { useTranslatable } from "@/shared/ui/translatable";

/** Input demo: one state figure per supported state (plan "Demo content"). */
export function InputDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="input-demo-heading" className="mt-16 border-t border-border pt-16">
      <h3 id="input-demo-heading">{translate({ translateId: "styleguide.input.title" })}</h3>
      <Stack direction="horizontal" wrap gap="4">
        <StateSample label={{ translateId: "styleguide.input.states.default" }}>
          <Input
            label={{ translateId: "styleguide.input.label" }}
            hint={{ translateId: "styleguide.input.hint" }}
          />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.input.states.hover" }} preview="hover">
          <Input
            label={{ translateId: "styleguide.input.label" }}
            hint={{ translateId: "styleguide.input.hint" }}
          />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.input.states.focus" }} preview="focus">
          <Input
            label={{ translateId: "styleguide.input.label" }}
            hint={{ translateId: "styleguide.input.hint" }}
          />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.input.states.disabled" }}>
          <Input
            label={{ translateId: "styleguide.input.label" }}
            hint={{ translateId: "styleguide.input.hint" }}
            disabled
          />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.input.states.error" }}>
          <Input
            label={{ translateId: "styleguide.input.label" }}
            hint={{ translateId: "styleguide.input.hint" }}
            error={{ translateId: "styleguide.input.error" }}
          />
        </StateSample>
      </Stack>
    </section>
  );
}
