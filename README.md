# Event Planning Assistant

A GenAI-powered planner for weddings, birthdays, and community events. It turns event details into an editable checklist, starting budget, vendor tracker, and practical ideas. The product is an organizer with AI assistance—not a chatbot that only gives suggestions.

## Hackathon requirements (must follow)

- **Chosen vertical:** Event Planning Assistant. **Primary persona:** a person organizing an event themselves and trying to control budget, tasks, and vendor decisions. Weddings, birthdays, and community events are supported event types within this vertical.
- Keep the GitHub repository **public**, commit and push progress regularly, and work on **one branch only**.
- Submit the complete project code and this README. The README must explain the chosen vertical, approach and logic, how the solution works, and assumptions.
- Design and test for code quality, security, efficiency, functionality, accessibility, and alignment with the problem statement.
- Build an actual context-aware assistant and deterministic product workflows, not just an AI prompt or a UI demo.

## Read these first

1. [`STARTUP_PROMPT.md`](STARTUP_PROMPT.md) — instructions for the coding agent before it changes code.
2. [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — users, evidence-backed problems, MVP features, UX, and acceptance criteria.
3. [`docs/TECHNICAL_SPEC.md`](docs/TECHNICAL_SPEC.md) — suggested stack, data model, routes, calculations, and build sequence.
4. [`docs/AI_RULES.md`](docs/AI_RULES.md) — AI boundaries, output contract, and validation rules.

## Product principles

- Turn suggestions into editable, saved tasks and budget items.
- Keep financial calculations in application code, not in the model.
- Never invent real vendors, local market rates, or verified claims.
- Label AI-created budget splits as starter allocations, not quotes.
- Ask only for information that materially changes the plan; let users skip optional fields.
- Build the MVP before adding integrations or a vendor marketplace.

## Suggested stack if the repository has no existing stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth), Zod, and Google Gemini API using `@google/genai`. Default model: `gemini-2.5-flash-lite`, configured through `GEMINI_MODEL`. Keep Gemini calls server-side and use structured JSON output validated with Zod. If the repository already uses a working stack, inspect it first and adapt these specs rather than replacing it.

**Model access note:** Google currently limits access to Gemini 2.5 models for some new projects. Verify that your AI Studio project can call `gemini-2.5-flash-lite` before building around it. If unavailable, change `GEMINI_MODEL` to a model enabled for your project; do not hard-code the model in multiple files. See the [official model page](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite).

## MVP in one demo

Create an event → generate and edit a plan → mark tasks complete → add budget figures and vendor quotes → see budget status update → run a `What if?` guest-count scenario using user-entered per-person costs.

## Submission README checklist

Before submission, confirm this README includes:

- Chosen challenge vertical and primary persona.
- Problem and proposed approach.
- Key decision logic and how the application works.
- Setup instructions and required environment variables.
- Assumptions, limitations, and what is not implemented.
- Tests run and any known issues.
