import { ProjectCreator } from "./project-creator.js";

const creator =
  new ProjectCreator();

await creator.create(
  "react-vite",
  "demo-app",
  "./generated/react-template",
);

console.log(
  "React template created successfully."
);
