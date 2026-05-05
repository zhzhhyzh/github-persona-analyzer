// src/generators/reportGenerator.ts

import {
  AnalysisMeta,
  CommitSignal,
  EvidenceItem,
  PersonaResult,
  ReadmeSignal,
  RepoSignal,
} from "../types";

type ReportInput = {
  profile: {
    html_url: string;
    login: string;
    public_repos: number;
    followers: number;
    following: number;
  };
  repoSignal: RepoSignal;
  readmeSignal: ReadmeSignal;
  commitSignal: CommitSignal;
  persona: PersonaResult;
  evidence: EvidenceItem[];
  meta: AnalysisMeta;
};

export function generateReport({
  profile,
  repoSignal,
  readmeSignal,
  commitSignal,
  persona,
  evidence,
  meta,
}: ReportInput): string {
  const analyzedAt = meta.analyzedAt.split("T")[0];

  return `# GitHub Persona Report

**GitHub Profile:** ${profile.html_url}  
**Username:** ${profile.login}  
**Analyzed At:** ${analyzedAt}  
**Confidence:** ${persona.confidence}/100

---

## Developer Persona

**Persona Name:** ${persona.personaName}  
**Type Code:** ${persona.typeCode}  
**Tagline:** ${persona.tagline}

> ${persona.summary}

---

## Personality Breakdown

| Dimension | Score |
|----------|------:|
| Builder | ${persona.scores.builder} |
| Explorer | ${persona.scores.explorer} |
| Solo Thinker | ${persona.scores.soloThinker} |
| Collaborator | ${persona.scores.collaborator} |
| Systematic | ${persona.scores.systematic} |
| Creative | ${persona.scores.creative} |

---

## Evidence

${toEvidenceList(evidence)}

---

## GitHub Signals

### Profile
- Public repositories: ${profile.public_repos}
- Followers: ${profile.followers}
- Following: ${profile.following}

### Repository
- Total analyzed repos: ${repoSignal.totalRepos}
- Original repos: ${repoSignal.originalRepos}
- Forked repos: ${repoSignal.forkedRepos}
- Archived repos: ${repoSignal.archivedRepos}
- Total stars: ${repoSignal.totalStars}
- Total forks: ${repoSignal.totalForks}
- Main languages: ${repoSignal.uniqueLanguages.join(", ") || "Not detected"}
- Maintenance score: ${repoSignal.maintenanceScore}

### README
- README available: ${readmeSignal.hasReadme ? "Yes" : "No"}
- Documentation score: ${readmeSignal.documentationScore}
- Clarity score: ${readmeSignal.clarityScore}

### Commits
- Total analyzed commits: ${commitSignal.totalCommits}
- Active days: ${commitSignal.activeDays}
- Semantic commit ratio: ${commitSignal.semanticCommitRatio}%
- Commit quality score: ${commitSignal.commitQualityScore}

---

## Strengths

${generateStrengths(persona.typeCode, persona.scores)}

---

## Growth Opportunities

${generateGrowthAreas(persona.typeCode, persona.scores, readmeSignal, commitSignal)}

---

## Recommendation

${generateRecommendation(persona.typeCode, persona.confidence)}

---

## Analysis Notes

- Repository detail limit: ${meta.repoLimit}
- Repositories fetched: ${meta.reposFetched}
${meta.rateLimit?.remaining !== undefined ? `- GitHub API remaining requests: ${meta.rateLimit.remaining}` : "- GitHub API remaining requests: Not available"}
${meta.warnings.length ? meta.warnings.map((warning) => `- Warning: ${warning}`).join("\n") : "- Warnings: None"}

---

## Disclaimer

This report is generated from publicly available GitHub data and heuristic analysis. It is intended for educational and exploratory use, not as a scientifically validated personality assessment.
`;
}

function toEvidenceList(evidence: EvidenceItem[]): string {
  if (!evidence.length) {
    return "- Not enough public data was available to produce strong evidence.";
  }

  return evidence
    .map((item) => `- **${item.label}:** ${item.value} - ${item.detail}`)
    .join("\n");
}

