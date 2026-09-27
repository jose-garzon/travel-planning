/**
 * Architecture boundaries. See docs/standards/architecture.md.
 * Run: pnpm lint:deps
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── Between modules ──────────────────────────────────────────────
    {
      name: "no-cross-module",
      comment:
        "Modules never import each other. Share through src/shared or wire ports in src/app/_composition.",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/([^/]+)/", pathNot: "^src/modules/$1/" },
    },
    {
      name: "modules-not-to-app",
      comment: "Modules do not know the app layer.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/(app/|proxy\\.ts)" },
    },
    {
      name: "shared-is-a-leaf",
      comment: "Shared never imports modules or app.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(modules|app)/" },
    },
    {
      name: "app-uses-public-api",
      comment: "Outside a module, import only its index.ts (server) or ui/index.ts (client).",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/modules/" },
      to: {
        path: "^src/modules/[^/]+/",
        pathNot: "^src/modules/[^/]+/(index\\.ts|ui/index\\.ts)$",
      },
    },

    // ── Layers inside a module ───────────────────────────────────────
    {
      name: "domain-is-pure",
      comment: "Domain imports only other domain files and shared/kernel.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/domain/" },
      to: {
        path: "^src/(modules/[^/]+/(service|data|ui)/|shared/(?!kernel/))",
      },
    },
    {
      name: "service-not-to-data-or-ui",
      comment: "Service defines ports; data implements them. Service never imports data or ui.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/service/" },
      to: { path: "^src/(modules/[^/]+/(data|ui)/|shared/(db|ui)/)" },
    },
    {
      name: "data-not-to-ui",
      severity: "error",
      from: { path: "^src/modules/[^/]+/data/" },
      to: { path: "^src/(modules/[^/]+/ui/|shared/ui/)" },
    },
    {
      name: "ui-not-to-data",
      comment: "UI never touches persistence.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/ui/" },
      to: { path: "^src/(modules/[^/]+/data/|shared/db/)" },
    },
    {
      name: "ui-imports-service-types-only",
      comment:
        "UI may use service types (DTOs), not service code. Data reaches UI via props or API.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/ui/" },
      to: { path: "^src/modules/[^/]+/service/", dependencyTypesNot: ["type-only"] },
    },

    // ── src/app is a router ─────────────────────────────────────────
    {
      name: "app-is-a-router",
      comment: "src/app holds route files and _composition only. UI lives in modules or shared/ui.",
      severity: "error",
      from: { path: "^src/app/" },
      to: {
        path: "^src/app/.+\\.tsx$",
        pathNot: "/(page|layout|loading|error|global-error|not-found|template|default)\\.tsx$",
      },
    },

    // ── Hygiene ──────────────────────────────────────────────────────
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-tests-in-prod",
      severity: "error",
      from: { path: "^src/", pathNot: "\\.test\\.tsx?$" },
      to: { path: "(\\.test\\.tsx?$|^tests/)" },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      from: { path: "^src/", pathNot: "\\.test\\.tsx?$" },
      to: { dependencyTypes: ["npm-dev"], dependencyTypesNot: ["type-only"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^\\.next/|^node_modules/)" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
