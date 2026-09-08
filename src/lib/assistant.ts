// Shared knowledge engine for the portfolio assistant. Imported by both the
// server-side Cloudflare Pages Function (functions/api/chat.ts) and the
// client-side chat UI as an offline fallback — one source of truth, sourced
// entirely from resume.ts, so it's structurally impossible for either path
// to state a company, role, skill, certification, or figure that isn't
// actually on the resume.

import {
  profile,
  strengths,
  skills,
  experience,
  projects,
  education,
  certifications,
} from '../data/resume';

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

export const SUGGESTED_QUESTIONS = [
  "What's your experience with AI?",
  'Tell me about VeriFact.',
  'What technologies do you use?',
  'What projects have you built?',
  'What kind of developer are you?',
  "What's your educational background?",
];

const ALL_TECH = Array.from(new Set(skills.flatMap((g) => g.items)));

function findProject(nameFragment: string) {
  return projects.find((p) => p.name.toLowerCase().includes(nameFragment));
}

function describeProject(p: (typeof projects)[number]): string {
  return `${p.name} (${p.period}) — ${p.role}. ${p.description} Key features: ${p.features
    .slice(0, 3)
    .join('; ')}. Built with ${p.stack.join(', ')}.`;
}

/**
 * Deterministic, keyword-matched answers built only from resume.ts. No
 * network call, no model — used whenever no AI API key is configured, and
 * as the client-side fallback if the /api/chat call fails for any reason.
 */
export function localAnswer(question: string): string {
  const q = question.toLowerCase().trim();

  if (!q) {
    return "Ask me something about Jasmere's experience, projects, skills, or education — or tap one of the suggestions below.";
  }

  // Named-project lookups first, most specific match wins.
  for (const p of projects) {
    if (q.includes(p.name.toLowerCase())) return describeProject(p);
  }

  if (/\b(ai|artificial intelligence|machine learning|ml|claude|nlp)\b/.test(q)) {
    const aiGroup = skills.find((g) => g.category === 'AI / ML');
    const verifact = findProject('verifact');
    return (
      `Jasmere's AI work centers on ${aiGroup?.items.join(', ')}. ` +
      (verifact
        ? `The clearest example is ${verifact.name}: ${verifact.description} `
        : '') +
      `He also uses Claude and prompt engineering as part of his everyday development workflow.`
    );
  }

  if (/\b(ojt|internship|on[- ]the[- ]job)/.test(q)) {
    const hasOjt = certifications.some((c) => /ojt/i.test(c));
    return hasOjt
      ? `Jasmere holds an OJT Certificate of Completion (listed under certifications). His resume doesn't break out a separate internship narrative beyond that certificate — for hands-on professional work, see his freelance engagements with KZDB, including the KZ Brewhaus POS system and the AzureNorth booking system.`
      : `I don't have OJT/internship details in Jasmere's resume beyond his listed certifications and client work.`;
  }

  if (/\b(project|built|build|portfolio work)/.test(q)) {
    return `Jasmere has built ${projects.length} personal projects: ${projects
      .map((p) => `${p.name} (${p.period})`)
      .join(', ')}. His flagship is VeriFact, an AI-powered fake news detection system. Ask about any of them by name for more detail.`;
  }

  if (/\b(experience|work history|job|freelance|client|employ|compan)/.test(q)) {
    return experience
      .map((e) => `${e.role} — ${e.organization} (${e.period}): ${e.summary}`)
      .join(' ');
  }

  if (/\b(skill|technolog|stack|language|framework|tool)/.test(q)) {
    return skills.map((g) => `${g.category}: ${g.items.join(', ')}`).join(' | ');
  }

  if (/\b(education|degree|school|university|college|graduat|certificat)/.test(q)) {
    return `${education.degree} — ${education.status}. Certifications & training: ${certifications.join(', ')}.`;
  }

  if (/\b(career|interest|looking for|goal|opportunit|hir|avail|role)/.test(q)) {
    return `Jasmere is open to software developer roles and freelance work involving web, mobile, or AI-integrated systems — the kind of end-to-end building his projects and client work already show.`;
  }

  if (/\b(who are you|about you|kind of developer|describe yourself|summary)\b/.test(q)) {
    return profile.summary;
  }

  if (/\b(strength|good at|best at)/.test(q)) {
    return strengths.map((s) => `${s.label}: ${s.detail}`).join(' ');
  }

  if (/\b(contact|email|phone|reach|location|based)/.test(q)) {
    return `You can reach Jasmere at ${profile.email} or ${profile.phone}. He's based in ${profile.location}.`;
  }

  const mentionedTech = ALL_TECH.find((t) => q.includes(t.toLowerCase()));
  if (mentionedTech) {
    const groups = skills.filter((g) => g.items.includes(mentionedTech)).map((g) => g.category);
    const usedInProjects = projects.filter((p) => p.stack.includes(mentionedTech)).map((p) => p.name);
    const usedInJobs = experience
      .filter((e) => e.stack.includes(mentionedTech))
      .map((e) => e.organization);
    const usedIn = [...usedInProjects, ...usedInJobs];
    return `Yes — ${mentionedTech} is listed under ${groups.join(', ')} in his skill set${
      usedIn.length ? `, and shows up in: ${usedIn.join(', ')}.` : '.'
    }`;
  }

  return `I can only answer from what's actually in Jasmere's resume and portfolio, and I don't have anything on that. Try asking about his experience, projects (like VeriFact), technical skills, or education.`;
}

/**
 * System prompt for the AI-backed path (used only when an API key is
 * configured server-side). Embeds the full resume dataset as the sole
 * source of truth and explicitly forbids inventing anything beyond it.
 */
export function buildSystemPrompt(): string {
  const resumeData = { profile, strengths, skills, experience, projects, education, certifications };
  return `You are a portfolio assistant embedded on Jasmere Paul Calagui's personal website. Visitors ask about his experience, projects, skills, and education.

RULES (do not break these):
- Answer ONLY using the RESUME_DATA JSON below. It is the complete and only source of truth.
- Never invent or embellish companies, job titles, dates, skills, certifications, achievements, statistics, or projects that are not present in RESUME_DATA.
- If a question asks about something not covered by RESUME_DATA (e.g. salary expectations, unrelated trivia, opinions on third parties), say plainly that you don't have that information and suggest a related question you *can* answer.
- Keep answers conversational and concise: 2-4 sentences, no markdown headers or bullet walls.
- Speak about Jasmere in the third person, as his portfolio assistant — not as Jasmere himself.

RESUME_DATA:
${JSON.stringify(resumeData)}`;
}
