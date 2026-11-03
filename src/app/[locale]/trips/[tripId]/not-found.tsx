import { TripNotFound } from "@/modules/trips/ui";

// Rendered when the page calls `notFound()`; the page has already set the request locale.
export default function TripNotFoundPage() {
  return <TripNotFound />;
}
