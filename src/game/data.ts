// Content layer for Career Quest. Every fact used here is READ from
// resume.ts / techDetails.ts at runtime — nothing about Jasmere is
// re-typed or invented in this file. What lives here is game framing only:
// level copy, the illustrative bug snippet, and the demo claim text for the
// VeriFact level (clearly presented in-game as a simplified demonstration,
// not a real system output).

import {
  profile,
  strengths,
  skills,
  experience,
  projects,
  education,
  certifications,
} from '../data/resume';
import { TECH_DETAILS, type TechDetail } from '../data/techDetails';

// Re-exported so the game runtime has one import path for everything it
// needs — still the exact same objects from resume.ts, not copies.
export { profile, strengths, skills, experience, projects, education, certifications };

export const featuredProject = projects.find((p) => p.featured) ?? projects[0];

export const aiSkillItems: string[] =
  skills.find((g) => g.category === 'AI / ML')?.items ?? [];

// A small, well-connected subset for the collectible level — every one of
// these already has a real project/experience link in techDetails.ts, so
// every "collect" pays off with genuine evidence, not a shrug.
const COLLECTIBLE_NAMES = [
  'Java',
  'PHP',
  'JavaScript',
  'Spring Boot',
  'Spring AI',
  'MySQL',
  'Firebase',
  'NLP',
  'OCR',
  'Android Studio',
];

export const collectibleTech: TechDetail[] = COLLECTIBLE_NAMES.map(
  (name) => TECH_DETAILS.find((t) => t.name === name)!
).filter(Boolean);

export const totalTechCount = new Set(skills.flatMap((g) => g.items)).size;

// Illustrative only — a generic bug for the Development level. Not tied to
// any specific named project, so it can't be mistaken for a real incident.
export const bugChallenge = {
  snippet: `function getUser(id) {
  if (id = 0) {
    return null;
  }
  return db.find(id);
}`,
  prompt: 'This function never finds user #0. Which line fixes it?',
  options: [
    { code: 'if (id = 0) {', correct: false },
    { code: 'if (id === 0) {', correct: true },
    { code: 'if (id !== 0) {', correct: false },
  ],
  successNote:
    'Assigning instead of comparing is a classic one-character bug. Reading real code for issues like this — and confirming the fix actually works — is a routine part of the job.',
  groundedIn:
    strengths.find((s) => /debug|test/i.test(s.detail))?.detail ??
    'Testing and debugging show up as named steps across nearly every project he has shipped.',
};

// Level 3 — a decision scenario. The "correct" framing matches how his
// actual experience bullets describe the work (test → identify → fix →
// confirm with the client), not an invented policy.
export const scenarioChallenge = {
  prompt: "A client reports their application isn't behaving correctly. What's the first move?",
  choices: [
    {
      id: 'investigate',
      label: 'Investigate the issue',
      correct: true,
      feedback:
        "Exactly the approach his engagements describe: test and troubleshoot the actual issue before touching anything, then refine based on what's found.",
    },
    {
      id: 'ignore',
      label: 'Ignore it and hope it resolves itself',
      correct: false,
      feedback:
        'Client-facing systems need a response, not a guess — his freelance work is built around iterating with the client until the system matches how they actually work.',
    },
    {
      id: 'rewrite',
      label: 'Rewrite the whole system from scratch',
      correct: false,
      feedback:
        "Usually overkill for a reported bug — his engagements favor targeted debugging and iteration over starting over.",
    },
  ],
};

// Level 5 — VeriFact demo. The claim itself is a generic placeholder for
// the interaction; the pipeline stages and feature list are drawn straight
// from the real project description.
export const veriFactDemo = {
  claim: '"This bridge was built in three days using recycled ocean plastic."',
  options: ['VERIFY', 'FALSE', 'UNCERTAIN'] as const,
  pipeline: [
    { stage: 'Input', detail: 'Claim submitted as text, a scanned image, or spoken audio.' },
    { stage: 'Analysis', detail: 'NLP and machine learning models assess the claim’s credibility.' },
    { stage: 'AI Agent', detail: 'An AI agent runs live web searches for supporting or contradicting evidence.' },
    { stage: 'Verification', detail: 'Retrieved evidence is cross-referenced against the original claim.' },
    { stage: 'Result', detail: 'A credibility result is returned with the evidence behind it.' },
  ],
};

export const levels = [
  { key: 'start', title: 'Career Quest', mission: 'Begin the journey' },
  { key: 'education', title: 'Education', mission: 'Unlock the transcript' },
  { key: 'development', title: 'Development', mission: 'Fix the bug' },
  { key: 'experience', title: 'Experience', mission: 'Handle the incident' },
  { key: 'ai', title: 'AI / Technology', mission: 'Activate the AI core' },
  { key: 'verifact', title: 'Featured Project — VeriFact', mission: 'Run the demo' },
  { key: 'skills', title: 'Tech Stack', mission: 'Collect the stack' },
  { key: 'complete', title: 'Mission Complete', mission: 'Review the findings' },
] as const;

export type LevelKey = (typeof levels)[number]['key'];
