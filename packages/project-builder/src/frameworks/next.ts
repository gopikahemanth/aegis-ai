import type { FrameworkTemplate } from "./framework.js";

export class NextTemplate
  implements FrameworkTemplate
{
  readonly name = "next";

  async create() {}
}
