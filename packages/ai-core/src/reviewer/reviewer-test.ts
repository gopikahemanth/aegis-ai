import { Reviewer } from "./reviewer.js";

const reviewer = new Reviewer();

const report = reviewer.review([
  {
    path: "src/index.tsx",
    content: `
import ReactDOM from "react-dom";

ReactDOM.render(<App />, root);
`,
  },
  {
    path: "src/App.tsx",
    content: "",
  },
]);

console.log(report);
