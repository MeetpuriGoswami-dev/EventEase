# Product Spec

## 1. Product goal

Help a person organize a wedding, birthday, or community event without juggling disconnected notes, spreadsheets, chat messages, and assumptions. A user should leave setup with a practical plan they can edit and track.

**Chosen challenge vertical:** Event Planning Assistant.

**Primary persona:** a self-organizing host or coordinator who has a fixed budget, a deadline, guests to account for, and several decisions to manage. Weddings, birthdays, and community events are supported event types within this one vertical. The interface and planning logic should adapt to the selected event type rather than behave like a generic chatbot.

## 2. What the research suggests

These surveys support the problem direction, but they are not universal estimates for every country or event type:

- **Budget pressure is material.** Cvent's 2025 article reports that cost and staying within budget were the two leading concerns in its planner sourcing research (30% and 31%). WeddingWire India's survey says 53% of its surveyed couples prioritized staying within budget. Sources: [Cvent](https://www.cvent.com/en/blog/hospitality/navigating-event-costs-cvb-dmo), [WeddingWire India](https://www.weddingwire.in/wedding-tips/annual-wedding-industry-report--c11025).
- **Venue timing can be a real risk.** WedMeGood's 2025–2026 report says venue availability accounted for 37.91% of reported venue frustrations. This supports date-aware checklists and early risk warnings, not claims about availability at a specific venue. Source: [WedMeGood 2025–2026 report](https://www.wedmegood.com/blog/wedmegood-annual-wedding-industry-report-2025-2026/).
- **Vendor research is fragmented.** In WedMeGood's 2024–2025 survey, more than 40% of respondents used multiple channels—including offline recommendations, wedding apps, and social media—to make vendor decisions. WeddingWire India's survey reports word of mouth, Google, and wedding websites as common vendor discovery channels. Sources: [WedMeGood 2024–2025 report](https://www.wedmegood.com/blog/wedmegood-annual-wedding-industry-report-2024-2025), [WeddingWire India](https://www.weddingwire.in/wedding-tips/annual-wedding-industry-report--c11025).
- **Event details are often communicated in existing channels.** In WeddingWire India's survey, 58.6% of respondents said they used WhatsApp for wedding-related communication. The planner should create a summary users can share, rather than requiring them to move every conversation into another app. Source: [WeddingWire India](https://www.weddingwire.in/wedding-tips/annual-wedding-industry-report--c11025).
- **Wedding budgets change.** WedMeGood's 2025–2026 report describes an 8% year-over-year rise in surveyed wedding spend/budgets. These are survey findings, not reliable estimates for an individual user's event; do not hard-code them as local prices. Source: [WedMeGood 2025–2026 report](https://www.wedmegood.com/blog/wedmegood-annual-wedding-industry-report-2025-2026/).

**Limitations:** the sources above focus mainly on weddings and include industry/platform surveys. They do not prove that birthday hosts or community organizers have identical priorities. Validate these assumptions with a few target users during the hackathon.

**Product implication:** focus on budget visibility, a single editable plan, vendor-quote comparison, date-aware priorities, and changes that update the plan. Do not build a generic idea chatbot or pretend to have verified local vendor prices.

## 2A. Competitive baseline and differentiation

Existing wedding products already provide pieces such as checklists, budgets, vendor directories, inspiration, and guest tools; WedMeGood and WeddingWire India advertise several of these directly. Sources: [WedMeGood](https://www.wedmegood.com/blog/wedmegood-annual-wedding-industry-report-2025-2026/), [WeddingWire India](https://www.weddingwire.in/wedding-tips/annual-wedding-industry-report--c11025). Do not pitch those individual features as unique.

Differentiate through the **complete, transparent planning loop**:

1. Generate a context-aware draft across weddings, birthdays, and community events—not just a vendor directory.
2. Turn it into a saved, editable checklist and budget.
3. Compare user-entered quotes and show missing quote details.
4. Run a Plan Stress Test using actual user-entered costs and make unknowns explicit.
5. Give the user a concise next action and a shareable summary.

The distinctive value is reliable coordination and transparent trade-offs, not “AI-generated ideas” alone.

## 3. Users and core jobs

- **Self-planning couple / family:** coordinate several wedding functions, manage a large checklist, compare quotes, and keep spending visible.
- **Birthday host:** plan an event with a date, guest count, theme, and budget; avoid missing essentials.
- **Community organizer:** coordinate volunteers, suppliers, tasks, venue needs, and shared responsibilities.

Shared job: “Given my event date, budget, guests, location, and preferences, help me know what to do next and what decisions may put the plan at risk.”

## 4. Main user problems and solution

| Problem | Product response |
|---|---|
| The user does not know where to start. | A short setup wizard creates a structured first draft: tasks, timeline, budget categories, and ideas. |
| Budgets are hard to track as estimates become quotes and final costs. | Show planned, quoted, actual, and paid amounts separately; flag projected overspend. |
| Vendor options are discovered in different places and quotes are difficult to compare. | A user-managed vendor board with quote amount, inclusions, exclusions, advance, balance due date, and status. No fake marketplace listings. |
| Important actions get lost in messages and notes. | One checklist with dates, priorities, status, and an optional owner; a copy/print-friendly summary can be shared externally. |
| A change in guest count or spend creates knock-on effects. | **Signature feature — Plan Stress Test:** change guest count or a known per-person cost and calculate the impact from user-entered figures. If the app lacks data, show qualitative effects instead of inventing a number. |
| Generic ideas do not fit the occasion. | Generate ideas using event type, budget, guest count, city, style, schedule, and user-provided cultural, dietary, and accessibility preferences. |

## 5. MVP scope (build these first)

### A. Event setup

Required: event type (`wedding`, `birthday`, `community`), event name, event date, currency, total budget, and approximate guest count. City and preferences are optional but improve suggestions. For the MVP, use one primary event date; add multi-day / multiple-function timelines only after the core flow works.

Capture optional style/theme, dietary needs, accessibility needs, cultural preferences, venue constraints, and must-haves. These should be free to skip and editable later.

### B. AI plan draft

Generate an editable first draft containing:

- a short summary and explicit assumptions;
- dated tasks grouped by urgency, each with priority and category;
- budget categories with proposed percentage allocation;
- personalized ideas and risks with practical next actions.

The user reviews the draft before saving it. All outputs remain editable. Dates are calculated by the application from `daysBeforeEvent`, not trusted as model-generated timestamps.

### C. Budget tracker

For each category/item, track `planned`, `quoted`, `actual`, and `paid` amounts. Show total budget, projected final cost, amount spent, outstanding amount, and variance. Make calculations deterministic and recalculate after every edit.

Starter budget splits are suggestions only. Never show them as local market prices. Let users edit allocations and record their own quotes.

### D. Vendor tracker and quote comparison

Allow users to add vendors manually, set a category and status (`to_contact`, `contacted`, `quote_received`, `shortlisted`, `booked`, `not_selected`), and record a quote, inclusions, exclusions, advance, and due date. A comparison view should make missing information visible (for example, taxes, setup, delivery, overtime, cancellation terms) without making legal claims.

Do not create a public vendor directory in the MVP. Do not claim a vendor is verified or available.

### E. Dashboard and next action

Show the event countdown, budget health, task completion, the three most important upcoming/overdue tasks, and open vendor decisions. Avoid filling the landing screen with low-value charts.

### F. Signature feature: Plan Stress Test

Let the user change the planned guest count and/or known per-guest costs. Recalculate the scenario using stored numbers and clearly distinguish the scenario from the saved plan. Provide a short explanation of the largest cost drivers. If the user has not entered the unit cost for a category, do not fabricate the cost impact.

### G. Shareable summary

Provide a print-friendly plan or a copyable summary that the user can share in their existing messaging app. No messaging API integration is required for the MVP.

## 6. Defer until after the MVP

Multi-user invitations and role permissions, guest list/RSVP management, calendar sync, payment processing, a vendor marketplace, automated WhatsApp messaging, quote-file OCR, push notifications, and native mobile apps. The first release should prove the planning workflow before adding these.

## 7. UI direction

- **Feel:** calm, warm, polished, practical. It should feel like a useful planner, not a generic AI chat screen.
- **Visuals:** warm off-white canvas, dark ink text, forest-green primary actions, restrained terracotta highlights, generous spacing, readable type, consistent borders, simple icons.
- **Navigation:** desktop sidebar with Overview, Timeline, Budget, Vendors, and Ideas; compact mobile navigation.
- **Dashboard order:** event/date header → next action and upcoming tasks → budget health → vendor decisions → idea preview.
- **Interaction:** inline edits, clear save state, confirm before discarding edits, useful empty states, loading skeletons, and helpful errors. Use charts only when they improve understanding.
- **Accessibility:** keyboard access, visible focus, descriptive labels, sufficient contrast, and responsive layout. Use [WCAG guidance](https://www.w3.org/WAI/standards-guidelines/wcag/) as the reference.
- **Avoid:** overdecorated gradients, oversized empty hero sections, emoji-heavy UI, long AI paragraphs, fake activity, and placeholder vendor reviews.

## 8. MVP acceptance criteria

1. A user can create and reopen an event; the event details persist.
2. Generating a plan produces valid editable tasks, budget categories, ideas, assumptions, and risks.
3. A user can edit/complete a task and see the update persist.
4. Editing budget amounts recalculates projected cost, paid amount, outstanding amount, and budget variance correctly.
5. A user can add at least two vendor quotes and compare recorded amounts and inclusions/exclusions.
6. Plan Stress Test uses known user-entered unit costs and does not invent unknown costs.
7. AI failure, invalid output, empty states, and loading states are handled without losing saved data.
8. The UI works on desktop and mobile and does not expose API keys or another user's event data.

## 9. Challenge evaluation and demo evidence

Treat the hackathon's evaluation areas as acceptance criteria:

- **Problem alignment:** show a complete event-planning workflow grounded in the chosen persona.
- **Smart, dynamic behavior:** demonstrate that event type, date, guest count, budget, and user-entered costs change the plan or calculations.
- **Code quality:** keep UI, domain calculations, persistence, and Gemini integration separated and understandable.
- **Security:** protect secrets, validate requests, and enforce ownership for private event data.
- **Efficiency:** keep model input/output focused and avoid unnecessary calls or complex agent workflows.
- **Testing:** test budget math, stress-test calculations, AI output validation, and access controls.
- **Accessibility:** verify keyboard navigation, focus visibility, labels, contrast, and mobile layouts.

Do not claim compliance without implementation or test evidence. If the organizer supplies a separate High/Medium/Low classification for criteria, prioritize by that classification; do not invent an unseen mapping.

## 10. Success signals for a hackathon demo

Track whether a user can reach a useful first draft quickly, edit it, and complete the core loop: plan → quote → budget update → scenario. Useful analytics include plan generation success, time to first edit, tasks completed, quotes compared, and budget items updated. Treat these as product signals, not promised outcomes.
