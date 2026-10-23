# Technical Spec

## 1. Keep the architecture small

Use a normal web app with server-side AI generation and a relational database. AI drafts structured data; application code validates, calculates, persists, and displays it. Do not build a multi-agent system.

### Suggested stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui + lucide-react
- Supabase Postgres and Auth
- Zod for request and AI-output validation
- Google Gemini API with the official `@google/genai` JavaScript SDK and JSON Schema structured output ([SDK](https://ai.google.dev/gemini-api/docs/libraries), [structured output](https://ai.google.dev/gemini-api/docs/structured-output))
- Recharts only if a chart makes budget status easier to read

If the repository already has a stack, keep it and adapt these choices. Do not add packages without a concrete need.

## 2. Main screens

- `/` — event list or a clear create-event state
- `/events/new` — short setup wizard
- `/events/[id]` — Overview
- `/events/[id]/timeline` — tasks and due dates
- `/events/[id]/budget` — budget items and variance
- `/events/[id]/vendors` — vendor list and quote comparison
- `/events/[id]/ideas` — generated ideas

Use a reusable event layout, shared forms, status badges, confirmation dialogs, skeletons, and empty/error states. Avoid duplicating event logic across pages.

## 3. Minimal data model

Use UUID primary keys, timestamps, foreign keys, and database constraints. Store money as integer minor units (paise/cents) where practical, with an explicit ISO currency code; never use floating-point values for final money calculations.

### `events`

- `id`, `owner_id`, `name`
- `event_type` (`wedding`, `birthday`, `community`)
- `event_date` (date), `city` (nullable)
- `currency` (ISO code), `guest_count` (integer, nullable), `total_budget` (integer minor units)
- `preferences` (JSONB: style, functions, cultural/dietary/accessibility preferences, constraints)
- `created_at`, `updated_at`

### `tasks`

- `id`, `event_id`, `title`, `description`, `category`
- `due_date` (date), `priority` (`high`, `medium`, `low`)
- `status` (`todo`, `in_progress`, `done`), `assignee_label` (nullable text)
- `created_by` (`ai`, `user`), `created_at`, `updated_at`

### `budget_items`

- `id`, `event_id`, `name`, `category`
- `planned_amount`, `quoted_amount` (nullable), `actual_amount` (nullable), `paid_amount` (default 0), all integer minor units
- `vendor_id` (nullable), `notes` (nullable), `created_at`, `updated_at`

### `vendors`

- `id`, `event_id`, `name`, `category`, `contact` (nullable)
- `status` (`to_contact`, `contacted`, `quote_received`, `shortlisted`, `booked`, `not_selected`)
- `quote_amount` (nullable, integer minor units), `currency`
- `inclusions` (text/JSONB), `exclusions` (text/JSONB), `advance_amount` (nullable), `balance_due_date` (nullable date)
- `notes` (nullable), `created_at`, `updated_at`

If vendor quote comparison needs multiple quotes per vendor, add a `vendor_quotes` table rather than packing unrelated quotes into a single vendor record. Keep the initial implementation simple.

## 4. Core application calculations

Run these calculations in tested application code, not in an LLM response.

- `plannedTotal = sum(planned_amount)`
- `paidTotal = sum(paid_amount)`
- `projectedTotal = sum(actual_amount ?? quoted_amount ?? planned_amount)`
- `outstandingTotal = sum(max(0, (actual_amount ?? quoted_amount ?? planned_amount) - paid_amount))`
- `budgetVariance = total_budget - projectedTotal`
- `budgetUsagePercent = total_budget > 0 ? projectedTotal / total_budget * 100 : 0`

Display negative budget variance as projected overspend. Label projections clearly. Decide and test how refunds, overpayments, and zero budgets are handled; do not silently clamp a displayed overspend to zero.

For the Stress Test, use the user's saved per-guest unit costs when available. Example: `scenarioCatering = newGuestCount * enteredCateringCostPerGuest`. If no unit cost exists, show “Add a per-guest cost to calculate this impact” instead of a fabricated result.

## 5. AI generation contract

### Server route

`POST /api/events/[id]/generate-plan`

1. Authenticate the request and authorize access to the event.
2. Validate event input with Zod; send only the event details needed for planning.
3. Call the model using strict structured output.
4. Validate the response again with Zod and business rules.
5. Return the draft to the client for review; do not write the generated draft into the saved plan until the user confirms.
6. On confirmation, persist tasks and budget items through a normal authenticated server action/API route.

### Draft response shape

```ts
type PlanDraft = {
  summary: string;
  assumptions: string[];
  budgetCategories: Array<{
    name: string;
    percentage: number;
    reason: string;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    category: string;
    daysBeforeEvent: number;
    priority: "high" | "medium" | "low";
  }>;
  ideas: Array<{
    title: string;
    description: string;
    reasonItFits: string;
    category: string;
  }>;
  risks: Array<{
    title: string;
    reason: string;
    suggestedAction: string;
    severity: "high" | "medium" | "low";
  }>;
};
```

Clamp and validate `daysBeforeEvent` to a reasonable integer range. Compute `due_date = event_date - daysBeforeEvent` on the server. If a task is already overdue because the event is soon, show it as due/overdue; do not move dates silently.

Validate that budget percentages are finite, non-negative, and not all zero. Normalize them in application code to total 100 and calculate starter amounts from the user's total budget. Clearly label them **AI-suggested allocation — not a vendor quote**. Handle rounding so rounded amounts sum to the full budget, or leave the unallocated difference explicit.

Enforce practical limits (for example, a bounded number of tasks, ideas, risks, and categories) to keep the result focused. If output is invalid, retry once with a concise repair instruction; if still invalid, show an error and preserve all existing data.

## 6. Gemini integration

- Install `@google/genai`; use the official SDK, not a hand-written HTTP wrapper.
- Read `GEMINI_API_KEY` and `GEMINI_MODEL` on the server only. Default model: `gemini-2.5-flash-lite`.
- Use the Gemini Interactions API with `response_format` set to `application/json` and a JSON Schema for `PlanDraft`. Validate the parsed result again with Zod; structured output does not replace application validation.
- Use a stateless request (`store: false`) for this one-shot plan-generation flow. Do not send guest names, phone numbers, or vendor personal contact details.
- Keep the prompt and input focused on the event fields listed in `AI_RULES.md`. No web search, function calling, multi-agent workflow, or extra AI layer is needed for the MVP.
- Handle API errors, timeouts, empty output, JSON parse errors, invalid schema, and rate limits. Retry invalid output at most once; never delete or overwrite the saved plan when generation fails.
- Verify model availability in Google AI Studio first: Google currently limits access to Gemini 2.5 models for some new projects. The stable model ID is `gemini-2.5-flash-lite`; if unavailable, change `GEMINI_MODEL` to a model enabled for the API project.

Example integration shape (the schema should be defined once in code and kept aligned with `PlanDraft`):

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const interaction = await ai.interactions.create({
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  input: JSON.stringify({ instructions: conciseSystemInstruction, event: validatedEvent }),
  response_format: {
    type: "text",
    mime_type: "application/json",
    schema: planDraftJsonSchema,
  },
  store: false,
});

const draft = PlanDraftSchema.parse(JSON.parse(interaction.output_text));
```

The example shows the integration pattern, not the full schema or route handler. Add timeout/error handling around the request.

## 7. Suggested endpoints/actions

- `POST /api/events` — create event
- `GET /api/events` — list events owned by the current user
- `GET /api/events/[id]` — event detail, after authorization
- `POST /api/events/[id]/generate-plan` — generate draft only
- `POST /api/events/[id]/save-plan` — validate and persist user-approved draft
- `PATCH /api/tasks/[id]` — update status, due date, priority, or assignee label
- `POST /api/events/[id]/budget-items` and `PATCH /api/budget-items/[id]`
- `POST /api/events/[id]/vendors` and `PATCH /api/vendors/[id]`

Route naming may be adapted to the repo; do not create duplicate API styles without a reason.

## 8. Security and data handling

- Keep model API keys and Supabase service-role keys server-side only.
- Authenticate every private read/write and check ownership for every event-scoped record; never trust an `event_id` supplied by the client without authorization.
- If using Supabase, enable Row Level Security on exposed tables and test allow/deny policies. A service-role key bypasses RLS and must not reach browser code. Reference: [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).
- Validate and bound all inputs, including text length, guest counts, dates, amounts, and generated list sizes.
- Do not send guest names, phone numbers, or vendor personal contact details to the model when they are not required for planning.
- Do not allow generated text to trigger bookings, payments, messages, or calendar writes. Such integrations require explicit user action and a later scoped feature.
- Keep server errors useful but never return secrets, stack traces, or raw provider credentials.

## 9. Environment variables

Use `.env.local` locally and commit only `.env.example` with placeholders:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

Never commit real credentials. `GEMINI_API_KEY` must not use a `NEXT_PUBLIC_` prefix. Check that the model is enabled for your Google AI Studio project; keep model selection configurable in `GEMINI_MODEL`.

## 10. Build sequence

1. Inspect the existing repository, identify its stack, and report any missing setup before changing dependencies.
2. Build the responsive shell, event creation form, and persistent event model.
3. Implement the overview and task CRUD with empty/loading/error states.
4. Implement deterministic budget calculations and vendor CRUD/quote comparison.
5. Add strict AI plan generation and draft review/save flow.
6. Add Plan Stress Test using known user-entered rates.
7. Add accessibility, authorization, and calculation tests; run lint, typecheck, and production build.

## 11. Required tests

- Budget totals and rounding, including no items, zero budget, quoted-vs-actual changes, and overspend.
- Guest-count scenario with a known unit cost and with a missing unit cost.
- AI output schema rejection, malformed response, and provider timeout.
- Event ownership: users cannot read/update/delete another user's event, task, budget item, or vendor.
- Past/near event dates and generated tasks whose due dates have already passed.
- Mobile layout, keyboard navigation, and visible form validation.


## 12. Hackathon repository and submission rules

- Keep the GitHub repository public and include the complete project code. Never commit secrets or real `.env` files.
- Work on a single branch only; do not create feature branches. Commit coherent milestones regularly and push them when repository access is configured. If push credentials are unavailable, say so instead of claiming the push succeeded.
- Keep the root `README.md` accurate. It must explain the chosen vertical, primary persona, approach and logic, how the solution works, setup, assumptions, limitations, and tests.
- Make evaluation evidence visible: document runnable tests and ensure the demo can show context-aware planning, deterministic budget updates, and the Plan Stress Test.
- Never report tests, security checks, builds, commits, or pushes as successful unless actually run and confirmed.
