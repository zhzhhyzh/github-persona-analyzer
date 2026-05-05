// src/analyzers/profileAnalyzer.ts

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

export function analyzeProfile(profile: GitHubProfile): ProfileSignal {
  const accountAgeYears = calculateAccountAgeYears(profile.created_at);

  const profileFields = [
    profile.name,
    profile.bio,
    profile.location,
    profile.blog,
    profile.company,
    profile.email,
  ];

  const completedFields = profileFields.filter(
    (field) => field && field.trim().length > 0,
  ).length;

  const profileCompletenessScore = Math.round(
    (completedFields / profileFields.length) * 100,
  );

  const influenceScore = Math.round(
    normalize(profile.followers, 0, 500) * 0.7 +
      normalize(profile.following, 0, 300) * 0.3,
  );

  const activityPotentialScore = Math.round(
    normalize(profile.public_repos, 0, 50) * 0.6 +
      normalize(accountAgeYears, 0, 8) * 0.4,
  );

  return {
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    accountAgeYears,
    profileCompletenessScore,
    influenceScore,
    activityPotentialScore,
  };
}

function calculateAccountAgeYears(createdAt: string): number {
  const createdDate = new Date(createdAt);
  const now = new Date();

  const ageMs = now.getTime() - createdDate.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365);

  return Number(ageYears.toFixed(1));
}

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;

  return ((value - min) / (max - min)) * 100;
}
