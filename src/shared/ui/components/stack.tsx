import type { ReactNode } from "react";
import { cx } from "@/shared/ui/cx";

type StackElement = "div" | "ul" | "ol" | "section" | "article";
type StackDirection = "vertical" | "horizontal";
type StackGap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "10" | "12" | "16";
type StackAlign = "start" | "center" | "end" | "stretch";
type StackJustify = "start" | "center" | "end" | "between";

type StackProps = {
  as?: StackElement;
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  children: ReactNode;
};

const directionClasses: Record<StackDirection, string> = {
  vertical: "flex-col",
  horizontal: "flex-row",
};

const gapClasses: Record<StackGap, string> = {
  "0": "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "5": "gap-5",
  "6": "gap-6",
  "7": "gap-7",
  "8": "gap-8",
  "10": "gap-10",
  "12": "gap-12",
  "16": "gap-16",
};

const alignClasses: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyClasses: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

/** Stack primitive: flex layout for spacing and aligning children with token gaps. */
export function Stack({
  as: Component = "div",
  direction = "vertical",
  gap = "4",
  align,
  justify,
  wrap,
  children,
}: StackProps) {
  return (
    <Component
      data-ui="stack"
      className={cx(
        "flex",
        directionClasses[direction],
        gapClasses[gap],
        align ? alignClasses[align] : undefined,
        justify ? justifyClasses[justify] : undefined,
        wrap ? "flex-wrap" : undefined,
      )}
    >
      {children}
    </Component>
  );
}
