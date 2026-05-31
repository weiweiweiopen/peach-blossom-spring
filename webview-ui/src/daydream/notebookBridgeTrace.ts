export interface PbsNotebookBridgeSource {
  id: string;
  title: string;
  url?: string;
  summary: string;
  sourceRefs: string[];
  privacy: "public-or-approved";
  status: "needs-review" | "promoted" | "rejected";
}

export interface PbsNotebookBridgeTrace {
  schemaVersion: "pbs-notebooklm-bridge-trace-v1";
  traceId: string;
  createdAt: string;
  query: string;
  bridge: {
    label: "PBS-2026.2 NotebookLM bridge";
    notebookId?: string | null;
    mode: "manual-public-source-packet" | "notebooklm-cli" | "local-public-evidence";
    durableMemory: false;
    privacyRules: string[];
    ownershipRules: string[];
  };
  primarySourcePacket: PbsNotebookBridgeSource[];
  compiledWikiNotes: unknown[];
  review: {
    status: "needs-human-review" | "reviewed" | "promoted";
    promotionTargets: string[];
    rawSourcesMutation: "forbidden-by-default";
    canonicalMemory: "obsidian-vault/Wiki markdown notes";
    auditTrail: "git diff and commit history";
  };
}

export function isPbsNotebookBridgeTrace(value: unknown): value is PbsNotebookBridgeTrace {
  const trace = value as Partial<PbsNotebookBridgeTrace> | null;
  return Boolean(
    trace &&
    trace.schemaVersion === "pbs-notebooklm-bridge-trace-v1" &&
    typeof trace.traceId === "string" &&
    typeof trace.query === "string" &&
    Array.isArray(trace.primarySourcePacket),
  );
}
