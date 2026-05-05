// src/collectors/githubCollector.ts

import axios, { AxiosResponse } from "axios";

import {
  AnalysisMeta,
  GitHubCommit,
  GitHubProfile,
  GitHubRepo,
} from "../types";

type RepoWithDetails = GitHubRepo & {
  readme?: string | null;
  commits?: GitHubCommit[];
};

type CollectionResult = {
  profile: GitHubProfile;
  repos: RepoWithDetails[];
  meta: AnalysisMeta;
};

const DEFAULT_REPO_LIMIT = 20;
const MAX_REPO_LIMIT = 50;
const DETAIL_CONCURRENCY = 4;

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: process.env.GITHUB_TOKEN
      ? `Bearer ${process.env.GITHUB_TOKEN}`
      : undefined,
  },
});

export async function getGitHubProfile(
  username: string,
): Promise<GitHubProfile> {
  const response = await githubApi.get<GitHubProfile>(`/users/${username}`);
  return response.data;
}

export async function getUserRepos(
  username: string,
  limit = DEFAULT_REPO_LIMIT,
): Promise<GitHubRepo[]> {
  const response = await githubApi.get<GitHubRepo[]>(
    `/users/${username}/repos`,
    {
      params: {
        sort: "updated",
        direction: "desc",
        per_page: clampRepoLimit(limit),
      },
    },
  );

  return response.data;
}

export async function getRepoReadme(
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const response = await githubApi.get(`/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: "application/vnd.github.raw",
      },
    });

    return typeof response.data === "string" ? response.data : null;
  } catch {
    return null;
  }
}

export async function getRepoCommits(
  owner: string,
  repo: string,
  limit = 30,
): Promise<GitHubCommit[]> {
  try {
    const response = await githubApi.get<GitHubCommit[]>(
      `/repos/${owner}/${repo}/commits`,
      {
        params: {
          per_page: limit,
        },
      },
    );

    return response.data;
  } catch {
    return [];
  }
}

export async function collectGitHubData(
  username: string,
  repoLimit = DEFAULT_REPO_LIMIT,
): Promise<CollectionResult> {
  const limit = clampRepoLimit(repoLimit);
  const warnings: string[] = [];

  const profileResponse = await githubApi.get<GitHubProfile>(
    `/users/${username}`,
  );
  const profile = profileResponse.data;
  let rateLimit = readRateLimit(profileResponse);

  const reposResponse = await githubApi.get<GitHubRepo[]>(
    `/users/${username}/repos`,
    {
      params: {
        sort: "updated",
        direction: "desc",
        per_page: limit,
      },
    },
  );
  const repos = reposResponse.data;
  rateLimit = readRateLimit(reposResponse) || rateLimit;

  const repoDetails = await mapWithConcurrency(
    repos,
    DETAIL_CONCURRENCY,
    async (repo) => {
      try {
        const readme = await getRepoReadme(username, repo.name);
        const commits = await getRepoCommits(username, repo.name);

        return {
          ...repo,
          readme,
          commits,
        };
      } catch (error) {
        warnings.push(
          `Skipped details for ${repo.full_name}: ${getErrorMessage(error)}`,
        );
        return {
          ...repo,
          readme: null,
          commits: [],
        };
      }
    },
  );

  return {
    profile,
    repos: repoDetails,
    meta: {
      analyzedAt: new Date().toISOString(),
      repoLimit: limit,
      reposFetched: repos.length,
      rateLimit,
      warnings,
    },
  };
}

function clampRepoLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_REPO_LIMIT;
  return Math.max(1, Math.min(MAX_REPO_LIMIT, Math.round(limit)));
}

function readRateLimit(
  response: AxiosResponse<unknown>,
): AnalysisMeta["rateLimit"] | undefined {
  const limit = Number(response.headers["x-ratelimit-limit"]);
  const remaining = Number(response.headers["x-ratelimit-remaining"]);
  const reset = Number(response.headers["x-ratelimit-reset"]);

  if (
    !Number.isFinite(limit) &&
    !Number.isFinite(remaining) &&
    !Number.isFinite(reset)
  ) {
    return undefined;
  }

  return {
    limit: Number.isFinite(limit) ? limit : undefined,
    remaining: Number.isFinite(remaining) ? remaining : undefined,
    resetAt: Number.isFinite(reset)
      ? new Date(reset * 1000).toISOString()
      : undefined,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}
