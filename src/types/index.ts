// src/types/index.ts

// =====================
// GitHub Raw Types
// =====================

export type GitHubProfile = {
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
  html_url: string;
};

export type GitHubRepo = {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  html_url: string;
};

export type GitHubCommit = {
  commit: {
    message: string;
    author?: {
      date?: string;
    };
  };
};

// =====================
// Extended Repo Type
// =====================

export type RepoWithDetails = GitHubRepo & {
  readme?: string | null;
  commits?: GitHubCommit[];
};

// =====================
// Analyzer Outputs
// =====================

export type ProfileSignal = {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  accountAgeYears: number;
  profileCompletenessScore: number;
  influenceScore: number;
  activityPotentialScore: number;
};

export type RepoSignal = {
  totalRepos: number;
  originalRepos: number;
  forkedRepos: number;
  archivedRepos: number;
  repoWithDescription: number;
  repoWithHomepage: number;
  totalStars: number;
  totalForks: number;
  averageRepoSize: number;
  uniqueLanguages: string[];
  languageDiversityScore: number;
  projectCompletenessScore: number;
  popularityScore: number;
  maintenanceScore: number;
};

export type ReadmeSignal = {
  hasReadme: boolean;
  readmeLength: number;
  headingCount: number;
  codeBlockCount: number;
  linkCount: number;
  imageCount: number;
  hasInstallationSection: boolean;
  hasUsageSection: boolean;
  hasFeatureSection: boolean;
  hasLicenseSection: boolean;
  documentationScore: number;
  clarityScore: number;
};

export type CommitSignal = {
  totalCommits: number;
  activeDays: number;
  averageMessageLength: number;
  semanticCommitRatio: number;
  consistencyScore: number;
  commitQualityScore: number;
};

// =====================
// Persona Types
// =====================

export type PersonaScores = {
  builder: number;
  explorer: number;
  soloThinker: number;
  collaborator: number;
  systematic: number;
  creative: number;
};

export type PersonaResult = {
  typeCode: string;
  personaName: string;
  tagline: string;
  scores: PersonaScores;
  summary: string;
  confidence: number;
};

export type EvidenceItem = {
  label: string;
  value: string | number;
  detail: string;
};

export type AnalysisMeta = {
  analyzedAt: string;
  repoLimit: number;
  reposFetched: number;
  rateLimit?: {
    limit?: number;
    remaining?: number;
    resetAt?: string;
  };
  warnings: string[];
};

// =====================
// Final Aggregated Output
// =====================

export type ExtractedSignals = {
  profileSignal: ProfileSignal;
  repoSignal: RepoSignal;
  readmeSignal: ReadmeSignal;
  commitSignal: CommitSignal;
};

export type FullAnalysisResult = {
  profile: GitHubProfile;
  signals: ExtractedSignals;
  persona: PersonaResult;
  evidence: EvidenceItem[];
  meta: AnalysisMeta;
  report: string;
};
