---
version: 1
slug: "src-app-locale-trips-new-page-tsx"
primary_target: "src/app/[locale]/trips/new/page.tsx"
related_targets: ["src/app/[locale]/page.tsx"]
---

# Create trip: route builder

Scope: `/[locale]/trips/new` (create trip), and the app's visual world
(replaces the patch/denim world). Mode: Operate. Mobile first.

Audience: the organizer of a friends' trip, on a phone. Job: lay out the
route (cities in order, optional dates), then invite the crew.
Success: cities are visible and pickable from a list; the route draws
itself as stops are added; every screen says what to do next.
Keep: the name Parche. Unresolved: city data source (feature 005 T02).

## Direction contract

THESIS: A trip is a metro line. Cities are stations, the route is one
thick coloured line that grows a station each time you add a city.
Refuses the category's card list over a map.

OWN-WORLD: White ground (deep night-blue in dark), near-black ink, one
magenta line colour for the route, teal for people, amber for time.
Barlow Condensed uppercase for station names and headings, Onest for
body. Ringed station dots, a dashed open station for "next".

STORY: The organizer sees the line, sees the open next station with a
search field and a visible city list, picks, and watches the line grow.
Then: "Invite your crew".

FIRST VIEWPORT: Header (wordmark left, cancel right). Trip name as big
condensed heading. Below, the line down the left edge: placed stations
with dates, then the open station with "Next stop" search and 3-5
city rows. Primary action pinned at the bottom.

FORM: Metro Line Diagram, #1 on my ordered list (pick card).
seed:ef06506440704b80

SIGNATURE: the line drawing down to each new station (stroke grows,
station ring pops), motion-safe only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
