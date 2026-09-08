// Editorial layer on top of resume.ts for the interactive Skills showcase.
// resume.ts remains the single source of raw facts; this file only
// re-groups and describes those same facts for a more scannable, dev-
// portfolio-style presentation. Every `usedFor`/`note` here is a direct
// paraphrase of copy already on the site (project descriptions, experience
// bullets, the professional summary) — nothing here introduces a new claim.
//
// `links` point at real anchors rendered in Projects.astro / Experience.astro
// (see the `slug()` helpers there). A tech with no real link honestly says
// so instead of inventing one.

export type TechCategory = 'Frontend' | 'Backend' | 'Database' | 'AI / ML' | 'Tools' | 'Other';

export type TechLink = { label: string; anchor: string };

export type TechDetail = {
  name: string;
  category: TechCategory;
  usedFor: string;
  links: TechLink[];
  note: string;
};

export const TECH_CATEGORIES: { key: TechCategory; blurb: string }[] = [
  { key: 'Frontend', blurb: 'Building what the user sees and touches' },
  { key: 'Backend', blurb: 'Server-side logic and application architecture' },
  { key: 'Database', blurb: 'Where the data actually lives' },
  { key: 'AI / ML', blurb: 'Applied AI in production features' },
  { key: 'Tools', blurb: 'How the work gets built and shipped' },
  { key: 'Other', blurb: 'Mobile tooling and core engineering practice' },
];

