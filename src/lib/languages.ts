/**
 * Canonical registry of the programming languages a coding arena can run in.
 *
 * One source of truth shared by:
 *  - the AI analyser (which language did the task ask for?)
 *  - the create flow (language picker + badge)
 *  - the arena editor (file extension, starter template)
 *  - the code runner (Judge0 language id / Piston runtime name)
 *
 * `key` is what we persist on the room and send to the runner.
 */
export type LanguageKey =
  | "python"
  | "javascript"
  | "typescript"
  | "java"
  | "cpp"
  | "c"
  | "go"
  | "rust"
  | "ruby"
  | "php"
  | "csharp";

export interface LanguageSpec {
  key: LanguageKey;
  label: string;
  ext: string;
  /** Judge0 CE language id (stable across the public CE image). */
  judge0Id: number;
  /** Piston runtime name (used with version "*" on a self-hosted instance). */
  piston: string;
  /** JDoodle compiler-API language code + default versionIndex. */
  jdoodle: { language: string; versionIndex: string };
  /** Fallback starter program that reads ALL of stdin and prints the answer to stdout. */
  template: string;
}

export const LANGUAGES: Record<LanguageKey, LanguageSpec> = {
  python: {
    key: "python",
    label: "Python",
    ext: "py",
    judge0Id: 71,
    piston: "python",
    jdoodle: { language: "python3", versionIndex: "5" },
    template: `import sys

data = sys.stdin.read().strip()
# Read the input above, then print your answer.
`,
  },
  javascript: {
    key: "javascript",
    label: "JavaScript",
    ext: "js",
    judge0Id: 63,
    piston: "javascript",
    jdoodle: { language: "nodejs", versionIndex: "4" },
    template: `const data = require("fs").readFileSync(0, "utf8").trim();
// Read the input above, then console.log your answer.
`,
  },
  typescript: {
    key: "typescript",
    label: "TypeScript",
    ext: "ts",
    judge0Id: 74,
    piston: "typescript",
    jdoodle: { language: "typescript", versionIndex: "4" },
    template: `const data: string = require("fs").readFileSync(0, "utf8").trim();
// Read the input above, then console.log your answer.
`,
  },
  java: {
    key: "java",
    label: "Java",
    ext: "java",
    judge0Id: 62,
    piston: "java",
    jdoodle: { language: "java", versionIndex: "4" },
    template: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    // Read input with sc, then System.out.println your answer.
  }
}
`,
  },
  cpp: {
    key: "cpp",
    label: "C++",
    ext: "cpp",
    judge0Id: 54,
    piston: "c++",
    jdoodle: { language: "cpp17", versionIndex: "1" },
    template: `#include <bits/stdc++.h>
using namespace std;

int main() {
  // Read from cin, then print your answer with cout.
  return 0;
}
`,
  },
  c: {
    key: "c",
    label: "C",
    ext: "c",
    judge0Id: 50,
    piston: "c",
    jdoodle: { language: "c", versionIndex: "5" },
    template: `#include <stdio.h>

int main() {
  // Read from stdin with scanf/fgets, then printf your answer.
  return 0;
}
`,
  },
  go: {
    key: "go",
    label: "Go",
    ext: "go",
    judge0Id: 60,
    piston: "go",
    jdoodle: { language: "go", versionIndex: "4" },
    template: `package main

import (
  "bufio"
  "fmt"
  "os"
)

func main() {
  reader := bufio.NewReader(os.Stdin)
  _ = reader
  // Read input, then fmt.Println your answer.
}
`,
  },
  rust: {
    key: "rust",
    label: "Rust",
    ext: "rs",
    judge0Id: 73,
    piston: "rust",
    jdoodle: { language: "rust", versionIndex: "4" },
    template: `use std::io::{self, Read};

fn main() {
  let mut input = String::new();
  io::stdin().read_to_string(&mut input).unwrap();
  // Use input, then println! your answer.
}
`,
  },
  ruby: {
    key: "ruby",
    label: "Ruby",
    ext: "rb",
    judge0Id: 72,
    piston: "ruby",
    jdoodle: { language: "ruby", versionIndex: "4" },
    template: `data = STDIN.read.strip
# Read the input above, then puts your answer.
`,
  },
  php: {
    key: "php",
    label: "PHP",
    ext: "php",
    judge0Id: 68,
    piston: "php",
    jdoodle: { language: "php", versionIndex: "4" },
    template: `<?php
$data = trim(file_get_contents("php://stdin"));
// Read the input above, then echo your answer.
`,
  },
  csharp: {
    key: "csharp",
    label: "C#",
    ext: "cs",
    judge0Id: 51,
    piston: "csharp",
    jdoodle: { language: "csharp", versionIndex: "4" },
    template: `using System;

class Main {
  static void Main() {
    string data = Console.In.ReadToEnd().Trim();
    // Read the input above, then Console.WriteLine your answer.
  }
}
`,
  },
};

export const LANGUAGE_KEYS = Object.keys(LANGUAGES) as LanguageKey[];

export function isLanguageKey(v: string | null | undefined): v is LanguageKey {
  return !!v && v in LANGUAGES;
}

export function getLanguage(v: string | null | undefined): LanguageSpec {
  return isLanguageKey(v) ? LANGUAGES[v] : LANGUAGES.javascript;
}
