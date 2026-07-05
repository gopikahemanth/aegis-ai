import { FrameworkRouter } from "./router.js";

import { HtmlTemplate } from "./html.js";
import { ReactViteTemplate } from "./react-vite.js";
import { ExpressTemplate } from "./express.js";
import { NextTemplate } from "./next.js";

export function createFrameworkRouter() {
  const router = new FrameworkRouter();

  router.register(new HtmlTemplate());
  router.register(new ReactViteTemplate());
  router.register(new ExpressTemplate());
  router.register(new NextTemplate());

  return router;
}
