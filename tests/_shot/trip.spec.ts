import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { test } from "@playwright/test";
import { signInAs } from "../steps/support/session";
import { seedTrip } from "../steps/support/trips";

const db = createClient({ url: process.env.DATABASE_URL ?? "file:local.db" });
const d = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

for (const [w, h, name] of [
  [1440, 1000, "desk"],
  [390, 844, "phone"],
] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`trip ${name} ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      const email = `shot-${randomUUID()}@x.test`;
      await signInAs(page, { email, displayName: "Ana" });
      const id = await seedTrip({
        ownerEmail: email,
        name: "Spain with the crew",
        currency: "EUR",
        legs: [
          { from: "Bogotá", to: "Madrid", dayOffset: 6 },
          { from: "Madrid", to: "Sevilla", dayOffset: 10 },
          { from: "Sevilla", to: "Bogotá", dayOffset: 14 },
        ],
      });
      await seedTrip({
        ownerEmail: email,
        name: "Cusco",
        currency: "PEN",
        legs: [
          { from: "Bogotá", to: "Lima", dayOffset: 60 },
          { from: "Lima", to: "Cusco", dayOffset: 63 },
        ],
      });
      const uid = (await db.execute({ sql: "select id from user where email=?", args: [email] }))
        .rows[0]?.id as string;
      const acts: [number, string, string | null, number | null, boolean][] = [
        [6, "Tapas crawl in La Latina", "20:30", 150, true],
        [6, "Sunset at Templo de Debod", "19:00", 60, false],
        [6, "Check in at the flat", null, null, true],
        [7, "Museo del Prado", "10:00", 180, true],
        [7, "Retiro boat ride", "16:00", 60, false],
        [11, "Real Alcázar", "09:30", 120, true],
      ];
      for (const [o, t, s, dur, sub] of acts) {
        const aid = randomUUID();
        await db.execute({
          sql: "insert into activity (id,trip_id,date,title,start_time,duration_minutes,created_by,created_at) values (?,?,?,?,?,?,?,?)",
          args: [aid, id, d(o), t, s, dur, uid, Date.now()],
        });
        if (sub) {
          await db.execute({
            sql: "insert into activity_participant (activity_id,user_id) values (?,?)",
            args: [aid, uid],
          });
        }
      }
      await page.goto(`/es/trips/${id}`);
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `/tmp/claude-1000/-home-flanagan-workspace-github-com-jose-garzon-travel-planning/19e6feb9-7eab-4639-8bed-48e0cea40663/scratchpad/trip-${name}-${scheme}.png`,
        fullPage: true,
      });
    });
  }
}
test("drawer phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = `shot-${randomUUID()}@x.test`;
  await signInAs(page, { email, displayName: "Ana" });
  const id = await seedTrip({
    ownerEmail: email,
    name: "Europa",
    currency: "EUR",
    legs: [{ from: "Bogotá", to: "Roma", dayOffset: 6 }],
  });
  await page.goto(`/es/trips/${id}`);
  await page
    .getByRole("button", { name: "Pregunta al asistente" })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${process.env.S}/drawer.png` });
});
