// Command outputs for the interactive terminal. Every value here is read
// from resume.ts — nothing is re-typed or invented. Notably: the resume
// lists an email, phone, and location, but no GitHub or LinkedIn URL, so
// `contact` deliberately does not include those — inventing one would
// misrepresent Jasmere's actual online presence.

import { profile, skills, experience, projects, education, certifications } from './resume';

export type TerminalLine = { text: string; strong?: boolean };

const L = (text: string, strong = false): TerminalLine => ({ text, strong });
const BLANK: TerminalLine = { text: '' };

export type TerminalCommand = {
  description: string;
  run: (arg?: string) => TerminalLine[] | { lines: TerminalLine[]; action?: 'download-resume' };
};

const SECTION_ANCHORS = ['about', 'skills', 'experience', 'projects', 'education', 'contact'];

export const COMMANDS: Record<string, TerminalCommand> = {
  whoami: {
    description: 'basic info about me',
    run: () => [
      L(profile.name, true),
      L(`${profile.title} — ${profile.subtitle}`),
      L(`Based in ${profile.location}`),
    ],
  },

  skills: {
    description: 'technical skills by category',
    run: () => {
      const lines: TerminalLine[] = [];
      skills.forEach((group, i) => {
        if (i > 0) lines.push(BLANK);
        lines.push(L(`${group.category}:`, true));
        lines.push(L(group.items.join(', ')));
      });
      return lines;
    },
  },

  projects: {
    description: 'personal projects',
    run: () => {
      const lines: TerminalLine[] = [];
      projects.forEach((p, i) => {
        if (i > 0) lines.push(BLANK);
        lines.push(L(`${p.name} (${p.period})${p.featured ? ' — flagship' : ''}`, true));
        lines.push(L(p.description));
      });
      lines.push(BLANK);
      lines.push(L('Scroll to Projects for the full case studies, or type "open projects".'));
      return lines;
    },
  },

  experience: {
    description: 'work & freelance history',
    run: () => {
      const lines: TerminalLine[] = [];
      experience.forEach((e, i) => {
        if (i > 0) lines.push(BLANK);
        lines.push(L(`${e.role} — ${e.organization} (${e.period})`, true));
        lines.push(L(e.summary));
      });
      return lines;
    },
  },

  education: {
    description: 'degree & certifications',
    run: () => [
      L(education.degree, true),
      L(education.status),
      BLANK,
      L('Certifications & training:', true),
      L(certifications.join(', ')),
    ],
  },

  contact: {
    description: 'how to reach me',
    run: () => [
      L(`Email: ${profile.email}`),
      L(`Phone: ${profile.phone}`),
      L(`Location: ${profile.location}`),
      BLANK,
      L('Type "resume" to download my résumé, or "open contact" to use the contact form.'),
    ],
  },

  resume: {
    description: 'download my résumé',
    run: () => ({
      lines: [L('Downloading résumé…', true)],
      action: 'download-resume',
    }),
  },

  open: {
    description: 'open <section> — jump to about, skills, experience, projects, education, or contact',
    run: (arg) => {
      const target = (arg || '').trim().toLowerCase();
      if (!target) {
        return [L('Usage: open <section>'), L(`Sections: ${SECTION_ANCHORS.join(', ')}`)];
      }
      if (!SECTION_ANCHORS.includes(target)) {
        return [L(`Unknown section "${target}".`), L(`Sections: ${SECTION_ANCHORS.join(', ')}`)];
      }
      const motion = (window as unknown as { __motion?: { scrollToHash: (h: string) => void } }).__motion;
      if (motion?.scrollToHash) motion.scrollToHash(`#${target}`);
      else window.location.hash = `#${target}`;
      return [L(`Jumping to ${target}…`)];
    },
  },

  help: {
    description: 'show this list',
    run: () => {
      const lines: TerminalLine[] = [L('Available commands:', true), BLANK];
      Object.entries(COMMANDS)
        .filter(([name]) => name !== 'clear')
        .forEach(([name, cmd]) => {
          lines.push(L(`${name.padEnd(11)} ${cmd.description}`));
        });
      lines.push(L('clear'.padEnd(11) + ' clear the terminal'));
      return lines;
    },
  },

  clear: {
    description: 'clear the terminal',
    run: () => [],
  },
};

export const COMMAND_NAMES = Object.keys(COMMANDS);

export const WELCOME_LINES: TerminalLine[] = [
  L(`Hi, I'm ${profile.name.split(' ')[0]}'s portfolio terminal.`, true),
  L('Type "help" to get started, or try: whoami, skills, projects'),
];
