import { ErrorAnalyzer } from "./error-analyzer.js";

const analyzer = new ErrorAnalyzer();

const error = analyzer.analyze(
  "",
  `
src/index.ts:5:13 - error TS2304: Cannot find name 'hello'.

Found 1 error.
`,
);

console.log(error);
