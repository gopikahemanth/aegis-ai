import type { FrameworkTemplate } from "./framework.js";

export class HtmlTemplate
  implements FrameworkTemplate
{
  readonly name = "html";

  async create() {}
}
