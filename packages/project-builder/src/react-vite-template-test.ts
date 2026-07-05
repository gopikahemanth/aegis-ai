import { ReactViteTemplate } from "./frameworks/react-vite.js";

const template =
  new ReactViteTemplate();

await template.create(
  "demo-app",
  "./generated/react-vite",
);

console.log(
  "React template created."
);
