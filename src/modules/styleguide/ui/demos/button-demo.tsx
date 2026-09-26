import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Button } from "@/shared/ui/components/button";
import { Stack } from "@/shared/ui/components/stack";
import { useTranslatable } from "@/shared/ui/translatable";

/** Button demo: one state figure per supported state (plan "Demo content"). */
export function ButtonDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="button-demo-heading">
      <h3 id="button-demo-heading">{translate({ translateId: "styleguide.button.title" })}</h3>
      <Stack>
        <StateSample label={{ translateId: "styleguide.button.states.default" }}>
          <Button translateId="styleguide.button.sample" />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.button.states.hover" }} preview="hover">
          <Button translateId="styleguide.button.sample" />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.button.states.focus" }} preview="focus">
          <Button translateId="styleguide.button.sample" />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.button.states.active" }} preview="active">
          <Button translateId="styleguide.button.sample" />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.button.states.loading" }}>
          <Button translateId="styleguide.button.sample" isLoading />
        </StateSample>
        <StateSample label={{ translateId: "styleguide.button.states.disabled" }}>
          <Button translateId="styleguide.button.sample" disabled />
        </StateSample>
      </Stack>
      <Button variant="secondary" translateId="styleguide.button.cancel" />
    </section>
  );
}
