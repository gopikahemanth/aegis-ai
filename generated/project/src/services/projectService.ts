import { Project, SkillCategory, Experience } from '../types/portfolio';

export const projectService = {
  getAllProjects(): Project[] {
    return [
      {
        id: 'apex-cloud',
        title: 'ApexCloud Distributed Mesh',
        tagline: 'Multi-region Kubernetes service mesh handling 15M+ RPS with sub-millisecond routing overhead.',
        description: 'Engineered a highly resilient, geo-distributed service mesh integrating Istio, Envoy proxies, and custom eBPF telemetry collectors. Designed for zero-trust multi-tenancy and automatic failover across AWS, GCP, and Azure datacenters.',
        category: 'Cloud Infrastructure',
        year: '2023',
        architectureNotes: 'Built on custom Rust control planes interfacing with Kubernetes Custom Resource Definitions (CRDs). Utilizes Raft consensus for state replication across cluster boundaries.',
        metrics: [
          { label: 'Throughput', value: '15M RPS' },
          { label: 'P99 Latency', value: '< 1.2ms' },
          { label: 'Availability', value: '99.999%' }
        ],
        technologies: ['Rust', 'Kubernetes', 'Go', 'eBPF', 'Envoy', 'Terraform'],
        githubUrl: 'https://github.com/example/apex-cloud',
        liveUrl: 'https://apex-mesh.example.com'
      },
      {
        id: 'nexus-fintech',
        title: 'Nexus Core Ledger',
        tagline: 'High-frequency double-entry immutable ledger processing real-time cross-border settlements.',
        description: 'Architected a distributed ACID-compliant financial ledger capable of processing thousands of concurrent transactions per second without locking contention using optimistic concurrency control and append-only event sourcing.',
        category: 'FinTech Platform',
        year: '2023',
        architectureNotes: 'Powered by EventStoreDB and CQRS pattern implemented in TypeScript and Go. Guaranteed absolute cryptographic audit trails via SHA-256 merkle trees.',
        metrics: [
          { label: 'Tx / Sec', value: '25,000+' },
          { label: 'Discrepancy', value: '0.00%' },
          { label: 'Settlement', value: 'Real-time' }
        ],
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kafka'],
        githubUrl: 'https://github.com/example/nexus-ledger',
        liveUrl: 'https://nexus-fintech.example.com'
      },
      {
        id: 'synapse-ai',
        title: 'Synapse RAG Engine',
        tagline: 'Enterprise-grade retrieval-augmented generation pipeline with sub-second vector similarity search.',
        description: 'Created a scalable AI knowledge retrieval system processing millions of enterprise documents. Features dynamic chunking, hybrid keyword-vector search, and multi-LLM router orchestration with fallbacks.',
        category: 'AI & Machine Learning',
        year: '2024',
        architectureNotes: 'Utilizes pgvector with HNSW indexing, FastAPI async workers, and custom token-bucket rate limiters to ensure stable LLM inference under peak enterprise loads.',
        metrics: [
          { label: 'Query Latency', value: '380ms' },
          { label: 'Corpus Size', value: '50M Docs' },
          { label: 'Accuracy', value: '98.4%' }
        ],
        technologies: ['Python', 'FastAPI', 'PyTorch', 'PostgreSQL', 'LangChain', 'Docker'],
        githubUrl: 'https://github.com/example/synapse-ai',
        liveUrl: 'https://synapse-ai.example.com'
      },
      {
        id: 'pulse-observability',
        title: 'Pulse Telemetry Streamer',
        tagline: 'Real-time log aggregation and anomaly detection engine processing 50TB daily telemetry data.',
        description: 'Designed a high-throughput log ingestion and streaming pipeline using Kafka, Apache Flink, and ClickHouse. Integrated unsupervised machine learning models for real-time anomaly detection and root-cause analysis.',
        category: 'Distributed Systems',
        year: '2022',
        architectureNotes: 'Decoupled ingestion architecture with backpressure handling. Stream processing powered by Apache Flink jobs deployed on Kubernetes.',
        metrics: [
          { label: 'Daily Volume', value: '50 TB' },
          { label: 'Ingest Speed', value: '1.2 GB/s' },
          { label: 'Anomaly Recall', value: '99.1%' }
        ],
        technologies: ['Java', 'Kafka', 'ClickHouse', 'Flink', 'Kubernetes', 'Grafana'],
        githubUrl: 'https://github.com/example/pulse-telemetry',
        liveUrl: 'https://pulse-metrics.example.com'
      }
    ];
  },

  getProjectById(id: string): Project | undefined {
    return this.getAllProjects().find(p => p.id === id);
  },

  getSkillCategories(): SkillCategory[] {
    return [
      {
        title: 'Architecture & Systems',
        skills: [
          { name: 'Distributed Systems', level: 98, description: 'Designing fault-tolerant, horizontally scalable multi-region architectures.' },
          { name: 'Microservices & Mesh', level: 95, description: 'Service discovery, Istio/Envoy, gRPC, and asynchronous event-driven design.' },
          { name: 'Cloud Native (AWS/GCP)', level: 92, description: 'Infrastructure as Code, Kubernetes, serverless pipelines, and containerization.' },
          { name: 'System Performance', level: 96, description: 'Memory profiling, query optimization, network latency reduction, and caching.' }
        ]
      },
      {
        title: 'Languages & Backend',
        skills: [
          { name: 'TypeScript / JavaScript', level: 98, description: 'Advanced type systems, concurrent runtime patterns, and full-stack delivery.' },
          { name: 'Go & Rust', level: 90, description: 'High-performance concurrency, memory safety, and custom daemon development.' },
          { name: 'Python', level: 94, description: 'Backend APIs (FastAPI), data pipelines, ML orchestration, and scripting.' },
          { name: 'SQL & NoSQL Databases', level: 95, description: 'PostgreSQL, ClickHouse, Redis, sharding, replication, and indexing strategies.' }
        ]
      }
    ];
  },

  getExperiences(): Experience[] {
    return [
      {
        role: 'Principal Software Architect',
        company: 'Vanguard Systems',
        period: '2021 - Present',
        description: 'Lead architectural vision across engineering organizations, modernizing core legacy platforms into distributed cloud-native microservices.',
        highlights: [
          'Spearheaded migration of monolithic core to Kubernetes, reducing infrastructure run costs by 42%.',
          'Authored organization-wide engineering RFC standards adopted by 120+ software engineers.',
          'Mentored 15 senior and staff engineers across distributed systems and resilient design patterns.'
        ],
        technologies: ['Kubernetes', 'Go', 'TypeScript', 'AWS', 'Kafka', 'Terraform']
      },
      {
        role: 'Staff Backend Engineer',
        company: 'CloudScale Technologies',
        period: '2018 - 2021',
        description: 'Directed core API gateway and data ingestion pipeline infrastructure handling heavy concurrent enterprise traffic.',
        highlights: [
          'Engineered custom rate-limiting gateway module supporting 100k requests/sec with negligible overhead.',
          'Reduced P99 database query latency by 65% through aggressive indexing and read-replica routing.',
          'Pioneered automated chaos engineering test suites to validate system resilience under node failures.'
        ],
        technologies: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Prometheus', 'Grafana']
      },
      {
        role: 'Senior Full Stack Engineer',
        company: 'Apex Digital Labs',
        period: '2015 - 2018',
        description: 'Delivered high-throughput financial dashboards and resilient transaction processing microservices.',
        highlights: [
          'Built responsive, high-performance web applications using modern React and TypeScript.',
          'Implemented secure OAuth2/OIDC authentication pipelines and role-based access control.',
          'Optimized frontend asset bundles and rendering cycles resulting in 99+ Lighthouse performance scores.'
        ],
        technologies: ['React', 'TypeScript', 'Express', 'MongoDB', 'Webpack', 'Jest']
      }
    ];
  }
};