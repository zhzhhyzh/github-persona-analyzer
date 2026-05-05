// src/scoring/personaScoringEngine.ts

import {
  CommitSignal,
  PersonaResult,
  PersonaScores,
  ProfileSignal,
  ReadmeSignal,
  RepoSignal,
} from "../types";
import { mapPersona } from "./personaMapper";

type PersonaScoringInput = {
  profileSignal: ProfileSignal;
  repoSignal: RepoSignal;
  readmeSignal: ReadmeSignal;
  commitSignal: CommitSignal;
};

export function calculatePersonaScores({
  profileSignal,
  repoSignal,
  readmeSignal,
  commitSignal,
}: PersonaScoringInput): PersonaResult {
  const builder = calculateBuilderScore(repoSignal, readmeSignal, commitSignal);
  const explorer = 100 - builder;

  const collaborator = calculateCollaboratorScore(profileSignal, repoSignal);
  const soloThinker = 100 - collaborator;

  const systematic = calculateSystematicScore(
    repoSignal,
    readmeSignal,
    commitSignal,
  );
  const creative = 100 - systematic;

  const scores: PersonaScores = {
    builder,
    explorer,
    soloThinker,
    collaborator,
    systematic,
    creative,
  };

  const typeCode = generateTypeCode(scores);
  const persona = mapPersona(typeCode);
  const confidence = calculateConfidence(scores, repoSignal, commitSignal);

  return {
    typeCode,
    personaName: persona.personaName,
    tagline: persona.tagline,
    scores,
    summary: persona.summary,
    confidence,
  };
}

function calculateBuilderScore(
  repoSignal: RepoSignal,
  readmeSignal: ReadmeSignal,
  commitSignal: CommitSignal,
): number {
  const completionSignal = repoSignal.projectCompletenessScore;
  const maintenanceSignal = repoSignal.maintenanceScore;
  const documentationSignal = readmeSignal.documentationScore;
  const commitConsistencySignal = commitSignal.consistencyScore;
  const languagePenalty = repoSignal.languageDiversityScore * 0.15;

  const score =
    completionSignal * 0.35 +
    maintenanceSignal * 0.25 +
    documentationSignal * 0.25 +
    commitConsistencySignal * 0.15 -
    languagePenalty;

  return clampScore(score);
}

function calculateCollaboratorScore(
  profileSignal: ProfileSignal,
  repoSignal: RepoSignal,
): number {
  const forkRatio =
    repoSignal.totalRepos === 0
      ? 0
      : (repoSignal.forkedRepos / repoSignal.totalRepos) * 100;

  const score =
    forkRatio * 0.35 +
    repoSignal.popularityScore * 0.3 +
    profileSignal.influenceScore * 0.25 +
    normalize(repoSignal.totalForks, 0, 50) * 0.1;

  return clampScore(score);
}

function calculateSystematicScore(
  repoSignal: RepoSignal,
  readmeSignal: ReadmeSignal,
  commitSignal: CommitSignal,
): number {
  const score =
    readmeSignal.documentationScore * 0.3 +
    readmeSignal.clarityScore * 0.25 +
    commitSignal.commitQualityScore * 0.25 +
    repoSignal.maintenanceScore * 0.2;

  return clampScore(score);
}

function generateTypeCode(scores: PersonaScores): string {
  const first = scores.builder >= scores.explorer ? "B" : "E";
  const second = scores.soloThinker >= scores.collaborator ? "S" : "C";
  const third = scores.systematic >= scores.creative ? "S" : "C";

  return `${first}-${second}-${third}`;
}

function calculateConfidence(
  scores: PersonaScores,
  repoSignal: RepoSignal,
  commitSignal: CommitSignal,
): number {
  const axisMargins = [
    Math.abs(scores.builder - scores.explorer),
    Math.abs(scores.soloThinker - scores.collaborator),
    Math.abs(scores.systematic - scores.creative),
  ];
  const averageMargin =
    axisMargins.reduce((total, value) => total + value, 0) / axisMargins.length;

  const dataCoverage =
    normalize(repoSignal.totalRepos, 1, 20) * 0.6 +
    normalize(commitSignal.totalCommits, 10, 200) * 0.4;

  return clampScore(averageMargin * 0.55 + dataCoverage * 0.45);
}

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;

  return ((value - min) / (max - min)) * 100;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
