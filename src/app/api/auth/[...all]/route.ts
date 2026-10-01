import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/modules/auth";

// Thin route file (plan D-1): delegates to `auth.handler`. No parsing,
// no business logic here.
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
