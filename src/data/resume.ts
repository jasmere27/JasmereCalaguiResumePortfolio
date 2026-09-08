// Single source of truth, transcribed from Jasmere Paul Calagui's resume.
// Every field here is either a direct fact from the resume or a light
// rewrite of one — nothing invented.

export const profile = {
  name: 'Jasmere Paul Calagui',
  title: 'Software Developer',
  subtitle: 'Full-Stack & AI-Integrated Applications',
  location: 'Baliti, City of San Fernando, Pampanga, Philippines',
  email: 'jasmerecalagui@gmail.com',
  phone: '+63 991 428 3839',
  languages: ['English', 'Filipino'],
  tagline:
    "I build web, mobile, and AI-integrated systems end to end — from database schema to the interface someone actually uses.",
  summary:
    "Software developer with a Bachelor of Science in Information Technology and hands-on experience shipping web, mobile, and AI-integrated applications. Comfortable across the stack in Java, PHP, JavaScript, Spring Boot, MySQL, and Firebase, with a growing focus on applying Claude and modern AI tooling — prompt engineering, AI agents, and automated workflows — to real products. Delivered client systems including a point-of-sale platform and an online booking system, and led an AI-powered fake news detection project from research through deployment.",
};

export const strengths = [
  {
    label: 'Full-stack delivery',
    detail:
      'Comfortable owning a feature from database design through backend logic to the interface, on both web and Android.',
  },
  {
    label: 'AI-assisted engineering',
    detail:
      'Uses Claude and prompt engineering as part of the build process, and has designed AI agents that reason over live, retrieved information.',
  },
  {
    label: 'Client-facing systems',
    detail:
      'Has taken real business requirements — a café POS, a hotel booking flow — through testing and iteration until they matched how the client actually works.',
  },
];

export type SkillCategory = {
  category: string;
  note: string;
  items: string[];
};

export const skills: SkillCategory[] = [
  {
    category: 'Languages',
    note: 'Core programming languages',
    items: ['Java', 'PHP', 'JavaScript', 'Python'],
  },
  {
    category: 'Web & Frameworks',
    note: 'Building the frontend and backend',
    items: ['HTML', 'CSS', 'REST APIs', 'Spring Boot', 'Spring AI', 'Android Studio', 'Firebase'],
  },
  {
    category: 'Databases',
    note: 'Persistence and data modeling',
    items: ['MySQL', 'SQLite'],
  },
  {
    category: 'AI / ML',
    note: 'Applied AI in production features',
    items: [
      'Claude',
      'AI Agents',
      'Prompt Engineering',
      'NLP',
      'Machine Learning',
      'OCR',
      'Speech-to-Text',
    ],
  },
  {
    category: 'Tools & Practice',
    note: 'How the work gets built and shipped',
    items: ['Git', 'GitHub', 'Docker', 'System Design', 'Debugging', 'Testing'],
  },
];

export type Experience = {
  organization: string;
  role: string;
  period: string;
  summary: string;
  points: string[];
  stack: string[];
};

export const experience: Experience[] = [
  {
    organization: 'KZDB',
    role: 'Freelance Software Developer',
    period: '2025 — Present',
    summary:
      'Independent development work for business clients, covering the full delivery cycle from frontend to database.',
    points: [
      'Develop web and application solutions for business clients end to end — frontend, backend, database, and API work.',
      'Own testing and system integration for each engagement rather than handing off to a separate QA step.',
    ],
    stack: ['PHP', 'Java', 'MySQL', 'REST APIs'],
  },
  {
    organization: 'KZ Brewhaus',
    role: 'Point-of-Sale System — Developer',
    period: '2025',
    summary:
      'Built a POS system shaped directly by the client’s day-to-day operations, not a generic template.',
    points: [
      "Developed a POS system based on the client's actual business and operational requirements.",
      'Implemented core application features, business logic, and the underlying database.',
      'Tested and troubleshot application and database issues, refining features against client feedback.',
    ],
    stack: ['PHP', 'MySQL', 'JavaScript'],
  },
  {
    organization: 'AzureNorth Pampanga',
    role: 'Booking System — Developer',
    period: '2025',
    summary:
      "A reservation and booking platform built around the client's operational workflow.",
    points: [
      "Developed a booking system to support the client's reservation and booking process.",
      'Implemented frontend, backend, database, and booking-workflow functionality.',
      'Performed testing, debugging, and system improvements based on client feedback.',
    ],
    stack: ['PHP', 'MySQL', 'JavaScript'],
  },
];

export type Project = {
  name: string;
  role: string;
  period: string;
  featured: boolean;
  description: string;
  features: string[];
  stack: string[];
  link?: string;
};

export const projects: Project[] = [
  {
    name: 'VeriFact',
    role: 'Principal Investigator & Full-Stack Developer',
    period: '2025',
    featured: true,
    description:
      'An AI-powered fake news detection system that combines NLP, machine learning, OCR, and speech-to-text so a claim can be checked whether it arrives as text, an image, or audio.',
    features: [
      'NLP and machine learning models assess the credibility of submitted claims',
      'OCR and speech-to-text pipelines accept scanned text and spoken audio as input, not just typed claims',
      'A built-in AI agent runs live web searches and folds retrieved evidence back into the detection workflow',
      'Full-stack build across frontend, backend, database, and AI integration layers',
    ],
    stack: ['PHP', 'Java', 'Spring Boot', 'Spring AI', 'MySQL', 'NLP', 'OCR'],
  },
  {
    name: 'MindsHive',
    role: 'Project Leader & Full-Stack Developer',
    period: '2026',
    featured: false,
    description:
      'A mobile application led from concept through delivery, covering feature design, UI, and backend data.',
    features: [
      'Designed application features, user interfaces, and core system functionality',
      'Firebase-backed data layer for real-time application state',
      'Coordinated development activities across the team and drove testing and debugging',
    ],
    stack: ['Android Studio', 'Firebase', 'Java'],
  },
  {
    name: 'BlogMatatag',
    role: 'Project Leader & Full-Stack Developer',
    period: '2023',
    featured: false,
    description:
      'A responsive blogging platform with a full content management layer, built and led end to end.',
    features: [
      'Responsive HTML/CSS/JavaScript frontend',
      'PHP and MySQL backend with content management functionality',
      'Led development activities and handled testing and debugging',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL'],
  },
];

export const education = {
  degree: 'Bachelor of Science in Information Technology',
  status: 'Graduated 2026',
};

export const certifications = [
  'NDG Linux Essentials',
  'Python Essentials',
  'Networking Certificates',
  'OJT Certificate of Completion',
];

export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Contact', href: '#contact' },
];
