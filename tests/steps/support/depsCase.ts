import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DEPCRUISE_BIN,
  DEPENDENCY_CRUISER_CONFIG,
  type ProcessResult,
  runCommand,
} from "./process";

const MINIMAL_TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      esModuleInterop: true,
      allowJs: true,
    },
  },
  null,
  2,
);

/**
 * T03 router-guard harness (plan "Test harness"): builds a temp app
 * tree with `src/app/page.tsx` importing the given file, then runs
 * `depcruise` on it with the repo's `.dependency-cruiser.cjs`.
 */
export class DepsCase {
  private readonly dir = mkdtempSync(path.join(tmpdir(), "design-deps-"));
  result: ProcessResult = { stdout: "", stderr: "", exitCode: 0 };

  /** Writes `src/app/page.tsx` importing `importedFile`, plus that file. */
  givenAppPageImporting(importedFile: string): void {
    const specifier = toImportSpecifier(importedFile);

    this.write(
      "src/app/page.tsx",
      [
        `import "${specifier}";`,
        "",
        "export default function Page() {",
        "  return null;",
        "}",
        "",
      ].join("\n"),
    );
    this.write(importedFile, targetFileContent(importedFile));
    this.write("tsconfig.json", MINIMAL_TSCONFIG);
  }

  /** Runs `depcruise` against the temp workspace's `src` folder. */
  run(): ProcessResult {
    this.result = runCommand(
      DEPCRUISE_BIN,
      ["src", "--config", DEPENDENCY_CRUISER_CONFIG],
      this.dir,
    );
    return this.result;
  }

  cleanup(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }

  private write(relativePath: string, content: string): void {
    const absolutePath = path.join(this.dir, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
  }
}

/** `src/app/foo/bar.tsx` (from `src/app/page.tsx`) becomes `./foo/bar`. */
function toImportSpecifier(file: string): string {
  const withoutAppPrefix = file.replace(/^src\/app\//, "");
  const withoutExtension = withoutAppPrefix.replace(/\.tsx?$/, "");
  return `./${withoutExtension}`;
}

function targetFileContent(file: string): string {
  if (file.endsWith(".tsx")) {
    return ["export default function Thing() {", "  return null;", "}", ""].join("\n");
  }
  return ["export const thing = 1;", ""].join("\n");
}