function generateStrengths(
  typeCode: string,
  scores: PersonaResult["scores"],
): string {
  const strengths: Record<string, string[]> = {
    "B-S-S": [
      "Strong project ownership",
      "Clear engineering structure",
      "Consistent documentation habits",
    ],
    "B-S-C": [
      "Good balance between product thinking and creativity",
      "Able to build usable projects independently",
      "Shows practical execution ability",
    ],
    "B-C-S": [
      "Strong teamwork signal",
      "Good structured engineering habits",
      "Likely comfortable in team-based development",
    ],
    "B-C-C": [
      "Strong collaborative mindset",
      "Creative project expression",
      "Good potential for product and community-driven work",
    ],
    "E-S-S": [
      "Strong technical curiosity",
      "Good self-learning ability",
      "Likely enjoys researching new tools and concepts",
    ],
    "E-S-C": [
      "High creativity and experimentation",
      "Strong side-project potential",
      "Good ability to explore new ideas independently",
    ],
    "E-C-S": [
      "Good open-source potential",
      "Strong technical exploration with structure",
      "Comfortable learning across different repositories",
    ],
    "E-C-C": [
      "Highly exploratory mindset",
      "Strong community and collaboration signals",
      "Creative approach to software development",
    ],
  };

  const adaptiveStrengths = [
    scores.builder >= 70
      ? "Completes and maintains visible project work"
      : null,
    scores.collaborator >= 70
      ? "Shows public collaboration and community signal"
      : null,
    scores.systematic >= 70
      ? "Presents work in a structured, readable way"
      : null,
  ].filter(Boolean) as string[];

  return toMarkdownList([
    ...new Set([...(strengths[typeCode] || []), ...adaptiveStrengths]),
  ]);
}

function generateGrowthAreas(
  typeCode: string,
  scores: PersonaResult["scores"],
  readmeSignal: ReadmeSignal,
  commitSignal: CommitSignal,
): string {
  const growthAreas: Record<string, string[]> = {
    "B-S-S": [
      "Increase collaboration through pull requests or open-source contributions",
      "Experiment with more diverse technologies",
      "Add more creative or public-facing projects",
    ],
    "B-S-C": [
      "Improve systematic documentation",
      "Add testing or CI/CD workflows",
      "Join collaborative repositories",
    ],
    "B-C-S": [
      "Add more experimental side projects",
      "Showcase personal creativity through demos",
      "Build more public portfolio projects",
    ],
    "B-C-C": [
      "Improve project structure and documentation",
      "Add clearer technical explanations",
      "Strengthen backend or architecture-focused projects",
    ],
    "E-S-S": [
      "Complete more projects instead of only experimenting",
      "Add more public collaboration",
      "Create clearer README documentation",
    ],
    "E-S-C": [
      "Improve project completion rate",
      "Add stronger technical structure",
      "Contribute to team or open-source projects",
    ],
    "E-C-S": [
      "Focus on completing fewer but deeper projects",
      "Add more personal portfolio projects",
      "Improve project storytelling",
    ],
    "E-C-C": [
      "Improve consistency and project completion",
      "Add clearer repo organization",
      "Strengthen long-term project maintenance",
    ],
  };

  const adaptiveGrowth = [
    readmeSignal.documentationScore < 55
      ? "Add installation, usage, and feature sections to important READMEs"
      : null,
    commitSignal.commitQualityScore < 55
      ? "Use clearer commit messages so project history tells a stronger story"
      : null,
    scores.collaborator < 35
      ? "Pin or contribute to shared projects to show collaboration signal"
      : null,
  ].filter(Boolean) as string[];

  return toMarkdownList([
    ...new Set([...(growthAreas[typeCode] || []), ...adaptiveGrowth]),
  ]);
}

function generateRecommendation(typeCode: string, confidence: number): string {
  const recommendations: Record<string, string> = {
    "B-S-S":
      "Keep building complete projects, then add one or two public collaborations to make the profile feel more rounded.",
    "B-S-C":
      "Continue shipping creative projects, but make documentation, tests, and setup instructions more consistent.",
    "B-C-S":
      "You already show team and structure signals. Add a few distinctive side projects to make the profile more memorable.",
    "B-C-C":
      "Lean into collaborative and creative strengths while making architecture and technical tradeoffs easier to inspect.",
    "E-S-S":
      "Turn technical exploration into finished portfolio projects with strong README files and clear use cases.",
    "E-S-C":
      "The creative signal is strong. Focus on finishing projects and adding cleaner structure around the best ideas.",
    "E-C-S":
      "Use the exploration and collaboration signal as a base, then polish a few personal projects to show ownership.",
    "E-C-C":
      "Keep the community-driven energy, but add more structure, documentation, and long-term maintenance.",
  };

  const confidenceNote =
    confidence < 45
      ? " Because confidence is modest, treat this as a directional read and analyze more repositories for a sharper result."
      : "";

  return `${recommendations[typeCode] || "Continue improving profile clarity, documentation, and consistency."}${confidenceNote}`;
}

function toMarkdownList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}
