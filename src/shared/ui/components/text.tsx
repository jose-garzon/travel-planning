import { cx } from "@/shared/ui/cx";
import type { TextContent } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type TextElement = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "strong" | "code";
type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
type TextFont = "display" | "body";
type TextWeight = "regular" | "semibold" | "bold";
type TextLeading = "tight" | "normal" | "relaxed";
type TextTone = "default" | "muted" | "accent" | "success" | "warning" | "error";

type TextProps = TextContent & {
  as?: TextElement;
  size?: TextSize;
  font?: TextFont;
  weight?: TextWeight;
  leading?: TextLeading;
  tone?: TextTone;
  id?: string;
  tabIndex?: -1;
};

const sizeClasses: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-md",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

const fontClasses: Record<TextFont, string> = {
  display: "font-display",
  body: "font-body",
};

const weightClasses: Record<TextWeight, string> = {
  regular: "font-regular",
  semibold: "font-semibold",
  bold: "font-bold",
};

const leadingClasses: Record<TextLeading, string> = {
  tight: "leading-tight",
  normal: "leading-normal",
  relaxed: "leading-relaxed",
};

const toneClasses: Record<TextTone, string> = {
  default: "text-text",
  muted: "text-text-muted",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

/** Text primitive: sets font, size, weight and color from tokens; translates its own text (D-7). */
export function Text({
  as: Component = "p",
  size = "md",
  font = "body",
  weight = "regular",
  leading,
  tone = "default",
  id,
  tabIndex,
  translateId,
  values,
  children,
}: TextProps) {
  const translate = useTranslatable();
  const content = translateId === undefined ? children : translate({ translateId, values });

  return (
    <Component
      data-ui="text"
      id={id}
      tabIndex={tabIndex}
      className={cx(
        sizeClasses[size],
        fontClasses[font],
        weightClasses[weight],
        leading ? leadingClasses[leading] : undefined,
        toneClasses[tone],
      )}
    >
      {content}
    </Component>
  );
}
