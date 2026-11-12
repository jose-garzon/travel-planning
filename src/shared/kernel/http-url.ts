import { z } from "zod";

/** A URL safe to render as a link: `http` or `https` only (no `javascript:`, `data:`). */
export const httpUrl = z.url({ protocol: /^https?$/ });
