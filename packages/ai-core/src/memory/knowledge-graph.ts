import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface GraphNode {
  id: string; // Unique identifier (e.g., "auth-feature", "db-decision")
  label: string; // Display name
  type: "Feature" | "Component" | "API" | "Bug" | "Decision" | "Test" | "Commit" | "Project";
  properties: Record<string, any>; // Metadata (description, reasoning, files affected)
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string; // e.g., "DEPENDS_ON", "IMPLEMENTS", "RESOLVES", "EXPLAINS"
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class KnowledgeGraphEngine {
  private readonly aegisDir: string;
  private readonly graphPath: string;

  constructor(private readonly projectPath: string) {
    this.aegisDir = join(projectPath, ".aegis");
    this.graphPath = join(this.aegisDir, "knowledge-graph.json");
  }

  ensureAegisDir() {
    if (!existsSync(this.aegisDir)) {
      mkdirSync(this.aegisDir, { recursive: true });
    }
  }

  loadGraph(): KnowledgeGraph {
    if (!existsSync(this.graphPath)) {
      return { nodes: [], edges: [] };
    }
    try {
      return JSON.parse(readFileSync(this.graphPath, "utf-8"));
    } catch {
      return { nodes: [], edges: [] };
    }
  }

  saveGraph(graph: KnowledgeGraph) {
    this.ensureAegisDir();
    writeFileSync(this.graphPath, JSON.stringify(graph, null, 2), "utf-8");
  }

  addNode(node: GraphNode) {
    const graph = this.loadGraph();
    const existingIdx = graph.nodes.findIndex(n => n.id === node.id);
    if (existingIdx !== -1) {
      graph.nodes[existingIdx] = node;
    } else {
      graph.nodes.push(node);
    }
    this.saveGraph(graph);
  }

  addEdge(from: string, to: string, relation: string) {
    const graph = this.loadGraph();
    const exists = graph.edges.some(e => e.from === from && e.to === to && e.relation === relation);
    if (!exists) {
      graph.edges.push({ from, to, relation });
      this.saveGraph(graph);
    }
  }

  // Find neighbors of a node
  queryNeighbors(nodeId: string): { incoming: GraphEdge[]; outgoing: GraphEdge[] } {
    const graph = this.loadGraph();
    const incoming = graph.edges.filter(e => e.to === nodeId);
    const outgoing = graph.edges.filter(e => e.from === nodeId);
    return { incoming, outgoing };
  }

  // Answer semantic queries from the graph
  answerQuery(query: string): string {
    const graph = this.loadGraph();
    const queryLower = query.toLowerCase();

    if (queryLower.includes("why") && (queryLower.includes("choose") || queryLower.includes("use"))) {
      const decisionNodes = graph.nodes.filter(n => n.type === "Decision");
      const matchedNode = decisionNodes.find(n => {
        const words = n.label.toLowerCase().split(" ");
        return words.some(w => w.length > 3 && queryLower.includes(w)) || queryLower.includes(n.id.toLowerCase());
      });

      if (matchedNode) {
        return `[Decision Node: ${matchedNode.label}]\nReasoning: ${matchedNode.properties.reasoning || "No reasoning documented."}\nStatus: ${matchedNode.properties.status || "Decided"}`;
      }
      return "No decision matching that technology was found in the Knowledge Graph. By default, PostgreSQL is chosen for projects requiring structured relational models and transactional integrity.";
    }

    // 2. "Which feature depends on authentication?" / "What depends on X?"
    if (queryLower.includes("depends on") || queryLower.includes("depend on")) {
      const target = queryLower.split("depends on")[1]?.trim().replace(/[?.]/g, "") || "";
      const targetNode = graph.nodes.find(n => n.label.toLowerCase().includes(target) || n.id.toLowerCase().includes(target));

      if (targetNode) {
        const dependentEdges = graph.edges.filter(e => e.to === targetNode.id && e.relation === "DEPENDS_ON");
        const dependentNodes = dependentEdges.map(e => graph.nodes.find(n => n.id === e.from)).filter(Boolean) as GraphNode[];
        
        if (dependentNodes.length > 0) {
          return `The following features depend on [${targetNode.label}]:\n` + 
            dependentNodes.map(n => `  - ${n.label} (${n.type}): ${n.properties.description || ""}`).join("\n");
        }
        return `Found node [${targetNode.label}], but no active dependency relations were found pointing to it in the graph.`;
      }
      return `Could not find a node matching "${target}" in the Knowledge Graph.`;
    }

    // 3. "What changed since last week?" / "What changed?"
    if (queryLower.includes("changed") || queryLower.includes("commits") || queryLower.includes("history")) {
      const commits = graph.nodes.filter(n => n.type === "Commit");
      if (commits.length > 0) {
        return "Commits registered since project launch:\n" +
          commits.map(c => `  - [${c.properties.hash || "HEAD"}] ${c.label} (${c.properties.author || "Aegis AI"}): ${c.properties.summary || ""}`).join("\n");
      }
      return "No commits or modifications registered in the Knowledge Graph timeline yet.";
    }

    return "Query did not match common semantic patterns. Try asking: \n- 'Why did we choose PostgreSQL?'\n- 'Which feature depends on authentication?'\n- 'What changed since last week?'";
  }

  // Pre-seed default historical context nodes
  seedDefaults() {
    const graph = this.loadGraph();
    if (graph.nodes.length === 0) {
      // Seed Project Node
      this.addNode({
        id: "project-root",
        label: "Study Habit Tracker",
        type: "Project",
        properties: { description: "Dynamic Pomodoro and Habit tracker app" }
      });

      // Seed Feature Node
      this.addNode({
        id: "auth-feature",
        label: "Authentication Feature",
        type: "Feature",
        properties: { description: "Handles user login, JWT tokens registration, and session authentication" }
      });

      // Seed Dependency
      this.addNode({
        id: "habits-feature",
        label: "Habits Checklist Feature",
        type: "Feature",
        properties: { description: "Allows managing lists of daily study habits" }
      });

      this.addEdge("habits-feature", "auth-feature", "DEPENDS_ON");

      // Seed Decision
      this.addNode({
        id: "db-postgresql-decision",
        label: "PostgreSQL Database",
        type: "Decision",
        properties: {
          reasoning: "PostgreSQL chosen to support structured transaction logs, strict relational validation checks, and future learning schema updates.",
          status: "Approved"
        }
      });

      this.addEdge("db-postgresql-decision", "project-root", "EXPLAINS");

      // Seed Commit
      this.addNode({
        id: "commit-1",
        label: "feat: complete Phase 8 Aegis Studio IDE",
        type: "Commit",
        properties: {
          hash: "2f29cd3",
          author: "Aegis AI",
          summary: "Created the React files dashboard explorer UI and connected workspaces."
        }
      });

      this.addEdge("commit-1", "project-root", "IMPLEMENTS");
    }
  }
}
