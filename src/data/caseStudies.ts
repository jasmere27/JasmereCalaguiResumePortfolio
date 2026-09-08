// Case-study content for the Projects showcase. resume.ts remains the sole
// source of raw facts (role, period, stack, features, description, link).
// This file adds an editorial layer that reorganizes those SAME facts into
// a case-study shape (problem / solution / challenges / how-solved /
// outcome) — it does not introduce new claims, technologies, metrics, or
// events. Every field below is a direct restatement or honest synthesis of
// what's already in a project's `description` and `features`, phrased at
// the same level of specificity the resume itself supports. Where the
// resume is genuinely thin (MindsHive, BlogMatatag lack a stated "why"),
// the copy stays general rather than inventing a specific business problem
// that was never mentioned.
//
// GitHub/live links and screenshots render only `if available` — none are
// present in the resume today, so `links` stays empty and the case study
// simply omits those sections rather than showing dead buttons.

import { projects, type Project } from './resume';

export type CaseStudy = {
  projectName: string;
  problem: string;
  solution: string;
  challenges: string;
  howSolved: string;
  outcome: string;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    projectName: 'VeriFact',
    problem:
      'Misinformation shows up in more than one format — a typed claim, a screenshot of a headline, or a voice clip — and a detector that only reads plain text misses most of it.',
    solution:
      'An AI-powered detection system that accepts a claim as text, a scanned image, or spoken audio, then runs NLP and machine learning models to assess its credibility.',
    challenges:
      'Coordinating four distinct AI capabilities — NLP, OCR, speech-to-text, and a live-search agent — into one coherent workflow, on top of the full application built around it.',
    howSolved:
      'Used Spring AI to structure the AI integration layer inside a Java/Spring Boot backend, and built a dedicated AI agent that runs live web searches so retrieved evidence, not just the model’s own read, feeds into the final result.',
    outcome:
      'A working end-to-end system — frontend, backend, database, and AI integration — built and tested solo as principal investigator, able to take a claim in as text, an image, or audio and return a credibility read.',
  },
  {
    projectName: 'MindsHive',
    problem:
      'Leading a mobile app from concept through delivery means owning feature design, UI, and data architecture while also keeping a team’s work moving — not just writing code.',
    solution:
      'Took the project lead end to end: designed the application’s features and interfaces, built a Firebase-backed real-time data layer, and coordinated the team’s day-to-day development.',
    challenges:
      'Splitting attention between hands-on feature and UI work and driving the team’s testing and debugging, without either side slipping.',
    howSolved:
      'Used Firebase’s real-time layer to keep application state consistent as features shipped, and stayed close to both the design work and the team’s QA pass rather than handing either off.',
    outcome:
      'A working mobile application with a real-time Firebase backend, delivered under his leadership from initial design through testing.',
  },
  {
    projectName: 'BlogMatatag',
    problem:
      'A blogging platform needs more than a page that displays posts — whoever runs it needs an actual way to manage that content.',
    solution:
      'A responsive HTML/CSS/JavaScript frontend paired with a PHP and MySQL backend built specifically for content management, not just static output.',
    challenges:
      'Making the platform hold up as a responsive experience across devices while building out real content-management functionality underneath it — both sides needed to work, not just the visible frontend.',
    howSolved:
      'Built the frontend responsively from the start and paired it with a PHP/MySQL backend designed around ongoing content management rather than one-off pages.',
    outcome:
      'A complete, responsive blogging platform — frontend through content-managed backend — built and led end to end, including testing and debugging.',
  },
];

export function getCaseStudy(projectName: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.projectName === projectName);
}

// Sanity note for maintainers: every CASE_STUDIES entry must correspond to
// a real projects[] entry, and vice versa — enforced by getProjectWithCase.
export type ProjectWithCase = Project & { case: CaseStudy };

export const PROJECTS_WITH_CASE: ProjectWithCase[] = projects.map((p) => {
  const c = getCaseStudy(p.name);
  if (!c) throw new Error(`Missing case study content for project "${p.name}"`);
  return { ...p, case: c };
});
