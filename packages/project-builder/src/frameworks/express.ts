import type { FrameworkTemplate } from "./framework.js";

export class ExpressTemplate
  implements FrameworkTemplate
{
  readonly name = "express";

  async create() {}
}
