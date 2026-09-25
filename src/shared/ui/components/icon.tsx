import type { LucideIcon } from "lucide-react";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

const sizeClasses = {
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-lg",
} as const;

type IconProps = {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  /** Set to expose the icon as `role="img"`; unset to hide it from assistive tech. */
  label?: Translatable;
};

/** Decorative or labelled icon, built on a `lucide-react` icon component. */
export function Icon({ icon: LucideIconComponent, size = "md", label }: IconProps) {
  const translate = useTranslatable();

  if (label === undefined) {
    return <LucideIconComponent data-ui="icon" aria-hidden="true" className={sizeClasses[size]} />;
  }

  return (
    <LucideIconComponent
      data-ui="icon"
      role="img"
      aria-label={translate(label)}
      className={sizeClasses[size]}
    />
  );
}
