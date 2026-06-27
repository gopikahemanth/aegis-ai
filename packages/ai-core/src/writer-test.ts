import { FileWriter } from "./writer/writer.js";

const writer = new FileWriter();

writer.write(
  [
    {
      path: "src/index.html",
      content: "<h1>Hello Aegis</h1>",
    },
    {
      path: "package.json",
      content: '{ "name": "demo" }',
    },
  ],
  "./generated"
);

console.log("Done!");
