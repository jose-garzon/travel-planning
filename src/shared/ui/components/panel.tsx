import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "@/shared/ui/cx";

export type PanelTone = "plain" | "line" | "people" | "time";

type PanelProps<T extends ElementType> = {
  as?: T;
  tone?: PanelTone;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

// Fill plus the text color that reads on it. Colours keep their jobs
// (DESIGN.md): line = the route, people = the crew, time = dates.
const TONE_CLASSES: Record<PanelTone, string> = {
  plain: "bg-surface-1 text-text border-2 border-text",
  line: "bg-accent text-on-accent border-2 border-accent",
  people: "bg-secondary text-on-secondary border-2 border-secondary",
  time: "bg-sun text-on-sun border-2 border-sun",
};

/**
 * Panel primitive: a flat signboard. Square-ish corners and a 2px ink
 * rule, like a station sign; no shadow.
 */
export function Panel<T extends ElementType = "div">({
  as,
  tone = "plain",
  className,
  children,
  ...rest
}: PanelProps<T>) {
  const Component: ElementType = as ?? "div";

  return (
    <Component
      data-ui="panel"
      className={cx("rounded-md", TONE_CLASSES[tone], className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
