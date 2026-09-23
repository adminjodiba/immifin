/**
 * Environment gates for the OFLC loader.
 * assertDevOnlyTarget remains Dev-only (HUD and existing Dev tests).
 * assertLoaderTarget is the unified Dev + guarded Production entry.
 */

import {
  IMMIFIN_DEV_PROJECT_REF,
  IMMIFIN_PROD_PROJECT_REF,
} from "./constants";
import type { ImportIssue } from "./types";

export type TargetKind = "dev" | "production" | "unknown";

export type LoaderMode = "no-write" | "write";

export type TargetGuardInput = {
  /** Required explicit operator target. Only "dev" is accepted. */
  explicitTarget?: string | null;
  /** Supabase project ref. Never log the full value. */
  projectRef?: string | null;
  /** Write is rejected unless a later PO-approved task enables it. */
  write?: boolean;
  /** Write is unimplemented in this build and always blocked. */
  writeEnabledInBuild?: boolean;
};

export type LoaderTargetInput = {
  explicitTarget?: string | null;
  projectRef?: string | null;
  write?: boolean;
  writeEnabledInBuild?: boolean;
  confirmProduction?: boolean;
};

export type TargetGuardResult = {
  ok: boolean;
  mode: LoaderMode;
  targetKind: TargetKind;
  acceptDev: boolean;
  rejectProduction: boolean;
  issues: ImportIssue[];
};

export type LoaderTargetResult = TargetGuardResult & {
  acceptProduction: boolean;
  explicitKind: "dev" | "production" | "missing" | "unsupported";
  confirmProduction: boolean;
};

function issue(code: string, message: string): ImportIssue {
  return { severity: "error", code, message };
}

