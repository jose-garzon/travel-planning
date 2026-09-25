import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * A resolved design token: either a single value that is the same in
 * both themes, or a `{ light, dark }` pair (from `light-dark()`).
 */
export type TokenValue = string | { light: string; dark: string };

export type TokenMap = Record<string, TokenValue>;

const DEFAULT_TOKENS_PATH = path.resolve(process.cwd(), "src/shared/ui/tokens.css");

/** Raw CSS text of `tokens.css` (or the file at `cssPath`). */
export function readTokensCss(cssPath: string = DEFAULT_TOKENS_PATH): string {
  return readFileSync(cssPath, "utf-8");
}

/**
 * Extracts the `@theme { ... }` block from the tokens CSS and returns
 * every `--name: value;` declaration as a map of `name → value`,
 * where `name` has no leading `--`.
 *
 * - `light-dark(<light>, <dark>)` becomes `{ light, dark }`.
 * - `var(--other)` resolves to the value of `--other` (recursively)
 *   when `--other` is defined in the `@theme` block. When it is not
 *   (e.g. `--font-fredoka`, set outside tokens.css by `fonts.ts`),
 *   the literal `var(--other)` is returned unchanged.
 * - Every other value (`#rrggbb`, `#rrggbbaa`, `transparent`, plain
 *   lengths, durations, etc.) is returned as its trimmed source text.
 */
export function readTokens(cssPath: string = DEFAULT_TOKENS_PATH): TokenMap {
  const css = readTokensCss(cssPath);
  const themeBlock = extractThemeBlock(css);
  const rawValues = extractDeclarations(themeBlock);

  const resolved: TokenMap = {};
  for (const name of Object.keys(rawValues)) {
    resolved[name] = resolveValue(rawValues[name] as string, rawValues, new Set());
  }
  return resolved;
}

function extractThemeBlock(css: string): string {
  const start = css.indexOf("@theme");
  if (start === -1) {
    throw new Error("tokens.css has no @theme block");
  }
  const openBrace = css.indexOf("{", start);
  if (openBrace === -1) {
    throw new Error("tokens.css @theme block has no opening brace");
  }

  let depth = 0;
  for (let i = openBrace; i < css.length; i += 1) {
    if (css[i] === "{") {
      depth += 1;
    }
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(openBrace + 1, i);
      }
    }
  }
  throw new Error("tokens.css @theme block is never closed");
}

function extractDeclarations(themeBlock: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  const pattern = /--([\w-]+|\*)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null = pattern.exec(themeBlock);
  while (match !== null) {
    const name = match[1] as string;
    const value = (match[2] as string).trim();
    if (name !== "*") {
      declarations[name] = value;
    }
    match = pattern.exec(themeBlock);
  }
  return declarations;
}

function resolveValue(
  raw: string,
  rawValues: Record<string, string>,
  seen: Set<string>,
): TokenValue {
  const lightDarkMatch = raw.match(/^light-dark\((.+)\)$/);
  if (lightDarkMatch) {
    const [light, dark] = splitTopLevel(lightDarkMatch[1] as string);
    return {
      light: resolveSide(light, rawValues, seen),
      dark: resolveSide(dark, rawValues, seen),
    };
  }

  const varMatch = raw.match(/^var\(--([\w-]+)\)$/);
  if (varMatch) {
    const referenced = varMatch[1] as string;
    if (rawValues[referenced] === undefined) {
      return raw;
    }
    return resolveReference(referenced, rawValues, seen);
  }

  return raw;
}

function resolveSide(raw: string, rawValues: Record<string, string>, seen: Set<string>): string {
  const trimmed = raw.trim();
  const varMatch = trimmed.match(/^var\(--([\w-]+)\)$/);
  if (varMatch) {
    const referenced = varMatch[1] as string;
    const resolved = resolveReference(referenced, rawValues, seen);
    if (typeof resolved === "string") {
      return resolved;
    }
    throw new Error(`light-dark() side references "${referenced}", which has no single value`);
  }
  return trimmed;
}

function resolveReference(
  name: string,
  rawValues: Record<string, string>,
  seen: Set<string>,
): TokenValue {
  if (seen.has(name)) {
    throw new Error(`circular token reference: ${name}`);
  }
  const referencedRaw = rawValues[name];
  if (referencedRaw === undefined) {
    throw new Error(`token --${name} is not defined`);
  }
  return resolveValue(referencedRaw, rawValues, new Set(seen).add(name));
}

function splitTopLevel(input: string): [string, string] {
  let depth = 0;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "(") {
      depth += 1;
    }
    if (char === ")") {
      depth -= 1;
    }
    if (char === "," && depth === 0) {
      return [input.slice(0, i), input.slice(i + 1)];
    }
  }
  throw new Error(`light-dark() value has no top-level comma: ${input}`);
}

/** Relative luminance of a color, per the WCAG 2 formula. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (rs as number) + 0.7152 * (gs as number) + 0.0722 * (bs as number);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6 && normalized.length !== 8) {
    throw new Error(`not a hex color: ${hex}`);
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

/** WCAG 2 contrast ratio between two hex colors (1 to 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}
