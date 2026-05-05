// src/analyzers/commitAnalyzer.ts

export type CommitSignal = {
  totalCommits: number;
  activeDays: number;
  averageMessageLength: number;
  semanticCommitRatio: number;
  consistencyScore: number;
  commitQualityScore: number;
};

type GitHubCommit = {
  commit: {
    message: string;
    author?: {
      date?: string;
    };
  };
};

const SEMANTIC_PREFIXES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "test",
  "chore",
  "perf",
  "ci",
  "build",
  "revert",
];

export function analyzeCommits(commits: GitHubCommit[]): CommitSignal {
  if (!commits || commits.length === 0) {
    return {
      totalCommits: 0,
      activeDays: 0,
      averageMessageLength: 0,
      semanticCommitRatio: 0,
      consistencyScore: 0,
      commitQualityScore: 0,
    };
  }

  const totalCommits = commits.length;

  const commitMessages = commits.map((item) => item.commit.message || "");

  const averageMessageLength =
    commitMessages.reduce((sum, message) => sum + message.length, 0) /
    totalCommits;

  const semanticCommitCount = commitMessages.filter(isSemanticCommit).length;

  const semanticCommitRatio = Math.round(
    (semanticCommitCount / totalCommits) * 100,
  );

  const activeDaysSet = new Set(
    commits
      .map((item) => item.commit.author?.date)
      .filter(Boolean)
      .map((date) => new Date(date as string).toISOString().split("T")[0]),
  );

  const activeDays = activeDaysSet.size;

  const consistencyScore = normalize(activeDays, 1, 30);

  const messageQualityScore = normalize(averageMessageLength, 10, 80);

  const commitQualityScore = Math.round(
    messageQualityScore * 0.5 + semanticCommitRatio * 0.5,
  );

  return {
    totalCommits,
    activeDays,
    averageMessageLength: Math.round(averageMessageLength),
    semanticCommitRatio,
    consistencyScore,
    commitQualityScore,
  };
}

function isSemanticCommit(message: string): boolean {
  const firstLine = message.split("\n")[0].toLowerCase();

  return SEMANTIC_PREFIXES.some(
    (prefix) =>
      firstLine.startsWith(`${prefix}:`) || firstLine.startsWith(`${prefix}(`),
  );
}

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;

  return Math.round(((value - min) / (max - min)) * 100);
}
