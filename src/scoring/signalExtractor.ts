// src/scoring/signalExtractor.ts

import { analyzeProfile } from "../analyzers/profileAnalyzer";
import { analyzeRepos, GitHubRepo } from "../analyzers/repoAnalyzer";
import { analyzeReadme, ReadmeSignal } from "../analyzers/readmeAnalyzer";
import { analyzeCommits, CommitSignal } from "../analyzers/commitAnalyzer";

type GitHubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog?: string | null;
  company?: string | null;
  email?: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

type RepoWithDetails = GitHubRepo & {
  readme?: string | null;
  commits?: Array<{
    commit: {
      message: string;
      author?: {
        date?: string;
      };
    };
  }>;
};

type ExtractedSignals = {
  profileSignal: ReturnType<typeof analyzeProfile>;
  repoSignal: ReturnType<typeof analyzeRepos>;
  readmeSignal: ReadmeSignal;
  commitSignal: CommitSignal;
};

export function extractSignals(
  profile: GitHubProfile,
  repos: RepoWithDetails[],
): ExtractedSignals {
  const profileSignal = analyzeProfile(profile);

  const repoSignal = analyzeRepos(repos);

  const readmeSignal = aggregateReadmeSignals(
    repos.map((repo) => analyzeReadme(repo.readme)),
  );

  const commitSignal = aggregateCommitSignals(
    repos.flatMap((repo) => repo.commits || []),
  );

  return {
    profileSignal,
    repoSignal,
    readmeSignal,
    commitSignal,
  };
}

function aggregateReadmeSignals(signals: ReadmeSignal[]): ReadmeSignal {
  if (!signals.length) {
    return analyzeReadme(null);
  }

  const reposWithReadme = signals.filter((signal) => signal.hasReadme);
  const divisor = Math.max(reposWithReadme.length, 1);
  const coverageRatio = reposWithReadme.length / signals.length;
  const coveragePenalty = Math.max(0.35, coverageRatio);

  return {
    hasReadme: reposWithReadme.length > 0,
    readmeLength: average(
      reposWithReadme.map((s) => s.readmeLength),
      divisor,
    ),
    headingCount: average(
      reposWithReadme.map((s) => s.headingCount),
      divisor,
    ),
    codeBlockCount: average(
      reposWithReadme.map((s) => s.codeBlockCount),
      divisor,
    ),
    linkCount: average(
      reposWithReadme.map((s) => s.linkCount),
      divisor,
    ),
    imageCount: average(
      reposWithReadme.map((s) => s.imageCount),
      divisor,
    ),
    hasInstallationSection:
      ratioBoolean(reposWithReadme.map((s) => s.hasInstallationSection)) >= 50,
    hasUsageSection:
      ratioBoolean(reposWithReadme.map((s) => s.hasUsageSection)) >= 50,
    hasFeatureSection:
      ratioBoolean(reposWithReadme.map((s) => s.hasFeatureSection)) >= 50,
    hasLicenseSection:
      ratioBoolean(reposWithReadme.map((s) => s.hasLicenseSection)) >= 50,
    documentationScore: Math.round(
      average(
        reposWithReadme.map((s) => s.documentationScore),
        divisor,
      ) * coveragePenalty,
    ),
    clarityScore: Math.round(
      average(
        reposWithReadme.map((s) => s.clarityScore),
        divisor,
      ) * coveragePenalty,
    ),
  };
}

function aggregateCommitSignals(
  commits: RepoWithDetails["commits"],
): CommitSignal {
  return analyzeCommits(commits || []);
}

function average(values: number[], divisor?: number): number {
  if (!values.length) return 0;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / (divisor || values.length));
}

function ratioBoolean(values: boolean[]): number {
  if (!values.length) return 0;

  const trueCount = values.filter(Boolean).length;
  return Math.round((trueCount / values.length) * 100);
}
