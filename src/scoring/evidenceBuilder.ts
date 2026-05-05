// src/scoring/evidenceBuilder.ts

import { EvidenceItem, ExtractedSignals } from "../types";

export function buildEvidence(signals: ExtractedSignals): EvidenceItem[] {
  const { repoSignal, readmeSignal, commitSignal, profileSignal } = signals;

  return [
    {
      label: "Project completion",
      value: `${repoSignal.projectCompletenessScore}/100`,
      detail: `${repoSignal.repoWithDescription} of ${repoSignal.totalRepos} analyzed repositories include descriptions.`,
    },
    {
      label: "Technology range",
      value: repoSignal.uniqueLanguages.length,
      detail:
        repoSignal.uniqueLanguages.length > 0
          ? `Detected ${repoSignal.uniqueLanguages.join(", ")}.`
          : "No primary repository languages were detected.",
    },
    {
      label: "Documentation",
      value: `${readmeSignal.documentationScore}/100`,
      detail: readmeSignal.hasReadme
        ? "README structure and core sections were present in the analyzed repositories."
        : "No README content was available in the analyzed repositories.",
    },
    {
      label: "Commit quality",
      value: `${commitSignal.commitQualityScore}/100`,
      detail: `${commitSignal.semanticCommitRatio}% of recent commits use semantic-style prefixes.`,
    },
    {
      label: "Community signal",
      value: `${profileSignal.influenceScore}/100`,
      detail: `${profileSignal.followers} followers, ${repoSignal.totalStars} stars, and ${repoSignal.totalForks} forks across analyzed repositories.`,
    },
  ];
}
