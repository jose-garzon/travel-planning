import { execFileSync } from "node:child_process";
import path from "node:path";

/** The repository (or worktree) root: where `biome.json` and `.dependency-cruiser.cjs` live. */
export const REPO_ROOT = process.cwd();

export const BIOME_BIN = path.join(REPO_ROOT, "node_modules/.bin/biome");
export const DEPCRUISE_BIN = path.join(REPO_ROOT, "node_modules/.bin/depcruise");
export const DEPENDENCY_CRUISER_CONFIG = path.join(REPO_ROOT, ".dependency-cruiser.cjs");

export type ProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

/** Runs `command` and captures stdout/stderr/exit code instead of throwing. */
export function runCommand(command: string, args: string[], cwd: string): ProcessResult {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      encoding: "utf-8",
      // Playwright's own process runs with an inherited FORCE_COLOR;
      // some CLIs (depcruise) honor it even when stdout is piped,
      // which breaks plain substring assertions on their output.
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number | null };
    return {
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? "",
      exitCode: failure.status ?? 1,
    };
  }
}
