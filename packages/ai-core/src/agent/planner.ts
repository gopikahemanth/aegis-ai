export interface PlanStep {
  id: number;
  title: string;
  completed: boolean;
}

export class Planner {
  createPlan(request: string): PlanStep[] {
    return [
      {
        id: 1,
        title: `Understand request: ${request}`,
        completed: false,
      },
      {
        id: 2,
        title: "Analyze project",
        completed: false,
      },
      {
        id: 3,
        title: "Generate code",
        completed: false,
      },
      {
        id: 4,
        title: "Review output",
        completed: false,
      },
    ];
  }
}
