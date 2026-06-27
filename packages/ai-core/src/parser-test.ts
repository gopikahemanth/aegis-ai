import { Parser } from "./generator/parser.js";

const parser = new Parser();

const response = `
===FILE: package.json===
{
  "name": "demo"
}

===FILE: src/index.ts===
console.log("Hello");
`;

const files = parser.parse(response);

console.log(files);
