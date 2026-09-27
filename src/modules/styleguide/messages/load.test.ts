import { describe, expect, it } from "vitest";
import { loadStyleguideMessages } from "./load";

// One namespace per file listed in plan "Messages".
const NAMESPACES = [
  "page",
  "brand",
  "color",
  "type",
  "spacing",
  "radiusShadow",
  "motion",
  "icons",
  "primitives",
  "layout",
  "button",
  "input",
  "card",
  "tooltip",
  "dialog",
];

// Plan "Key copy, en / es": section titles shown by the nav and by
// each StyleguideSection heading (drives the T02 "sections in order"
// and "heading is translated" scenarios).
const SECTION_TITLES: Record<"en" | "es", Record<string, string>> = {
  en: {
    brand: "Brand",
    color: "Color",
    type: "Type",
    spacing: "Spacing",
    radiusShadow: "Radius and shadow",
    motion: "Motion",
    icons: "Icons",
    primitives: "Primitives",
  },
  es: {
    brand: "Marca",
    color: "Color",
    type: "Tipografía",
    spacing: "Espaciado",
    radiusShadow: "Radio y sombra",
    motion: "Movimiento",
    icons: "Íconos",
    primitives: "Componentes",
  },
};

const PAGE_TITLE: Record<"en" | "es", string> = {
  en: "Parche design system",
  es: "Sistema de diseño de Parche",
};

/** Every leaf key path of a nested message object, e.g. "page.title". */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("loadStyleguideMessages", () => {
  it("loads every styleguide namespace for a locale", async () => {
    const messages = await loadStyleguideMessages("en");

    expect(Object.keys(messages).sort()).toEqual([...NAMESPACES].sort());
  });

  it("returns the same message keys for en and es", async () => {
    const en = await loadStyleguideMessages("en");
    const es = await loadStyleguideMessages("es");

    expect(keyPaths(es).sort()).toEqual(keyPaths(en).sort());
  });

  it.each(["en", "es"] as const)("translates the page title for %s", async (locale) => {
    const messages = await loadStyleguideMessages(locale);

    expect(messages.page.title).toBe(PAGE_TITLE[locale]);
  });

  it.each(["en", "es"] as const)("translates every section title for %s", async (locale) => {
    const messages = await loadStyleguideMessages(locale);

    for (const [section, title] of Object.entries(SECTION_TITLES[locale])) {
      const namespace = messages[section as keyof typeof messages] as { title: string };

      expect(namespace.title).toBe(title);
    }
  });
});