export const TECH_DETAILS: TechDetail[] = [
  // Frontend
  {
    name: 'HTML',
    category: 'Frontend',
    usedFor: 'Structuring page content and layout for web frontends.',
    links: [{ label: 'BlogMatatag', anchor: '#project-blogmatatag' }],
    note: 'Paired with CSS and JavaScript to build BlogMatatag’s responsive frontend.',
  },
  {
    name: 'CSS',
    category: 'Frontend',
    usedFor: 'Responsive styling and layout for web interfaces.',
    links: [{ label: 'BlogMatatag', anchor: '#project-blogmatatag' }],
    note: 'Used to make BlogMatatag’s blogging interface responsive across devices.',
  },
  {
    name: 'JavaScript',
    category: 'Frontend',
    usedFor: 'Client-side interactivity for business and content platforms.',
    links: [
      { label: 'KZ Brewhaus POS', anchor: '#exp-kz-brewhaus' },
      { label: 'AzureNorth Booking', anchor: '#exp-azurenorth-pampanga' },
      { label: 'BlogMatatag', anchor: '#project-blogmatatag' },
    ],
    note: 'His most-reused frontend language across freelance client work and personal projects.',
  },

  // Backend
  {
    name: 'Java',
    category: 'Backend',
    usedFor: 'Backend application logic and Android app development.',
    links: [
      { label: 'KZDB (freelance)', anchor: '#exp-kzdb' },
      { label: 'VeriFact', anchor: '#project-verifact' },
      { label: 'MindsHive', anchor: '#project-mindshive' },
    ],
    note: 'The one language that shows up in both his web backends and his Android work.',
  },
  {
    name: 'PHP',
    category: 'Backend',
    usedFor: 'Server-side logic for client web applications.',
    links: [
      { label: 'KZDB (freelance)', anchor: '#exp-kzdb' },
      { label: 'KZ Brewhaus POS', anchor: '#exp-kz-brewhaus' },
      { label: 'AzureNorth Booking', anchor: '#exp-azurenorth-pampanga' },
      { label: 'VeriFact', anchor: '#project-verifact' },
      { label: 'BlogMatatag', anchor: '#project-blogmatatag' },
    ],
    note: 'His default choice for client backend work — shows up across nearly every freelance engagement.',
  },
  {
    name: 'Python',
    category: 'Backend',
    usedFor: 'General-purpose scripting and programming fundamentals.',
    links: [],
    note: 'Backed by a Python Essentials certification; his shipped projects to date lean on Java and PHP instead.',
  },
  {
    name: 'Spring Boot',
    category: 'Backend',
    usedFor: 'Backend framework for VeriFact’s application and AI integration layers.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'The backbone of VeriFact’s Java backend.',
  },
  {
    name: 'Spring AI',
    category: 'Backend',
    usedFor: 'Wiring AI behavior — including the live-search AI agent — into a Java backend.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'What VeriFact’s AI agent is actually built on.',
  },
  {
    name: 'REST APIs',
    category: 'Backend',
    usedFor: 'Integration endpoints between frontend, backend, and client systems.',
    links: [{ label: 'KZDB (freelance)', anchor: '#exp-kzdb' }],
    note: 'Part of the standard toolkit for his freelance web/app delivery work.',
  },

  // Database
  {
    name: 'MySQL',
    category: 'Database',
    usedFor: 'Primary relational database across almost all of his projects.',
    links: [
      { label: 'KZDB (freelance)', anchor: '#exp-kzdb' },
      { label: 'KZ Brewhaus POS', anchor: '#exp-kz-brewhaus' },
      { label: 'AzureNorth Booking', anchor: '#exp-azurenorth-pampanga' },
      { label: 'VeriFact', anchor: '#project-verifact' },
      { label: 'BlogMatatag', anchor: '#project-blogmatatag' },
    ],
    note: 'His go-to database — present in every PHP/Java project he’s shipped.',
  },
  {
    name: 'SQLite',
    category: 'Database',
    usedFor: 'Lightweight relational storage.',
    links: [],
    note: 'Listed on his resume as a database skill; not yet tied to a specific shipped project in this portfolio.',
  },
  {
    name: 'Firebase',
    category: 'Database',
    usedFor: 'Real-time data layer for a mobile application.',
    links: [{ label: 'MindsHive', anchor: '#project-mindshive' }],
    note: 'Powers MindsHive’s real-time application state.',
  },

  // AI / ML
  {
    name: 'Claude',
    category: 'AI / ML',
    usedFor: 'AI-assisted development and prompt engineering as part of his build process.',
    links: [],
    note: 'Part of how he works day-to-day, rather than a library shipped inside one specific project.',
  },
  {
    name: 'AI Agents',
    category: 'AI / ML',
    usedFor: 'Designing an agent that performs live web searches and folds results into a detection workflow.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'VeriFact’s AI agent is the concrete example of this skill in production.',
  },
  {
    name: 'Prompt Engineering',
    category: 'AI / ML',
    usedFor: 'Shaping AI behavior for reliable, on-task responses.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'Used alongside Claude to help design how VeriFact’s agent reasons over retrieved evidence.',
  },
  {
    name: 'NLP',
    category: 'AI / ML',
    usedFor: 'Assessing the credibility of submitted text claims.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'One of the core models behind VeriFact’s fake-news detection.',
  },
  {
    name: 'Machine Learning',
    category: 'AI / ML',
    usedFor: 'Model-driven credibility scoring for submitted claims.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'Works alongside NLP inside VeriFact’s detection pipeline.',
  },
  {
    name: 'OCR',
    category: 'AI / ML',
    usedFor: 'Extracting text from scanned images so claims don’t have to be typed in.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'Lets VeriFact accept a photo of a claim, not just plain text.',
  },
  {
    name: 'Speech-to-Text',
    category: 'AI / ML',
    usedFor: 'Accepting spoken audio as an input format for a claim.',
    links: [{ label: 'VeriFact', anchor: '#project-verifact' }],
    note: 'The third input path VeriFact supports, alongside typed text and images.',
  },

  // Tools
  {
    name: 'Git',
    category: 'Tools',
    usedFor: 'Version control across freelance and personal projects.',
    links: [],
    note: 'Standard practice on every project listed here, not tied to one specific case.',
  },
  {
    name: 'GitHub',
    category: 'Tools',
    usedFor: 'Hosting and collaborating on version-controlled code.',
    links: [],
    note: 'Used alongside Git as his day-to-day source control workflow.',
  },
  {
    name: 'Docker',
    category: 'Tools',
    usedFor: 'Containerization as part of his tooling skill set.',
    links: [],
    note: 'Listed as a tool skill; his project write-ups don’t call out a specific containerized deployment.',
  },

  // Other
  {
    name: 'Android Studio',
    category: 'Other',
    usedFor: 'Building and debugging a native Android application.',
    links: [{ label: 'MindsHive', anchor: '#project-mindshive' }],
    note: 'The IDE behind MindsHive, his mobile project.',
  },
  {
    name: 'System Design',
    category: 'Other',
    usedFor: 'Structuring how a feature’s frontend, backend, database, and integrations fit together.',
    links: [{ label: 'KZDB (freelance)', anchor: '#exp-kzdb' }],
    note: 'Applied across his freelance engagements, which each span the full stack end to end.',
  },
  {
    name: 'Debugging',
    category: 'Other',
    usedFor: 'Finding and fixing application and database issues before they reach the client.',
    links: [
      { label: 'KZ Brewhaus POS', anchor: '#exp-kz-brewhaus' },
      { label: 'AzureNorth Booking', anchor: '#exp-azurenorth-pampanga' },
      { label: 'VeriFact', anchor: '#project-verifact' },
    ],
    note: 'A named step in nearly every project and engagement he’s shipped.',
  },
  {
    name: 'Testing',
    category: 'Other',
    usedFor: 'Verifying features work as expected before and after client feedback.',
    links: [
      { label: 'KZ Brewhaus POS', anchor: '#exp-kz-brewhaus' },
      { label: 'AzureNorth Booking', anchor: '#exp-azurenorth-pampanga' },
      { label: 'VeriFact', anchor: '#project-verifact' },
    ],
    note: 'Paired with debugging as a standard closing step on his projects.',
  },
];
