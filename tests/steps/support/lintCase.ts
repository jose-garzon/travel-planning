import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { BIOME_BIN, type ProcessResult, REPO_ROOT, runCommand } from "./process";

/**
 * T03 lint harness (plan "Test harness"): writes a fixture source file
 * to a fresh temp workspace (its path contains `/src/`, same as the
 * real project) and lints it with the project's `biome.json` and
 * plugins, or lints the real project source in place.
 */
export class LintCase {
  private readonly dir = mkdtempSync(path.join(tmpdir(), "design-lint-"));
  private relativePath: string | undefined;
  result: ProcessResult = { stdout: "", stderr: "", exitCode: 0 };

  /** Writes `content` to `relativePath` (e.g. `src/a.css`) inside the temp workspace. */
  write(relativePath: string, content: string): void {
    const absolutePath = path.join(this.dir, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
    this.relativePath = relativePath;
  }

  /** Lints the last file written with `write`, using the repo's `biome.json`. */
  run(): ProcessResult {
    if (!this.relativePath) {
      throw new Error("LintCase.run() called before write()");
    }
    this.result = runCommand(
      BIOME_BIN,
      ["lint", `--config-path=${REPO_ROOT}`, "--vcs-enabled=false", this.relativePath],
      this.dir,
    );
    return this.result;
  }

  /** Lints the real project source tree (`src`), from the repo root. */
  runOnProjectSource(): ProcessResult {
    this.result = runCommand(
      BIOME_BIN,
      ["lint", `--config-path=${REPO_ROOT}`, "--vcs-enabled=false", "src"],
      REPO_ROOT,
    );
    return this.result;
  }

  cleanup(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}