export function maskProjectRef(ref: string): string {
  const trimmed = ref.trim();
  if (trimmed.length < 8) return "(ref-too-short)";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function classifyProjectRef(ref: string | null | undefined): TargetKind {
  if (!ref) return "unknown";
  const value = ref.trim();
  if (
    value.startsWith(IMMIFIN_DEV_PROJECT_REF.prefix) &&
    value.endsWith(IMMIFIN_DEV_PROJECT_REF.suffix)
  ) {
    return "dev";
  }
  if (
    value.startsWith(IMMIFIN_PROD_PROJECT_REF.prefix) &&
    value.endsWith(IMMIFIN_PROD_PROJECT_REF.suffix)
  ) {
    return "production";
  }
  return "unknown";
}

export function normalizeExplicitTarget(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

export function assertDevOnlyTarget(input: TargetGuardInput): TargetGuardResult {
  const issues: ImportIssue[] = [];
  const explicit = normalizeExplicitTarget(input.explicitTarget);
  const targetKind = classifyProjectRef(input.projectRef);
  const writeRequested = input.write === true;
  const writeEnabledInBuild = input.writeEnabledInBuild === true;

  if (!explicit) {
    issues.push(issue("target_required", "Explicit --target is required. This loader accepts only --target dev."));
  } else if (explicit === "production" || explicit === "prod") {
    issues.push(
      issue(
        "production_blocked",
        `Production ${IMMIFIN_PROD_PROJECT_REF.mask} is hard-blocked. This loader is Dev-only.`
      )
    );
  } else if (explicit !== "dev") {
    issues.push(issue("unexpected_target", `Unsupported --target ${explicit}. Only "dev" is eligible.`));
  }

  if (targetKind === "production") {
    issues.push(
      issue(
        "production_project_blocked",
        `Project ref ${IMMIFIN_PROD_PROJECT_REF.mask} is Production and must never be written by this loader.`
      )
    );
  } else if (explicit === "dev" && targetKind === "unknown") {
    issues.push(
      issue(
        "unexpected_project",
        `Intended target is Dev ${IMMIFIN_DEV_PROJECT_REF.mask}, but the supplied project ref is not that Dev project.`
      )
    );
  } else if (explicit === "dev" && targetKind === "dev") {
    // accepted
  }

  if (writeRequested && !writeEnabledInBuild) {
    issues.push(
      issue(
        "write_disabled",
        "Write mode is reserved for a later Product Owner-approved Dev load. This build is no-write only."
      )
    );
  }

  if (writeRequested && targetKind !== "dev") {
    issues.push(issue("write_requires_dev", "Write mode, when later enabled, requires verified Dev vnhn...toxs."));
  }

  const rejectProduction =
    targetKind === "production" || explicit === "production" || explicit === "prod";
  const acceptDev = explicit === "dev" && targetKind === "dev" && !rejectProduction;
  const mode: LoaderMode = writeRequested && writeEnabledInBuild && acceptDev ? "write" : "no-write";

  return {
    ok: issues.length === 0,
    mode,
    targetKind,
    acceptDev,
    rejectProduction,
    issues,
  };
}

/**
 * Unified loader gate. Dev writes keep the proven Dev-only rules.
 * Production writes require --target production + --write + --confirm-production
 * + verified Production ref. Default is no-write.
 */
export function assertLoaderTarget(input: LoaderTargetInput): LoaderTargetResult {
  const issues: ImportIssue[] = [];
  const explicit = normalizeExplicitTarget(input.explicitTarget);
  const targetKind = classifyProjectRef(input.projectRef);
  const writeRequested = input.write === true;
  const writeEnabledInBuild = input.writeEnabledInBuild === true;
  const confirmProduction = input.confirmProduction === true;
  const explicitKind: LoaderTargetResult["explicitKind"] =
    !explicit ? "missing" : explicit === "dev" ? "dev" : explicit === "production" || explicit === "prod" ? "production" : "unsupported";

  if (explicitKind === "missing") {
    issues.push(issue("target_required", "Explicit --target is required. Use --target dev or --target production."));
  } else if (explicitKind === "unsupported") {
    issues.push(issue("unexpected_target", `Unsupported --target ${explicit}. Use "dev" or "production".`));
  }

  if (explicitKind === "dev") {
    if (targetKind === "production") {
      issues.push(
        issue(
          "production_project_blocked",
          `Project ref ${IMMIFIN_PROD_PROJECT_REF.mask} is Production and does not match --target dev.`
        )
      );
    } else if (targetKind === "unknown") {
      issues.push(
        issue(
          "unexpected_project",
          `Intended target is Dev ${IMMIFIN_DEV_PROJECT_REF.mask}, but the supplied project ref is not that Dev project.`
        )
      );
    }
    if (writeRequested && !writeEnabledInBuild) {
      issues.push(issue("write_disabled", "Write mode is disabled in this build."));
    }
    if (writeRequested && targetKind !== "dev") {
      issues.push(issue("write_requires_dev", "Dev write requires verified Dev vnhn...toxs."));
    }
  }

  if (explicitKind === "production") {
    if (targetKind !== "production") {
      issues.push(
        issue(
          "production_ref_mismatch",
          `Intended target is Production ${IMMIFIN_PROD_PROJECT_REF.mask}, but the supplied project ref is not that Production project.`
        )
      );
    }
    if (writeRequested && !confirmProduction) {
      issues.push(
        issue(
          "production_confirm_required",
          "Production write requires --confirm-production in addition to --target production --write."
        )
      );
    }
    if (writeRequested && !writeEnabledInBuild) {
      issues.push(issue("write_disabled", "Write mode is disabled in this build."));
    }
    if (writeRequested && targetKind !== "production") {
      issues.push(issue("write_requires_production", "Production write requires verified Production pmkx...ysdv."));
    }
  }

  if (writeRequested && explicitKind === "missing") {
    issues.push(issue("write_requires_target", "--write without an explicit --target is rejected."));
  }

  const rejectProduction =
    explicitKind === "dev" && (targetKind === "production" || explicit === "production" || explicit === "prod");
  const acceptDev = explicitKind === "dev" && targetKind === "dev" && !rejectProduction;
  const acceptProduction = explicitKind === "production" && targetKind === "production";
  const writeAuthorized =
    writeRequested &&
    writeEnabledInBuild &&
    ((acceptDev && explicitKind === "dev") ||
      (acceptProduction && confirmProduction && explicitKind === "production"));
  const mode: LoaderMode = writeAuthorized ? "write" : "no-write";
  const ok =
    issues.length === 0 &&
    (explicitKind === "dev" || explicitKind === "production") &&
    (explicitKind === "dev" ? acceptDev : acceptProduction);

  return {
    ok,
    mode,
    targetKind,
    acceptDev,
    acceptProduction,
    rejectProduction,
    explicitKind,
    confirmProduction,
    issues,
  };
}
