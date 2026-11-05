import type { Page } from "@playwright/test";
import { signedInEmail } from "./session";

// The owner's email per page and trip name. Seeding a member or a trip
// needs the trip's owner, and a later sign-in (a member) replaces the
// session email, so the owner is remembered per page rather than read
// from the session. Shared by every step file that resolves a trip.
const ownerEmailByPage = new WeakMap<Page, Map<string, string>>();

export function registerOwner(page: Page, tripName: string, ownerEmail: string): void {
  const owners = ownerEmailByPage.get(page) ?? new Map<string, string>();
  owners.set(tripName, ownerEmail);
  ownerEmailByPage.set(page, owners);
}

/** The owner of `tripName` on this page; falls back to the signed-in member (T01 "I own the trip"). */
export function ownerEmailFor(page: Page, tripName: string): string {
  return ownerEmailByPage.get(page)?.get(tripName) ?? signedInEmail(page);
}
