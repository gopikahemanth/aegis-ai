export async function helpCommand() {
  console.log(`
\x1b[1m\x1b[36m
    █████\u2588███\  ██\  ██\  █████\       ██\  ██████\
    ██  __██\ ██ | ██ | ██  __██\      ██ | ██  _____|
    ███████ |██ | ██ | ██ /  ██ |     ██ | \u2588████\
    ██  __██\ ██ | ██ | ██ | ██ |     ██ |  \____██\
    ██ | ██ |\u2588███████ |\u2588██████ |     ██ | ██████ |
    \__|  \__| \________|  \_______|     ██ | \_______|
                                    ██████  |
                                    \_______|
\x1b[0m
  \x1b[1mAegis AI\x1b[0m — Autonomous Software Engineering System
  Version: 2.2.0

\x1b[1m\x1b[33mUSAGE\x1b[0m
  aegis <command> [arguments]

\x1b[1m\x1b[33mCOMMANDS\x1b[0m

  \x1b[1m\x1b[36mcreate\x1b[0m \x1b[2m"<prompt>"\x1b[0m
    Generate a complete project from a natural language description.
    Flags:
      --image <path>   Attach a screenshot or UI mockup to guide generation
    Examples:
      aegis create "Build an ATS Resume Scanner with PDF upload and keyword scoring"
      aegis create "SaaS analytics dashboard with Stripe billing and PostgreSQL"
      aegis create --image ./mockup.png "Match this UI design"

  \x1b[1m\x1b[36medit\x1b[0m \x1b[2m"<instruction>"\x1b[0m
    Edit an existing generated project with a specific instruction.
    Examples:
      aegis edit "Add dark mode toggle to the navbar"
      aegis edit "Replace the chart library with Recharts"

  \x1b[1m\x1b[36mchat\x1b[0m
    Start an interactive AI chat session.
    Ask architecture questions, debug code, or plan features.
    Type  exit  to quit.

  \x1b[1m\x1b[36mdoctor\x1b[0m
    Run system diagnostics — checks Node version, API keys, pnpm,
    git, output directories, and Knowledge Graph data.

  \x1b[1m\x1b[36mquery\x1b[0m \x1b[2m"<question>"\x1b[0m
    Query the Aegis Knowledge Graph about your generated project.
    Examples:
      aegis query "Why did we choose PostgreSQL?"
      aegis query "Which components depend on authentication?"
      aegis query "What changed in the last generation?"

  \x1b[1m\x1b[36maudit\x1b[0m
    Run a regression audit and PR review on the generated project.
    Produces a pull-request.md report with detected issues.

  \x1b[1m\x1b[36maudit-trail\x1b[0m
    Show the full agent audit trail — every decision, file write,
    build result, and healing attempt logged chronologically.

  \x1b[1m\x1b[36manalytics\x1b[0m
    Display generation metrics: token usage, agent timing,
    provider failovers, and model selection breakdown.

  \x1b[1m\x1b[36mbenchmark\x1b[0m
    Run the Aegis agent pipeline benchmark suite.

  \x1b[1m\x1b[36mversion\x1b[0m
    Print the current Aegis AI version.

  \x1b[1m\x1b[36mhelp\x1b[0m
    Show this help message.

\x1b[1m\x1b[33mGETTING STARTED\x1b[0m

  1. Check your environment:
       aegis doctor

  2. Generate your first project:
       aegis create "Build a resume ATS scanner with PDF upload"

  3. Open the project:
       cd generated/project
       npm install
       npm run dev

  4. Ask questions about your project:
       aegis query "What state management did you use?"

\x1b[1m\x1b[33mRESOURCES\x1b[0m
  GitHub:  https://github.com/aegis-ai/aegis
  Docs:    https://docs.aegis.dev
`);
}
