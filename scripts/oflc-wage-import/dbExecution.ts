/**
 * Testable Supabase CLI execution boundary.
 * Dev uses --linked. Production uses --project-ref only.
 * Never emits supabase link. Never prints secrets.
 */

import type { TargetKind } from "./targetGuard";
import {
  IMMIFIN_DEV_PROJECT_NAME,
  IMMIFIN_DEV_PROJECT_REF,
  IMMIFIN_PROD_PROJECT_NAME,
  IMMIFIN_PROD_PROJECT_REF,
} from "./constants";
import { classifyProjectRef, maskProjectRef, normalizeExplicitTarget } from "./targetGuard";

export type ListedProject = {
  name: string;
  id: string;
  linked: boolean;
};

export type ResolvedDbTarget = {
  kind: "dev" | "production";
  name: string;
  maskedRef: string;
  projectRef: string;
};

export type QueryMode = "read" | "write";

function namesEqual(actual: string, expected: string): boolean {
  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

export function commandContainsLink(args: readonly string[]): boolean {
  return args.some((arg) => arg === "link" || arg.startsWith("link="));
}

export function commandUsesLinkedFlag(args: readonly string[]): boolean {
  return args.includes("--linked");
}

export function commandUsesProjectRefFlag(args: readonly string[]): boolean {
  return args.includes("--project-ref");
}

export function buildSupabaseQueryArgs(input: {
  kind: TargetKind;
  projectRef: string;
  filePath: string;
  mode: QueryMode;
}): { ok: true; args: string[] } | { ok: false; args: []; issues: string[] } {
  const issues: string[] = [];
  const ref = input.projectRef.trim();
  if (!ref) issues.push("project_ref_required");
  if (input.kind === "unknown") issues.push("unknown_target_execution_blocked");
  if (input.kind === "dev" && classifyProjectRef(ref) !== "dev") issues.push("dev_execution_requires_dev_ref");
  if (input.kind === "production" && classifyProjectRef(ref) !== "production") {
    issues.push("production_execution_requires_production_ref");
  }
  if (issues.length > 0) return { ok: false, args: [], issues };

  const args =
    input.kind === "dev"
      ? ["db", "query", "--linked", "--file", input.filePath]
      : ["db", "query", "--project-ref", ref, "--file", input.filePath];

  if (input.kind === "production" && commandUsesLinkedFlag(args)) {
    return { ok: false, args: [], issues: ["production_must_not_use_linked"] };
  }
  if (commandContainsLink(args)) {
    return { ok: false, args: [], issues: ["supabase_link_forbidden"] };
  }
  return { ok: true, args };
}

export function buildProductionInspectArgs(projectRef: string): { ok: true; args: string[] } | { ok: false; issues: string[] } {
  const ref = projectRef.trim();
  if (classifyProjectRef(ref) !== "production") {
    return { ok: false, issues: ["production_inspect_requires_production_ref"] };
  }
  const args = ["inspect", "db", "table-stats", "--project-ref", ref];
  if (commandUsesLinkedFlag(args) || commandContainsLink(args)) {
    return { ok: false, issues: ["production_must_not_use_linked"] };
  }
  return { ok: true, args };
}

export function buildProductionMigrationListArgs(projectRef: string): { ok: true; args: string[] } | { ok: false; issues: string[] } {
  const ref = projectRef.trim();
  if (classifyProjectRef(ref) !== "production") {
    return { ok: false, issues: ["production_migration_list_requires_production_ref"] };
  }
  const args = ["migration", "list", "--project-ref", ref];
  if (commandUsesLinkedFlag(args) || commandContainsLink(args)) {
    return { ok: false, issues: ["production_must_not_use_linked"] };
  }
  return { ok: true, args };
}

export function resolveDbTarget(input: {
  explicitTarget?: string | null;
  projects: readonly ListedProject[];
}): { ok: true; target: ResolvedDbTarget } | { ok: false; issues: string[] } {
  const explicit = normalizeExplicitTarget(input.explicitTarget);
  const linked = input.projects.find((row) => row.linked);
  const issues: string[] = [];

  if (!explicit) {
    return { ok: false, issues: ["target_required"] };
  }

  if (explicit === "dev") {
    if (!linked) return { ok: false, issues: ["dev_requires_linked_project"] };
    if (classifyProjectRef(linked.id) !== "dev") {
      return { ok: false, issues: ["dev_linked_ref_mismatch"] };
    }
    if (linked.name && !namesEqual(linked.name, IMMIFIN_DEV_PROJECT_NAME)) {
      return { ok: false, issues: ["dev_project_name_mismatch"] };
    }
    return {
      ok: true,
      target: {
        kind: "dev",
        name: linked.name || IMMIFIN_DEV_PROJECT_NAME,
        maskedRef: maskProjectRef(linked.id),
        projectRef: linked.id,
      },
    };
  }

  if (explicit === "production" || explicit === "prod") {
    const prod = input.projects.find((row) => classifyProjectRef(row.id) === "production");
    if (!prod) return { ok: false, issues: ["production_project_not_found"] };
    if (!namesEqual(prod.name, IMMIFIN_PROD_PROJECT_NAME)) {
      issues.push("production_project_name_mismatch");
    }
    if (linked && classifyProjectRef(linked.id) === "production") {
      issues.push("repo_must_not_be_linked_to_production");
    }
    if (issues.length > 0) return { ok: false, issues };
    return {
      ok: true,
      target: {
        kind: "production",
        name: prod.name || IMMIFIN_PROD_PROJECT_NAME,
        maskedRef: IMMIFIN_PROD_PROJECT_REF.mask,
        projectRef: prod.id,
      },
    };
  }

  return { ok: false, issues: ["unsupported_target"] };
}

export function describeResolvedTarget(target: ResolvedDbTarget): {
  target: "DEV" | "PRODUCTION";
  maskedRef: string;
  name: string;
} {
  return {
    target: target.kind === "production" ? "PRODUCTION" : "DEV",
    maskedRef: target.kind === "production" ? IMMIFIN_PROD_PROJECT_REF.mask : IMMIFIN_DEV_PROJECT_REF.mask,
    name: target.name,
  };
}
