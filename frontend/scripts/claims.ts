// Claim status. Plain Node (type stripping), run by .github/workflows/claims.yml.
//
//   node scripts/claims.ts <open-issues.json> <out-dir>
//
// Reads the open "in progress" issues (GitHub REST JSON) and writes out-dir/status/<id>.json for
// every help-wanted sensor and piece of integration work: a shields.io endpoint badge that says
// "open" or who is building it. The README and SENSORS.md show these badges.
//
// Issue text is untrusted. It is only compared with the claim form's known dropdown options, and
// the only thing copied out of an issue is the author's GitHub login, checked against GitHub's
// login format.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { claimItems, loadCatalog, loadProfiles, type ClaimItem } from "./catalog.ts";

export interface Issue {
  number: number;
  user?: { login?: string } | null;
  body?: string | null;
  pull_request?: unknown;
}
export interface Badge { schemaVersion: 1; label: string; message: string; color: string; cacheSeconds: number }

const OPEN = "2ea043";
const TAKEN = "c2410c";
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})(?:\[bot\])?$/;

/** The answer to the claim form's "Sensor or work" dropdown, as GitHub renders it in the issue body. */
export function claimedOption(body: string | null | undefined): string | null {
  const m = /^###\s+Sensor(?: or work)?\s*\r?\n+\s*(.+?)\s*$/m.exec(body ?? "");
  return m ? m[1] : null;
}

export function statuses(items: ClaimItem[], issues: Issue[]): Record<string, Badge> {
  const claimers = new Map<string, string[]>();
  for (const issue of [...issues].sort((a, b) => a.number - b.number)) {
    if (issue.pull_request) continue;
    const item = items.find((i) => i.option === claimedOption(issue.body));
    if (!item) continue;
    const login = issue.user?.login ?? "";
    claimers.set(item.id, [...(claimers.get(item.id) ?? []), LOGIN.test(login) ? `@${login}` : "someone"]);
  }
  return Object.fromEntries(
    items.map((i) => {
      const who = claimers.get(i.id) ?? [];
      const message = who.length === 0 ? "open" : who.length === 1 ? who[0] : `${who[0]} +${who.length - 1}`;
      return [i.id, { schemaVersion: 1, label: "", message, color: who.length ? TAKEN : OPEN, cacheSeconds: 300 }];
    }),
  );
}

function main() {
  const [issuesFile, outDir] = process.argv.slice(2);
  if (!issuesFile || !outDir) throw new Error("usage: node scripts/claims.ts <open-issues.json> <out-dir>");
  const raw = JSON.parse(readFileSync(issuesFile, "utf8"));
  const issues: Issue[] = (Array.isArray(raw[0]) ? raw.flat() : raw) as Issue[]; // gh api --paginate --slurp gives pages
  const profileIds = new Set(Object.values(loadProfiles()).map((p) => p.id));
  const result = statuses(claimItems(loadCatalog(), profileIds), issues);
  mkdirSync(join(outDir, "status"), { recursive: true });
  for (const [id, badge] of Object.entries(result)) writeFileSync(join(outDir, "status", `${id}.json`), JSON.stringify(badge) + "\n");
  writeFileSync(
    join(outDir, "README.md"),
    "# Claim status\n\nWritten by the **Claim status** workflow from open `in progress` issues. Don't edit: every run replaces this branch.\n",
  );
  for (const [id, b] of Object.entries(result)) console.log(`${id}: ${b.message}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
