import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FeatureRealityValidator } from "../feature-reality-validator.js";
import { RealityCheckerAgent } from "../../agents/reality-checker-agent.js";
import { FinalSuccessGate } from "../final-success-gate.js";
import { DomainContractManager } from "../../governance/domain-contract.js";

describe("Aegis V2.1 Fix 5 — Reality Checker & Feature Reality Verification", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-reality-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 — Task creation: UI action -> handler -> state mutation -> persistence", () => {
    writeFileSync(
      join(testDir, "src/CreateTaskModal.tsx"),
      `import React, { useState } from "react";
import { api } from "./services/api";

export function CreateTaskModal({ onTaskCreated }: { onTaskCreated: (task: any) => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("HIGH");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTask = await api.createTask({ title, priority });
    onTaskCreated(newTask);
    localStorage.setItem("last_created_task", JSON.stringify(newTask));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <button type="submit">Create Task</button>
    </form>
  );
}`,
      "utf8"
    );

    const report = FeatureRealityValidator.validate(testDir);
    expect(report.passed).toBe(true);
    expect(report.violations.filter(v => v.severity === "error").length).toBe(0);
  });

  it("Test 2 — Priority filtering: Filter control -> state filter logic", () => {
    writeFileSync(
      join(testDir, "src/TaskFilter.tsx"),
      `import React, { useState, useMemo } from "react";

export function TaskList({ tasks }: { tasks: Array<{ id: string; title: string; priority: string }> }) {
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");

  const filteredTasks = useMemo(() => {
    if (selectedPriority === "ALL") return tasks;
    return tasks.filter(t => t.priority === selectedPriority);
  }, [tasks, selectedPriority]);

  return (
    <div>
      <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
        <option value="ALL">All Priorities</option>
        <option value="HIGH">High</option>
        <option value="LOW">Low</option>
      </select>
      <ul>
        {filteredTasks.map(t => <li key={t.id}>{t.title} ({t.priority})</li>)}
      </ul>
    </div>
  );
}`,
      "utf8"
    );

    const report = FeatureRealityValidator.validate(testDir);
    expect(report.passed).toBe(true);
  });

  it("Test 3 — Status filtering: Multi-column status categorization", () => {
    writeFileSync(
      join(testDir, "src/KanbanBoard.tsx"),
      `import React, { useState } from "react";

const COLUMNS = ["TODO", "IN_PROGRESS", "DONE"];

export function KanbanBoard({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks || []);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="flex gap-4">
      {COLUMNS.map(col => (
        <div key={col} className="column">
          <h3>{col}</h3>
          {tasks.filter(t => t.status === col).map(t => (
            <div key={t.id} onClick={() => handleStatusChange(t.id, "DONE")}>
              {t.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}`,
      "utf8"
    );

    const report = FeatureRealityValidator.validate(testDir);
    expect(report.passed).toBe(true);
  });

  it("Test 4 — Due date: Due date input participates in form & state mutation", () => {
    writeFileSync(
      join(testDir, "src/TaskForm.tsx"),
      `import React, { useState } from "react";

export function TaskForm({ onSave }: { onSave: (task: any) => void }) {
  const [dueDate, setDueDate] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ dueDate: new Date(dueDate).toISOString() });
  };

  return (
    <form onSubmit={handleSave}>
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <button type="submit">Save Date</button>
    </form>
  );
}`,
      "utf8"
    );

    const report = FeatureRealityValidator.validate(testDir);
    expect(report.passed).toBe(true);
  });

  it("Test 5 — Kanban columns: Column assignment and distribution", () => {
    writeFileSync(
      join(testDir, "src/Columns.tsx"),
      `import React, { useState } from "react";

export function ColumnsView({ tasks, onMoveTask }: { tasks: any[]; onMoveTask: (id: string, col: string) => void }) {
  const [columns] = useState(["Todo", "In Progress", "Done"]);

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map(c => (
        <div key={c} onDrop={() => onMoveTask("1", c)}>
          <h4>{c}</h4>
          {tasks.filter(t => t.column === c).map(t => <p key={t.id}>{t.name}</p>)}
        </div>
      ))}
    </div>
  );
}`,
      "utf8"
    );

    const report = FeatureRealityValidator.validate(testDir);
    expect(report.passed).toBe(true);
  });

  it("Test 6 — Persistence: Persistent storage via localStorage/Prisma", () => {
    writeFileSync(
      join(testDir, "src/store.ts"),
      `export const taskStore = {
  load: () => JSON.parse(localStorage.getItem("tasks") || "[]"),
  save: (tasks: any[]) => localStorage.setItem("tasks", JSON.stringify(tasks)),
};`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src/App.tsx"),
      `import React, { useState, useEffect } from "react";
import { taskStore } from "./store";

export default function App() {
  const [tasks, setTasks] = useState(taskStore.load());
  const addTask = (t: any) => {
    const next = [...tasks, t];
    setTasks(next);
    taskStore.save(next);
  };
  return <button onClick={() => addTask({ id: "1" })}>Add</button>;
}`,
      "utf8"
    );

    const report = FeatureRealityValidator.validate(testDir);
    expect(report.passed).toBe(true);
  });

  it("Test 7 — False Positive Prevention: UI exists but handlers are empty / fake -> REJECTED", () => {
    writeFileSync(
      join(testDir, "src/FakeKanban.tsx"),
      `import React, { useState } from "react";

export function FakeKanban() {
  const [tasks] = useState([{ id: "1", title: "Task 1" }]);

  // Fake empty handler & console.log handler
  return (
    <div>
      <button onClick={() => {}}>Delete Task</button>
      <button onClick={() => console.log("clicked")}>Add Task</button>
    </div>
  );
}`,
      "utf8"
    );

    const agent = new RealityCheckerAgent();
    const result = agent.audit(testDir);

    expect(result.passed).toBe(false);
    expect(result.violationCount).toBeGreaterThan(0);
    expect(result.violations.some(v => v.violation.includes("Empty onClick") || v.violation.includes("Console.log"))).toBe(true);
  });

  it("Test 8 — False Negative Prevention: Custom hook + API service architecture -> ACCEPTED", () => {
    mkdirSync(join(testDir, "src/hooks"), { recursive: true });
    mkdirSync(join(testDir, "src/services"), { recursive: true });

    writeFileSync(
      join(testDir, "src/hooks/useTasks.ts"),
      `import { useState } from "react";
import { api } from "../services/api";

export function useTasks() {
  const [items, setItems] = useState<any[]>([]);
  const createTask = async (payload: any) => {
    const res = await api.create(payload);
    setItems(prev => [...prev, res]);
  };
  return { items, createTask };
}`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src/services/api.ts"),
      `export const api = {
  create: async (data: any) => {
    const res = await fetch("/api/tasks", { method: "POST", body: JSON.stringify(data) });
    return res.json();
  }
};`,
      "utf8"
    );

    writeFileSync(
      join(testDir, "src/BoardPage.tsx"),
      `import React from "react";
import { useTasks } from "./hooks/useTasks";

export default function BoardPage() {
  const { items, createTask } = useTasks();
  return (
    <div>
      <button onClick={() => createTask({ title: "New" })}>Create</button>
      {items.map(i => <div key={i.id}>{i.title}</div>)}
    </div>
  );
}`,
      "utf8"
    );

    const agent = new RealityCheckerAgent();
    const result = agent.audit(testDir);

    expect(result.passed).toBe(true);
    expect(result.violationCount).toBe(0);
  });
});
