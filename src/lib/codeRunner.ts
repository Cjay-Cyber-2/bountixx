import vm from "node:vm";
import { getLanguage } from "./languages";

/**
 * Code execution layer.
 *
 * Priority:
 *   1. Judge0 — set JUDGE0_URL (+ JUDGE0_KEY)
 *   2. Piston — set PISTON_URL (self-hosted recommended; see README setup notes)
 *   3. Built-in JavaScript VM — always available for javascript on Node runtime
 */

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function codeExecutionEnabled(language?: string): boolean {
  if (process.env.JUDGE0_URL || process.env.PISTON_URL) return true;
  return language === "javascript" || language === "typescript" || !language;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) =>
  s ? Buffer.from(s, "base64").toString("utf8") : "";

/** Built-in JS runner — no external service required. */
async function runJavaScriptLocally(source: string, stdin: string): Promise<RunResult> {
  const logs: string[] = [];
  const errors: string[] = [];

  const sandbox: Record<string, unknown> = {
    console: {
      log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
    },
    require: (id: string) => {
      if (id === "fs") {
        return {
          readFileSync: (_fd: number, _enc?: string) => stdin,
          readFile: (_p: string, _enc: string, cb: (e: null, d: string) => void) =>
            cb(null, stdin),
        };
      }
      throw new Error(`Module not allowed: ${id}`);
    },
    process: {
      stdin: { read: () => stdin },
      stdout: { write: (s: string) => { logs.push(String(s).replace(/\n$/, "")); } },
    },
    setTimeout,
    clearTimeout,
    Buffer,
    String,
    Number,
    Array,
    Object,
    Math,
    JSON,
    parseInt,
    parseFloat,
    Error,
  };

  try {
    const script = new vm.Script(source);
    const context = vm.createContext(sandbox);
    script.runInContext(context, { timeout: 5000 });
    return {
      ok: errors.length === 0,
      stdout: logs.join("\n").trim(),
      stderr: errors.join("\n").trim(),
      timedOut: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const timedOut = msg.toLowerCase().includes("timeout");
    return { ok: false, stdout: logs.join("\n").trim(), stderr: msg, timedOut };
  }
}

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
    ok: statusId === 3,
    stdout: unb64(data.stdout),
    stderr,
    timedOut: statusId === 5,
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
  const lang = opts.language;

  if (process.env.JUDGE0_URL) {
    return runWithJudge0(lang, opts.source, opts.stdin);
  }
  if (process.env.PISTON_URL) {
    return runWithPiston(lang, opts.source, opts.stdin);
  }
  if (lang === "javascript" || lang === "typescript") {
    return runJavaScriptLocally(opts.source, opts.stdin);
  }

  throw new Error(
    `Code execution for ${lang} requires PISTON_URL or JUDGE0_URL. JavaScript works without configuration.`,
  );
}
