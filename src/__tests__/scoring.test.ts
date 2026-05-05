// src/__tests__/scoring.test.ts

import { analyzeReadme } from "../analyzers/readmeAnalyzer";
import { calculatePersonaScores } from "../scoring/personaScoringEngine";
import { extractSignals } from "../scoring/signalExtractor";
import { GitHubProfile, RepoWithDetails } from "../types";

const profile: GitHubProfile = {
  login: "octocat",
  name: "Octo Cat",
  bio: "Builds useful things",
  location: "Internet",
  blog: "https://github.blog",
  company: "GitHub",
  email: null,
  public_repos: 10,
  followers: 120,
  following: 10,
  created_at: "2011-01-25T18:44:36Z",
  html_url: "https://github.com/octocat",
};

const completeReadme = `# Project

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

Run the app.

## Features

- Analyze profiles

## License

MIT
`;

const repos: RepoWithDetails[] = [
  {
    name: "persona",
    full_name: "octocat/persona",
    description: "Persona analyzer",
    homepage: "https://example.com",
    language: "TypeScript",
    fork: false,
    archived: false,
    stargazers_count: 25,
    forks_count: 5,
    size: 2000,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    pushed_at: "2026-04-20T00:00:00Z",
    html_url: "https://github.com/octocat/persona",
    readme: completeReadme,
    commits: [
      {
        commit: {
          message: "feat: add analyzer",
          author: { date: "2026-04-20T00:00:00Z" },
        },
      },
    ],
  },
  {
    name: "scratch",
    full_name: "octocat/scratch",
    description: null,
    homepage: null,
    language: "JavaScript",
    fork: false,
    archived: false,
    stargazers_count: 0,
    forks_count: 0,
    size: 50,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    pushed_at: "2026-03-01T00:00:00Z",
    html_url: "https://github.com/octocat/scratch",
    readme: null,
    commits: [],
  },
];

const singleReadmeScore = analyzeReadme(completeReadme).documentationScore;
const signals = extractSignals(profile, repos);
const persona = calculatePersonaScores(signals);

assert(
  signals.readmeSignal.documentationScore < singleReadmeScore,
  "aggregate README score should account for repos without README files",
);
assert(persona.personaName.length > 0, "persona should include a name");
assert(persona.tagline.length > 0, "persona should include a tagline");
assert(
  persona.confidence >= 0 && persona.confidence <= 100,
  "confidence should stay within 0-100",
);

console.log("Scoring tests passed");

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
