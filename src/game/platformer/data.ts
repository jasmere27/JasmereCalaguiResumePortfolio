// Content layer for the platformer's Level 1 (Education). Every fact here
// is read directly from resume.ts at runtime — nothing about Jasmere's
// degree or certifications is re-typed, paraphrased with new specifics, or
// invented. What lives here is game framing only: which real credential
// maps to which collectible station, and the level's mission copy.

import { profile, education, certifications } from '../../data/resume';

export { profile, education, certifications };

export type Credential = {
  id: string;
  label: string;
};

// One collectible/interactive station per real certification already
// listed in resume.ts — order preserved so it reads the same as the
// Education section on the main page.
export const credentials: Credential[] = certifications.map((label, i) => ({
  id: `cred-${i}`,
  label,
}));

export const levelMeta = {
  key: 'education' as const,
  title: 'Level 1 — Foundations',
  subtitle: 'Education',
  mission: `Collect all ${credentials.length} credentials, then reach the Diploma Terminal.`,
};

export const gameTitle = 'Stack Climb';
export const gameTagline =
  "An original 2D platformer through Jasmere Paul Calagui's real developer journey.";
