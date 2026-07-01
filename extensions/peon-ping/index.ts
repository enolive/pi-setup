/**
 * peon-ping bridge for pi
 *
 * Thin adapter that maps pi lifecycle events to Claude-Code-style hook JSON
 * and pipes them into the installed `peon` CLI on stdin. The CLI handles
 * everything else (sound packs, volume, notifications, spam detection,
 * relay, etc.) — see `peon help`.
 *
 * Unlike re-implementations, this extension does NOT manage packs, audio,
 * config, or notifications itself. Configure via `peon` directly:
 *
 *   peon setup           # interactive wizard
 *   peon packs install … # install sound packs
 *   peon volume 0.4
 *   peon notifications off
 *
 * Override the binary with the PEON_BIN env var (default: `peon` on PATH).
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { accessSync, constants as fsConstants } from "node:fs";
import { delimiter, isAbsolute, join } from "node:path";

type HookEvent =
	| "SessionStart"
	| "UserPromptSubmit"
	| "Stop"
	| "PermissionRequest"
	| "PostToolUseFailure"
	| "PreCompact"
	| "SessionEnd";

interface HookPayload {
	hook_event_name: HookEvent;
	session_id: string;
	cwd: string;
	source?: string;
	tool_name?: string;
	error?: string;
	notification_type?: string;
	[key: string]: unknown;
}

const PEON_BIN = process.env.PEON_BIN || "peon";

/**
 * Locate an executable. If `name` contains a path separator (or is absolute),
 * check it directly; otherwise scan `PATH`. Returns the resolved absolute
 * path, or `undefined` if not found / not executable.
 */
function resolveExecutable(name: string): string | undefined {
	const hasPathSep = name.includes("/") || name.includes("\\");
	if (isAbsolute(name) || hasPathSep) {
		try {
			accessSync(name, fsConstants.X_OK);
			return name;
		} catch {
			return undefined;
		}
	}
	const pathEnv = process.env.PATH ?? "";
	for (const dir of pathEnv.split(delimiter)) {
		if (!dir) continue;
		const candidate = join(dir, name);
		try {
			accessSync(candidate, fsConstants.X_OK);
			return candidate;
		} catch {
			// keep looking
		}
	}
	return undefined;
}

/** Fire-and-forget invocation: pipe JSON to `peon` on stdin, ignore output. */
function dispatch(peonPath: string, payload: HookPayload): void {
	let child;
	try {
		child = spawn(peonPath, [], {
			stdio: ["pipe", "ignore", "ignore"],
			detached: true,
		});
	} catch {
		return;
	}
	child.on("error", () => {
		/* swallow ENOENT etc. */
	});
	// Unref so it never blocks pi shutdown.
	child.unref();
	try {
		child.stdin?.end(JSON.stringify(payload));
	} catch {
		// Pipe closed before we could write — peon likely failed to spawn.
	}
}

function sessionIdFor(ctx: ExtensionContext): string {
	const file = ctx.sessionManager?.getSessionFile?.();
	if (file) {
		// Stable per-session-file id; peon uses this for spam tracking, etc.
		return `pi-${file.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "session"}`;
	}
	return `pi-${randomUUID()}`;
}

// noinspection JSUnusedGlobalSymbols
export default function (pi: ExtensionAPI) {
	const peonPath = resolveExecutable(PEON_BIN);
	if (!peonPath) {
		console.warn(
			`peon-ping: \`${PEON_BIN}\` not found on PATH. Install it (https://github.com/PeonPing/peon-ping) or set $PEON_BIN. Extension disabled.`,
		);
		return;
	}

	pi.on("session_start", async (event, ctx) => {
		if (!ctx.hasUI) return;
		// peon's SessionStart greeting only makes sense for fresh loads.
		if (event.reason === "reload" || event.reason === "fork") return;
		dispatch(peonPath, {
			hook_event_name: "SessionStart",
			session_id: sessionIdFor(ctx),
			cwd: ctx.cwd,
			source: event.reason === "resume" ? "resume" : "startup",
		});
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		dispatch(peonPath, {
			hook_event_name: "UserPromptSubmit",
			session_id: sessionIdFor(ctx),
			cwd: ctx.cwd,
		});
	});

	pi.on("agent_end", async (_event, ctx) => {
		dispatch(peonPath, {
			hook_event_name: "Stop",
			session_id: sessionIdFor(ctx),
			cwd: ctx.cwd,
		});
	});

	pi.on("tool_execution_end", async (event, ctx) => {
		if (!event.isError) return;
		dispatch(peonPath, {
			hook_event_name: "PostToolUseFailure",
			session_id: sessionIdFor(ctx),
			cwd: ctx.cwd,
			// peon only plays task.error for Bash failures by default; pretend
			// every tool failure is Bash so all pi tool errors get the sound.
			tool_name: "Bash",
			error: typeof event.toolName === "string" ? `${event.toolName} failed` : "tool failed",
		});
	});

	pi.on("session_before_compact", async (_event, ctx) => {
		dispatch(peonPath, {
			hook_event_name: "PreCompact",
			session_id: sessionIdFor(ctx),
			cwd: ctx.cwd,
		});
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		dispatch(peonPath, {
			hook_event_name: "SessionEnd",
			session_id: sessionIdFor(ctx),
			cwd: ctx.cwd,
		});
	});

	// /peon <args…> — forward to the CLI so users can tweak config without
	// leaving pi. Output is captured and shown via ctx.ui.notify.
	pi.registerCommand("peon", {
		description: "Run the peon CLI (e.g. /peon status, /peon volume 0.3, /peon packs list)",
		handler: async (args, ctx) => {
			const argv = (args ?? "").trim();
			const parts = argv.length > 0 ? argv.split(/\s+/) : ["status"];
			let stdout = "";
			let stderr = "";
			const child = spawn(peonPath, parts, { stdio: ["ignore", "pipe", "pipe"] });
			child.stdout?.on("data", (d) => {
				stdout += d.toString();
			});
			child.stderr?.on("data", (d) => {
				stderr += d.toString();
			});
			child.on("error", (err) => {
				ctx.ui.notify(`peon: ${err.message}`, "error");
			});
			await new Promise<void>((resolve) => {
				child.on("close", () => resolve());
			});
			const out = (stdout + stderr).trim();
			if (out) {
				ctx.ui.notify(out, stderr && !stdout ? "error" : "info");
			} else {
				ctx.ui.notify(`peon ${parts.join(" ")} — (no output)`, "info");
			}
		},
	});
}
