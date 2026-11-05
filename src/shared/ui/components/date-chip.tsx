// Client component: Radix Popover and the calendar keep open/selection state.
"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Popover } from "radix-ui";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, es } from "react-day-picker/locale";
import { Icon } from "@/shared/ui/components/icon";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type DateChipProps = {
  id: string;
  /** `YYYY-MM-DD` or "" when not set. */
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the calendar button. */
  pickerLabel: Translatable;
  /** Month the calendar opens on when no date is set (`YYYY-MM-DD`). */
  suggestedMonth?: string;
  invalid?: boolean;
  describedBy?: string;
};

function toDate(iso: string): Date | undefined {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) {
    return undefined;
  }
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The amber time chip (DESIGN.md): a typeable date field plus a calendar
 * button that opens a month grid in a popover. The native field keeps
 * keyboard entry and the label; the calendar is the pointer path.
 */
export function DateChip({
  id,
  value,
  onChange,
  pickerLabel,
  suggestedMonth,
  invalid,
  describedBy,
}: DateChipProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const selected = toDate(value);

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <span className="inline-flex min-h-touch w-fit items-center gap-1 rounded-full bg-sun ps-1 pe-4 font-semibold text-on-sun">
        <Popover.Trigger
          type="button"
          aria-label={translate(pickerLabel)}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition duration-fast ease-out ui-hover:bg-on-sun/10 ui-focus:outline-2 ui-focus:outline-text ui-focus:outline-solid"
        >
          <Icon icon={CalendarDays} />
        </Popover.Trigger>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="date-chip"
        />
      </span>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 rounded-md border-2 border-text bg-surface-1 p-3 text-text shadow-md animate-fade-in"
        >
          <DayPicker
            mode="single"
            locale={locale === "es" ? es : enUS}
            weekStartsOn={1}
            selected={selected}
            defaultMonth={selected ?? toDate(suggestedMonth ?? "")}
            onSelect={(date) => {
              if (date) {
                onChange(toIso(date));
                setIsOpen(false);
              }
            }}
            components={{
              Chevron: ({ orientation }) => (
                <Icon icon={orientation === "left" ? ChevronLeft : ChevronRight} />
              ),
            }}
            classNames={{
              root: "relative",
              months: "flex",
              month: "flex flex-col gap-3",
              month_caption: "flex h-10 items-center ps-2",
              caption_label: "font-bold font-display text-xl uppercase leading-none tracking-wide",
              nav: "absolute end-0 top-0 flex gap-1",
              button_previous:
                "inline-flex size-touch cursor-pointer items-center justify-center rounded-full border-2 border-text ui-hover:bg-surface-2 disabled:opacity-40",
              button_next:
                "inline-flex size-touch cursor-pointer items-center justify-center rounded-full border-2 border-text ui-hover:bg-surface-2 disabled:opacity-40",
              month_grid: "border-collapse",
              weekdays: "",
              weekday: "h-8 w-touch font-semibold text-text-muted text-xs uppercase",
              week: "",
              day: "p-0.5 text-center",
              day_button:
                "inline-flex size-10 cursor-pointer items-center justify-center rounded-full font-semibold tabular-nums transition duration-fast ease-out ui-hover:bg-surface-2 ui-focus:outline-2 ui-focus:outline-text ui-focus:outline-solid",
              today: "[&>button]:ring-2 [&>button]:ring-accent",
              selected: "[&>button]:bg-sun! [&>button]:text-on-sun",
              outside: "text-text-muted opacity-50",
              disabled: "opacity-40",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
