// src/analyzers/readmeAnalyzer.ts

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

export function analyzeReadme(readmeContent?: string | null): ReadmeSignal {
  if (!readmeContent || readmeContent.trim().length === 0) {
    return {
      hasReadme: false,
      readmeLength: 0,
      headingCount: 0,
      codeBlockCount: 0,
      linkCount: 0,
      imageCount: 0,
      hasInstallationSection: false,
      hasUsageSection: false,
      hasFeatureSection: false,
      hasLicenseSection: false,
      documentationScore: 0,
      clarityScore: 0,
    };
  }

  const content = readmeContent.trim();
  const lowerContent = content.toLowerCase();

  const readmeLength = content.length;
  const headingCount = countMatches(content, /^#{1,6}\s+/gm);
  const codeBlockCount = countMatches(content, /```[\s\S]*?```/g);
  const linkCount = countMatches(content, /\[([^\]]+)\]\(([^)]+)\)/g);
  const imageCount = countMatches(content, /!\[([^\]]*)\]\(([^)]+)\)/g);

  const hasInstallationSection = hasSection(lowerContent, [
    "installation",
    "install",
    "setup",
    "getting started",
  ]);

  const hasUsageSection = hasSection(lowerContent, [
    "usage",
    "how to use",
    "example",
    "demo",
  ]);

  const hasFeatureSection = hasSection(lowerContent, [
    "features",
    "feature",
    "what it does",
  ]);

  const hasLicenseSection = hasSection(lowerContent, ["license", "licence"]);

  const structureScore = normalize(headingCount, 1, 8);
  const lengthScore = normalize(readmeLength, 300, 5000);
  const codeScore = normalize(codeBlockCount, 0, 5);

  const sectionScore =
    [
      hasInstallationSection,
      hasUsageSection,
      hasFeatureSection,
      hasLicenseSection,
    ].filter(Boolean).length * 25;

  const documentationScore = Math.round(
    lengthScore * 0.35 +
      structureScore * 0.25 +
      sectionScore * 0.25 +
      codeScore * 0.15,
  );

  const clarityScore = Math.round(
    structureScore * 0.4 +
      normalize(linkCount, 0, 5) * 0.2 +
      normalize(imageCount, 0, 3) * 0.15 +
      sectionScore * 0.25,
  );

  return {
    hasReadme: true,
    readmeLength,
    headingCount,
    codeBlockCount,
    linkCount,
    imageCount,
    hasInstallationSection,
    hasUsageSection,
    hasFeatureSection,
    hasLicenseSection,
    documentationScore,
    clarityScore,
  };
}

function hasSection(content: string, keywords: string[]): boolean {
  return keywords.some((keyword) => content.includes(keyword));
}

function countMatches(content: string, regex: RegExp): number {
  return content.match(regex)?.length || 0;
}

function normalize(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 100;

  return Math.round(((value - min) / (max - min)) * 100);
}
