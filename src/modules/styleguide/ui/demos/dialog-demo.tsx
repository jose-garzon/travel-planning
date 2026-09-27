import { StateSample } from "@/modules/styleguide/ui/components/state-sample";
import { Button } from "@/shared/ui/components/button";
import { Dialog, DialogClose } from "@/shared/ui/components/dialog";
import { Input } from "@/shared/ui/components/input";
import { Stack } from "@/shared/ui/components/stack";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Dialog demo: a "Rename trip" trigger opens a dialog with a title,
 * description, a "Trip name" `Input` and Cancel/Save footer actions
 * (plan "Demo content"). Kept in the horizontal, wrapping `Stack` even
 * though it renders a single figure today, so a later figure needs no
 * layout change (plan "State-figure layout").
 */
export function DialogDemo() {
  const translate = useTranslatable();

  return (
    <section aria-labelledby="dialog-demo-heading" className="mt-16 border-t border-border pt-16">
      <h3 id="dialog-demo-heading" className="text-accent">
        {translate({ translateId: "styleguide.dialog.title" })}
      </h3>
      <Stack direction="horizontal" wrap gap="4">
        <StateSample label={{ translateId: "styleguide.dialog.states.default" }}>
          <Dialog
            trigger={<Button variant="secondary" translateId="styleguide.dialog.trigger" />}
            title={{ translateId: "styleguide.dialog.trigger" }}
            description={{ translateId: "styleguide.dialog.description" }}
            closeLabel={{ translateId: "styleguide.dialog.closeLabel" }}
            footer={
              <>
                <DialogClose>
                  <Button variant="secondary" translateId="styleguide.dialog.cancel" />
                </DialogClose>
                <DialogClose>
                  <Button translateId="styleguide.dialog.save" />
                </DialogClose>
              </>
            }
          >
            <Input label={{ translateId: "styleguide.dialog.fieldLabel" }} />
          </Dialog>
        </StateSample>
      </Stack>
    </section>
  );
}
