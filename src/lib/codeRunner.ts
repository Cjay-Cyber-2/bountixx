import { getLanguage } from "./languages";

/**
 * Code execution layer.
 *
 * The old public Piston endpoint (emkc.org) became whitelist-only in Feb 2026,
 * so execution is now provider-configurable via env:
 *
 *   1. Judge0 (recommended) — set JUDGE0_URL (+ JUDGE0_KEY)
 *      - RapidAPI:  JUDGE0_URL=https://judge0-ce.p.rapidapi.com, JUDGE0_KEY=<rapidapi key>
 *      - Self-host: JUDGE0_URL=https://your-judge0, JUDGE0_KEY=<X-Auth-Token or empty>
 *   2. Piston (self-hosted) — set PISTON_URL to the full /execute endpoint
 *      e.g. PISTON_URL=https://your-piston/api/v2/piston/execute
 *
 * If neither is configured, codeExecutionEnabled() is false and the submit
 * route returns a clear, actionable error instead of silently failing.
 */

export interface RunResult {
  ok: boolean; // program ran and exited cleanly (status accepted)
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function codeExecutionEnabled(): boolean {
  return Boolean(process.env.JUDGE0_URL || process.env.PISTON_URL);
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) =>
  s ? Buffer.from(s, "base64").toString("utf8") : "";

async function runWithJudge0(
  langKey: string,
  source: string,
  stdin: string
): Promise<RunResult> {
  const base = process.env.JUDGE0_URL!.replace(/\/$/, "");
  const key = process.env.JUDGE0_KEY ?? "";
  const isRapid = base.includes("rapidapi.com");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isRapid) {
    headers["X-RapidAPI-Key"] = key;
    headers["X-RapidAPI-Host"] = new URL(base).host;
  } else if (key) {
    headers["X-Auth-Token"] = key;
  }

  const res = await fetch(`${base}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      language_id: getLanguage(langKey).judge0Id,
      source_code: b64(source),
      stdin: b64(stdin),
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Judge0 HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    stdout?: string;
    stderr?: string;
    compile_output?: string;
    message?: string;
    status?: { id: number; description?: string };
  };

  const statusId = data.status?.id ?? 0;
  const stderr =
    unb64(data.stderr) ||
    unb64(data.compile_output) ||
    unb64(data.message) ||
    (statusId && statusId !== 3 ? data.status?.description ?? "" : "");

  return {
    ok: statusId === 3, // 3 = Accepted (ran successfully)
    stdout: unb64(data.stdout),
    stderr,
    timedOut: statusId === 5, // 5 = Time Limit Exceeded
  };
}

async function runWithPiston(
  langKey: string,
  source: string,
  stdin: string
): Promise<RunResult> {
  const url = process.env.PISTON_URL!;
  const spec = getLanguage(langKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: spec.piston,
      version: "*",
      files: [{ name: `main.${spec.ext}`, content: source }],
      stdin,
      run_timeout: 5000,
      compile_timeout: 10000,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Piston HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    run?: { stdout?: string; stderr?: string; code?: number };
    compile?: { stderr?: string; code?: number };
  };

  const compileErr = data.compile?.stderr?.trim();
  return {
    ok: (data.run?.code ?? 1) === 0 && !compileErr,
    stdout: data.run?.stdout ?? "",
    stderr: compileErr || data.run?.stderr || "",
    timedOut: false,
  };
}

export async function runCode(opts: {
  language: string;
  source: string;
  stdin: string;
}): Promise<RunResult> {
  if (process.env.JUDGE0_URL) {
    return runWithJudge0(opts.language, opts.source, opts.stdin);
  }
  if (process.env.PISTON_URL) {
    return runWithPiston(opts.language, opts.source, opts.stdin);
  }
  throw new Error("Code execution is not configured");
}
