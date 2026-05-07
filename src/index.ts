// src/index.ts

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";

import { collectGitHubData } from "./collectors/githubCollector";
import { generateReport } from "./generators/reportGenerator";
import { buildEvidence } from "./scoring/evidenceBuilder";
import { calculatePersonaScores } from "./scoring/personaScoringEngine";
import { extractSignals } from "./scoring/signalExtractor";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/api", (_req: Request, res: Response) => {
  res.json({
    name: "GitHub Persona Analyzer",
    status: "ok",
    endpoints: {
      health: "/health",
      analyze: "/analyze/:username?limit=20",
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: "healthy",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get("/analyze/:username", async (req: Request, res: Response) => {
  try {
    const username = normalizeUsername(req.params.username);
    const repoLimit = parseRepoLimit(req.query.limit);

    if (!username) {
      //Test
      return res.status(400).json({
        success: false,
        error: "Invalid GitHub username",
        message:
          "Usernames may contain alphanumeric characters or hyphens, cannot start or end with a hyphen, and must be 1-39 characters.",
      });
    }

    const { profile, repos, meta } = await collectGitHubData(
      username,
      repoLimit,
    );
    const signals = extractSignals(profile, repos);
    const persona = calculatePersonaScores(signals);
    const evidence = buildEvidence(signals);

    const report = generateReport({
      profile,
      repoSignal: signals.repoSignal,
      readmeSignal: signals.readmeSignal,
      commitSignal: signals.commitSignal,
      persona,
      evidence,
      meta,
    });

    res.json({
      success: true,
      data: {
        profile: {
          username: profile.login,
          name: profile.name,
          bio: profile.bio,
          url: profile.html_url,
          publicRepos: profile.public_repos,
          followers: profile.followers,
          following: profile.following,
        },
        persona,
        evidence,
        signals,
        meta,
        report,
      },
    });
  } catch (error: unknown) {
    const apiError = readApiError(error);

    res.status(apiError.status).json({
      success: false,
      error: apiError.error,
      message: apiError.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function normalizeUsername(
  value: string | string[] | undefined,
): string | null {
  const username = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!username || !USERNAME_PATTERN.test(username)) return null;

  return username;
}

function parseRepoLimit(value: Request["query"][string]): number | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue || typeof rawValue !== "string") return undefined;

  const limit = Number(rawValue);
  return Number.isFinite(limit) ? limit : undefined;
}

function readApiError(error: unknown): {
  status: number;
  error: string;
  message: string;
} {
  if (isAxiosLikeError(error)) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.message ||
      "GitHub API request failed";

    return {
      status: status === 404 ? 404 : 502,
      error:
        status === 404 ? "GitHub user not found" : "GitHub API request failed",
      message,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      error: "Failed to analyze GitHub profile",
      message: error.message,
    };
  }

  return {
    status: 500,
    error: "Failed to analyze GitHub profile",
    message: "Unknown error",
  };
}

function isAxiosLikeError(error: unknown): error is {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
} {
  return typeof error === "object" && error !== null && "response" in error;
}
