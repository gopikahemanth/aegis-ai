import { Project, Experience, SkillCategory } from '../types';

const PROJECTS: Project[] = [
  {
    id: 'cloudscale-ai',
    title: 'CloudScale AI Platform',
    tagline: 'Enterprise distributed auto-scaling engine powered by predictive machine learning.',
    description: 'An intelligent cloud resource orchestrator that predicts traffic spikes and pre-scales Kubernetes clusters with 99.4% accuracy.',
    fullDescription: 'CloudScale AI is a comprehensive enterprise-grade solution designed to eliminate latency spikes and reduce cloud computing expenditure. By analyzing historical request telemetry using custom regression models, it anticipates load surges minutes before they occur, automatically provisioning node pools seamlessly.',
    category: 'AI / ML',
    technologies: ['TypeScript', 'Python', 'Kubernetes', 'FastAPI', 'React', 'Tailwind CSS', 'TensorFlow'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    featured: true,
    metrics: [
      { label: 'Cost Reduction', value: '38%' },
      { label: 'Latency Drop', value: '45ms' },
      { label: 'Prediction Accuracy', value: '99.4%' }
    ],
    challenges: [
      'Handling sudden zero-to-hero traffic bursts without dropping active TCP connections.',
      'Minimizing false-positive scaling triggers during irregular cyclic user activity.',
      'Synchronizing multi-region cluster telemetry with sub-second polling intervals.'
    ],
    solutions: [
      'Implemented a hybrid reactive-proscriptive queuing mechanism using Redis Streams.',
      'Engineered an ensemble neural network filtering out seasonal noise anomalies.',
      'Adopted gRPC inter-service communication for lightning-fast metric aggregation.'
    ]
  },
  {
    id: 'nexus-fintech',
    title: 'Nexus Global FinTech Portal',
    tagline: 'Real-time multi-currency trading dashboard with institutional-grade security.',
    description: 'High-throughput financial analytics and asset exchange platform handling over $45M in daily transactions.',
    fullDescription: 'Nexus Portal delivers real-time streaming market data, algorithmic trading bots management, and rigorous compliance auditing tools. Built with a resilient event-driven architecture, it guarantees zero downtime during volatile market openings.',
    category: 'Full Stack',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'WebSockets', 'Redis', 'Tailwind CSS', 'Docker'],
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    featured: true,
    metrics: [
      { label: 'Daily Volume', value: '$45M+' },
      { label: 'WebSocket Latency', value: '<12ms' },
      { label: 'Uptime SLA', value: '99.99%' }
    ],
    challenges: [
      'Rendering high-frequency order books updating 100 times per second without UI stuttering.',
      'Ensuring immutable transaction ledgers with strict ACID compliance.',
      'Implementing strict multi-factor authentication and role-based access control.'
    ],
    solutions: [
      'Utilized React concurrent rendering and virtualized canvas grids for smooth charting.',
      'Employed PostgreSQL partitioning with connection pooling and read-replicas.',
      'Integrated WebAuthn and JWT rotation policies across microservices.'
    ]
  },
  {
    id: 'devpulse-analytics',
    title: 'DevPulse Engineering Metrics',
    tagline: 'Developer productivity and DORA metrics tracker for modern engineering teams.',
    description: 'Automated CI/CD pipeline telemetry dashboard providing actionable insights on deployment frequency and lead time.',
    fullDescription: 'DevPulse hooks directly into GitHub, GitLab, and Jira to calculate key DORA metrics effortlessly. Engineering leaders gain crystal-clear visibility into bottlenecks, review turnaround times, and release stability.',
    category: 'Full Stack',
    technologies: ['TypeScript', 'Next.js', 'GraphQL', 'Tailwind CSS', 'PostgreSQL', 'Docker'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    featured: true,
    metrics: [
      { label: 'Active Teams', value: '250+' },
      { label: 'Pipeline Sync', value: 'Realtime' },
      { label: 'Time Saved', value: '5 hrs/wk' }
    ],
    challenges: [
      'Normalizing disparate payload schemas from GitHub webhooks and Jira APIs.',
      'Aggregating millions of commit logs efficiently for historical trend analysis.'
    ],
    solutions: [
      'Created an extensible adapter pattern mapping diverse webhook events into unified domain models.',
      'Built automated background worker queues using BullMQ to aggregate data off the main thread.'
    ]
  },
  {
    id: 'syntax-ui',
    title: 'Syntax UI Design System',
    tagline: 'Accessible, themeable component library crafted for high-performance web applications.',
    description: 'An open-source React component library prioritizing WAI-ARIA compliance, keyboard navigation, and seamless Tailwind integration.',
    fullDescription: 'Syntax UI provides 40+ atomic components designed from the ground up for modern web applications. Every component supports full customization, dark mode out of the box, and rigorous accessibility checks.',
    category: 'Frontend',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Storybook', 'Vite'],
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    featured: false,
    metrics: [
      { label: 'NPM Downloads', value: '120k' },
      { label: 'Accessibility', value: '100%' },
      { label: 'Components', value: '42' }
    ],
    challenges: [
      'Maintaining compound component flexibility while preserving strong TypeScript inference.',
      'Ensuring robust keyboard focus trapping within modal and dropdown overlays.'
    ],
    solutions: [
      'Leveraged advanced generic typing and React Context for decoupled compound APIs.',
      'Integrated Radix UI primitives under the hood for bulletproof accessibility.'
    ]
  },
  {
    id: 'cryptoshield-vault',
    title: 'CryptoShield Secure Vault',
    tagline: 'Zero-knowledge encrypted password and secrets manager for distributed teams.',
    description: 'Client-side encrypted vault utilizing AES-GCM and Argon2 key derivation for uncompromising security.',
    fullDescription: 'CryptoShield ensures that sensitive API keys, database credentials, and cryptographic tokens remain secure even if the host server is compromised. All encryption and decryption operations occur entirely within the browser sandbox.',
    category: 'Backend',
    technologies: ['TypeScript', 'Node.js', 'Express', 'Web Crypto API', 'MongoDB', 'Tailwind CSS'],
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    featured: false,
    metrics: [
      { label: 'Zero Breaches', value: '100%' },
      { label: 'Key Derivation', value: 'Argon2id' },
      { label: 'Encryption', value: 'AES-256' }
    ],
    challenges: [
      'Performing heavy client-side cryptography without blocking the UI main thread.',
      'Designing a seamless secret sharing protocol without exposing master keys.'
    ],
    solutions: [
      'Offloaded cryptographic hashing and encryption tasks to Web Workers.',
      'Implemented public-key asymmetric wrapping for secure peer-to-peer secret transfer.'
    ]
  },
  {
    id: 'zenith-mobile',
    title: 'Zenith Habit & Focus Tracker',
    tagline: 'Cross-platform mobile application combining Pomodoro timers with behavioral psychology.',
    description: 'ReactNative application helping users build sustainable productivity routines through gamification and ambient soundscapes.',
    fullDescription: 'Zenith helps knowledge workers maintain deep focus states and conquer procrastination. Featuring intelligent notification scheduling, productivity heatmaps, and offline-first data synchronization.',
    category: 'Mobile',
    technologies: ['React Native', 'Expo', 'TypeScript', 'SQLite', 'Tailwind CSS'],
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    featured: false,
    metrics: [
      { label: 'App Store Rating', value: '4.9 ★' },
      { label: 'Active Users', value: '50k+' },
      { label: 'Streak Record', value: '340 days' }
    ],
    challenges: [
      'Maintaining precise timer state when the mobile application is pushed to background or closed.',
      'Ensuring smooth 60fps animations and transitions across low-end Android and iOS devices.'
    ],
    solutions: [
      'Used native background task APIs coupled with local notification alarms for precise timers.',
      'Optimized React Native Reanimated worklets running directly on the UI thread.'
    ]
  }
];

const EXPERIENCES: Experience[] = [
  {
    id: 'exp-1',
    role: 'Principal Software Engineer',
    company: 'NexusCloud Systems',
    location: 'San Francisco, CA',
    period: '2022 - Present',
    description: [
      'Lead a cross-functional engineering organization of 18 developers building high-scale distributed cloud infrastructure.',
      'Architected and deployed multi-region microservices handling 45,000 requests per second with 99.99% uptime.',
      'Mentored senior engineers, established core coding standards, and drove adoption of TypeScript and clean architecture.'
    ],
    technologies: ['TypeScript', 'Node.js', 'Kubernetes', 'AWS', 'PostgreSQL', 'React', 'GraphQL']
  },
  {
    id: 'exp-2',
    role: 'Senior Full Stack Developer',
    company: 'Apex Digital Solutions',
    location: 'New York, NY',
    period: '2019 - 2022',
    description: [
      'Spearheaded the migration of legacy monolithic applications into modular React and Node.js micro-frontends.',
      'Optimized database queries and indexing strategies, slashing average API response times by 62%.',
      'Collaborated closely with product managers and UX designers to launch flagship SaaS products.'
    ],
    technologies: ['React', 'TypeScript', 'Express', 'MongoDB', 'Docker', 'Redis', 'Tailwind CSS']
  },
  {
    id: 'exp-3',
    role: 'Software Engineer',
    company: 'Vanguard Tech Labs',
    location: 'Boston, MA',
    period: '2017 - 2019',
    description: [
      'Developed responsive single-page applications and high-performance RESTful APIs for enterprise clients.',
      'Integrated automated CI/CD pipelines utilizing GitHub Actions, reducing deployment errors by 40%.',
      'Conducted rigorous code reviews and wrote comprehensive unit and integration test suites.'
    ],
    technologies: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Jest', 'Git', 'CSS3']
  }
];

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    name: 'Frontend Engineering',
    skills: [
      { name: 'React / Next.js', level: 98 },
      { name: 'TypeScript / JavaScript', level: 95 },
      { name: 'Tailwind CSS / UI', level: 96 },
      { name: 'HTML5 / CSS3 / SVG', level: 92 },
      { name: 'State Management (Zustand/Redux)', level: 90 }
    ]
  },
  {
    name: 'Backend & Cloud',
    skills: [
      { name: 'Node.js / Express / NestJS', level: 92 },
      { name: 'PostgreSQL / MongoDB / Redis', level: 88 },
      { name: 'Docker / Kubernetes', level: 85 },
      { name: 'AWS / Cloud Architecture', level: 86 },
      { name: 'REST & GraphQL APIs', level: 94 }
    ]
  },
  {
    name: 'Architecture & Practices',
    skills: [
      { name: 'System Design & Scalability', level: 92 },
      { name: 'Clean Architecture & SOLID', level: 95 },
      { name: 'CI/CD & DevOps Pipelines', level: 88 },
      { name: 'Test-Driven Development (TDD)', level: 90 },
      { name: 'Performance Optimization', level: 94 }
    ]
  }
];

export const projectService = {
  getAllProjects(): Project[] {
    return PROJECTS;
  },
  getFeaturedProjects(): Project[] {
    return PROJECTS.filter(p => p.featured);
  },
  getProjectById(id: string): Project | undefined {
    return PROJECTS.find(p => p.id === id);
  },
  getExperiences(): Experience[] {
    return EXPERIENCES;
  },
  getSkillCategories(): SkillCategory[] {
    return SKILL_CATEGORIES;
  }
};