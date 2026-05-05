// src/analyzers/repoAnalyzer.ts

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

export type GitHubRepo = {
  name: string;
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
};

export function analyzeRepos(repos: GitHubRepo[]): RepoSignal {
  if (!repos || repos.length === 0) {
    return {
      totalRepos: 0,
      originalRepos: 0,
      forkedRepos: 0,
      archivedRepos: 0,
      repoWithDescription: 0,
      repoWithHomepage: 0,
      totalStars: 0,
      totalForks: 0,
      averageRepoSize: 0,
      uniqueLanguages: [],
      languageDiversityScore: 0,
      projectCompletenessScore: 0,
      popularityScore: 0,
      maintenanceScore: 0,
    };
  }

  const totalRepos = repos.length;
  const forkedRepos = repos.filter((repo) => repo.fork).length;
  const originalRepos = totalRepos - forkedRepos;
  const archivedRepos = repos.filter((repo) => repo.archived).length;

  const repoWithDescription = repos.filter(
    (repo) => repo.description && repo.description.trim().length > 0,
  ).length;

  const repoWithHomepage = repos.filter(
    (repo) => repo.homepage && repo.homepage.trim().length > 0,
  ).length;

  const totalStars = repos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0,
  );

  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

  const averageRepoSize = Math.round(
    repos.reduce((sum, repo) => sum + repo.size, 0) / totalRepos,
  );

  const uniqueLanguages = Array.from(
    new Set(repos.map((repo) => repo.language).filter(Boolean) as string[]),
  );

  const activeRepos = repos.filter((repo) =>
    isRecentlyUpdated(repo.pushed_at || repo.updated_at),
  ).length;

  const descriptionRatio = repoWithDescription / totalRepos;
  const homepageRatio = repoWithHomepage / totalRepos;
  const activeRepoRatio = activeRepos / totalRepos;
  const originalRepoRatio = originalRepos / totalRepos;

  const languageDiversityScore = normalize(uniqueLanguages.length, 1, 10);

  const projectCompletenessScore = Math.round(
    descriptionRatio * 45 +
      homepageRatio * 20 +
      originalRepoRatio * 20 +
      normalize(averageRepoSize, 100, 50000) * 0.15,
  );

  const popularityScore = Math.round(
    normalize(totalStars, 0, 100) * 0.7 + normalize(totalForks, 0, 50) * 0.3,
  );

  const maintenanceScore = Math.round(
    activeRepoRatio * 70 + (1 - archivedRepos / totalRepos) * 30,
  );

  return {
    totalRepos,
    originalRepos,
    forkedRepos,
    archivedRepos,
    repoWithDescription,
    repoWithHomepage,
    totalStars,
    totalForks,
    averageRepoSize,
    uniqueLanguages,
    languageDiversityScore,
    projectCompletenessScore,
    popularityScore,
    maintenanceScore,
  };
}

function isRecentlyUpdated(dateString?: string | null): boolean {
  if (!dateString) return false;

  const updatedDate = new Date(dateString);
  const now = new Date();

  const diffDays =
    (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays <= 180;
}

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;

  return Math.round(((value - min) / (max - min)) * 100);
}
