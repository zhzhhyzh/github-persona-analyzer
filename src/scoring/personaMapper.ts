// src/scoring/personaMapper.ts

export type PersonaTypeCode =
  | "B-S-S"
  | "B-S-C"
  | "B-C-S"
  | "B-C-C"
  | "E-S-S"
  | "E-S-C"
  | "E-C-S"
  | "E-C-C";

export type PersonaResult = {
  typeCode: PersonaTypeCode;
  personaName: string;
  tagline: string;
  summary: string;
};

export function mapPersona(typeCode: string): PersonaResult {
  const personaMap: Record<PersonaTypeCode, Omit<PersonaResult, "typeCode">> = {
    "B-S-S": {
      personaName: "Independent Architect",
      tagline: "Structured, focused, and self-driven.",
      summary:
        "This developer prefers building complete systems independently. Their GitHub profile shows strong ownership, clean structure, and a disciplined engineering mindset.",
    },

    "B-S-C": {
      personaName: "Product Maker",
      tagline: "Practical builder with creative execution.",
      summary:
        "This developer focuses on building usable projects while adding creative ideas. They are likely strong at turning concepts into real working products.",
    },

    "B-C-S": {
      personaName: "Team System Builder",
      tagline: "Collaborative, organized, and reliable.",
      summary:
        "This developer shows signs of teamwork and structured engineering habits. They are likely comfortable working in team-based development environments.",
    },

    "B-C-C": {
      personaName: "Collaborative Creator",
      tagline: "Team-oriented with creative energy.",
      summary:
        "This developer combines collaboration with creative project expression. Their GitHub profile may show public-facing projects, teamwork, and experimentation.",
    },

    "E-S-S": {
      personaName: "Technical Researcher",
      tagline: "Curious, independent, and analytical.",
      summary:
        "This developer enjoys exploring technologies independently. Their profile suggests strong self-learning ability and interest in technical discovery.",
    },

    "E-S-C": {
      personaName: "Creative Experimenter",
      tagline: "Independent explorer with bold ideas.",
      summary:
        "This developer enjoys experimenting with new ideas, tools, and project concepts. Their GitHub profile reflects creativity and curiosity.",
    },

    "E-C-S": {
      personaName: "Open Source Engineer",
      tagline: "Exploratory, collaborative, and structured.",
      summary:
        "This developer shows both technical exploration and collaboration signals. They may enjoy contributing to shared projects while keeping a structured engineering approach.",
    },

    "E-C-C": {
      personaName: "Open Source Explorer",
      tagline: "Community-driven, experimental, and expressive.",
      summary:
        "This developer is highly exploratory and collaborative. Their GitHub profile suggests openness to experimentation, community contribution, and creative software development.",
    },
  };

  if (!isPersonaTypeCode(typeCode)) {
    return {
      typeCode: "B-S-S",
      personaName: "Balanced Developer",
      tagline: "A flexible developer with mixed working patterns.",
      summary:
        "This developer shows a balanced GitHub profile without a strong bias toward one specific personality pattern.",
    };
  }

  return {
    typeCode,
    ...personaMap[typeCode],
  };
}

function isPersonaTypeCode(typeCode: string): typeCode is PersonaTypeCode {
  return [
    "B-S-S",
    "B-S-C",
    "B-C-S",
    "B-C-C",
    "E-S-S",
    "E-S-C",
    "E-C-S",
    "E-C-C",
  ].includes(typeCode);
}
