import { GoogleGenAI } from '@google/genai';
import { PlanDraft, Event } from '@/types';
import { PlanDraftSchema, normalizeBudgetCategories, planDraftJsonSchema } from './schema';

/**
 * System instruction adhering strictly to docs/AI_RULES.md
 */
const SYSTEM_INSTRUCTION = `You are an expert event planning assistant helping a self-organizing host or coordinator plan an event (wedding, birthday, or community event).
Your job is to generate a practical, highly tailored first-draft event plan from the provided event details.

HARD BOUNDARIES:
1. Do not invent vendors, availability, ratings, reviews, market prices, or verified claims.
2. Return budget categories with percentage allocations (must sum to 100%). These are starter allocations, not vendor quotes.
3. Return tasks with 'daysBeforeEvent' integer offsets (0 to 730). Do not invent timestamps.
4. Do not perform bookings, payments, or actions outside returning this structured draft.
5. Adapt the suggestions to the specific event type, guest count, budget, city, and explicit preferences.
6. Return ONLY the requested JSON schema without any surrounding markdown or commentary.`;

/**
 * Generates an event plan draft using Google Gemini or falls back to intelligent archetype draft if unavailable.
 */
export async function generateEventPlan(event: Partial<Event>): Promise<{
  draft: PlanDraft;
  source: 'gemini' | 'archetype_fallback';
  modelUsed?: string;
  warning?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  // If no Gemini key is provided yet, produce a high-quality contextual archetype draft
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
    return {
      draft: generateArchetypeDraft(event),
      source: 'archetype_fallback',
      warning: 'GEMINI_API_KEY is not configured in .env.local. Generated a tailored starter plan based on your event specifications.',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Minimal sanitized payload
    const eventPayload = {
      eventType: event.event_type || 'community',
      eventName: event.name || 'My Event',
      eventDate: event.event_date,
      city: event.city || 'Not specified',
      currency: event.currency || 'USD',
      totalBudget: event.total_budget,
      guestCount: event.guest_count || 50,
      preferences: event.preferences || {},
    };

    const promptText = `Generate a comprehensive first-draft event plan for:
${JSON.stringify(eventPayload, null, 2)}

Ensure all budget category percentages sum to 100%. Ensure tasks have realistic 'daysBeforeEvent' integer offsets.`;

    // Call Gemini using structured output
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: planDraftJsonSchema,
        temperature: 0.4,
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Gemini returned an empty response.');
    }

    const rawJson = JSON.parse(outputText);
    const validated = PlanDraftSchema.parse(rawJson);

    // Normalize budget percentages to strictly equal 100%
    validated.budgetCategories = normalizeBudgetCategories(validated.budgetCategories);

    return {
      draft: validated,
      source: 'gemini',
      modelUsed: modelName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Gemini Plan Generation Warning] Failed to generate plan with model ${modelName}: ${errorMsg}. Falling back to tailored archetype.`);

    return {
      draft: generateArchetypeDraft(event),
      source: 'archetype_fallback',
      warning: `AI generation encountered an issue (${errorMsg}). A tailored template draft was provided for your review.`,
    };
  }
}

/**
 * Generates an event-type specific archetype draft when offline or when API key is pending
 */
export function generateArchetypeDraft(event: Partial<Event>): PlanDraft {
  const type = event.event_type || 'community';
  const guests = event.guest_count || 50;
  const name = event.name || 'Upcoming Event';

  if (type === 'wedding') {
    return {
      summary: `A structured planning roadmap for ${name} accommodating ${guests} guests. Focused on early venue securing, quote comparison, and sequential timeline execution.`,
      assumptions: [
        'Single day ceremony and reception timeline',
        'Guest count of approximately ' + guests + ' with potential 10-15% fluctuation',
        'Vendor quotes will require formal written contracts with advance policies',
      ],
      budgetCategories: normalizeBudgetCategories([
        { name: 'Venue & Rentals', percentage: 40, reason: 'Ceremony & reception spaces, tables, chairs, and basic lighting' },
        { name: 'Catering & Beverages', percentage: 30, reason: 'Food service, drinks, service staff, and banquet equipment' },
        { name: 'Photography & Video', percentage: 12, reason: 'Full-day photo capture and edited memory albums' },
        { name: 'Attire & Beauty', percentage: 8, reason: 'Attire, alterations, and morning styling' },
        { name: 'Floral & Decor', percentage: 6, reason: 'Centerpieces, ceremony backdrop, and accent florals' },
        { name: 'Contingency Reserve', percentage: 4, reason: 'Emergency buffer for unexpected overtime or logistics' },
      ]),
      tasks: [
        {
          title: 'Finalize & Reserve Main Venue',
          description: 'Compare shortlisted venues, verify occupancy limits, curfew, and security deposit terms.',
          category: 'Venue',
          daysBeforeEvent: 180,
          priority: 'high',
        },
        {
          title: 'Select Catering Vendor & Sample Tasting',
          description: 'Review dietary accommodations, serving style (buffet vs plated), and corkage policies.',
          category: 'Catering',
          daysBeforeEvent: 120,
          priority: 'high',
        },
        {
          title: 'Book Photographer and Videographer',
          description: 'Confirm coverage hours, digital rights, turnaround time, and payment schedule.',
          category: 'Media',
          daysBeforeEvent: 100,
          priority: 'high',
        },
        {
          title: 'Send Formal Invitations & Track RSVPs',
          description: 'Distribute invitations and track confirmations for headcount deadlines.',
          category: 'Guest Relations',
          daysBeforeEvent: 45,
          priority: 'medium',
        },
        {
          title: 'Finalize Day-of Run of Show & Vendor Contacts',
          description: 'Distribute timeline to key family, bridal party, and all booked suppliers.',
          category: 'Coordination',
          daysBeforeEvent: 7,
          priority: 'high',
        },
      ],
      ideas: [
        {
          title: 'Interactive Audio Guestbook',
          description: 'A vintage rotary phone where guests leave recorded voice messages throughout the evening.',
          reasonItFits: 'Memorable and personal touch without large operational overhead.',
          category: 'Guest Experience',
        },
        {
          title: 'Curated Local Late-Night Snack Station',
          description: 'Serve mini regional bites or comfort food sliders in the final hour of dancing.',
          reasonItFits: 'High guest delight factor that energizes the evening close.',
          category: 'Catering',
        },
      ],
      risks: [
        {
          title: 'Headcount Slippage Impacting Catering Minimums',
          reason: 'Caterers charge strict per-person rates and minimum spend commitments.',
          suggestedAction: 'Enforce an RSVP deadline at least 21 days prior and run the Plan Stress Test.',
          severity: 'high',
        },
        {
          title: 'Hidden Vendor Inclusions/Exclusions',
          reason: 'Quotes often omit service charges, cleanup, and overtime fees.',
          suggestedAction: 'Log explicit inclusions and exclusions in the Vendor Comparison tab.',
          severity: 'medium',
        },
      ],
    };
  }

  if (type === 'birthday') {
    return {
      summary: `An energetic celebration plan for ${name} designed for ${guests} guests, balancing party entertainment, hospitality, and budget control.`,
      assumptions: [
        'Single session gathering with focused music, food, and social elements',
        'Guest count will finalize 10 days in advance',
      ],
      budgetCategories: normalizeBudgetCategories([
        { name: 'Venue & Space Hire', percentage: 35, reason: 'Private party hall, lounge, or outdoor terrace' },
        { name: 'Food, Drinks & Cake', percentage: 35, reason: 'Appetizers, main dinner or buffet, specialty cake, and beverages' },
        { name: 'Music & Entertainment', percentage: 15, reason: 'DJ, sound system, games host, or performer' },
        { name: 'Decor & Lighting', percentage: 10, reason: 'Balloons, photobooth backdrop, and table accents' },
        { name: 'Party Favors & Misc', percentage: 5, reason: 'Takeaway tokens and emergency supplies' },
      ]),
      tasks: [
        {
          title: 'Confirm Event Location & Deposit',
          description: 'Secure venue contract and clarify sound restriction hours.',
          category: 'Venue',
          daysBeforeEvent: 45,
          priority: 'high',
        },
        {
          title: 'Order Specialty Cake and Dessert Array',
          description: 'Select flavor profiles, design elements, and confirm delivery time window.',
          category: 'Food',
          daysBeforeEvent: 20,
          priority: 'high',
        },
        {
          title: 'Prepare Playlist or Coordinate with DJ',
          description: 'Curate must-play tracks and timeline for toast, cake cutting, and dancing.',
          category: 'Entertainment',
          daysBeforeEvent: 10,
          priority: 'medium',
        },
        {
          title: 'Assemble Favors & Decor Kit',
          description: 'Gather table signage, photo props, and favors in labeled transport bins.',
          category: 'Decor',
          daysBeforeEvent: 3,
          priority: 'low',
        },
      ],
      ideas: [
        {
          title: 'DIY Polaroids & Memory Board',
          description: 'Instant film cameras with clips and a hanging wire for guests to peg spontaneous shots.',
          reasonItFits: 'Affordable, interactive, and gives the host an immediate keepsake.',
          category: 'Activity',
        },
      ],
      risks: [
        {
          title: 'Food Shortage from Unexpected Attendees',
          reason: 'Birthday parties frequently see plus-ones or last-minute drop-ins.',
          suggestedAction: 'Buffer catering by 10% on finger foods and maintain a contact list.',
          severity: 'medium',
        },
      ],
    };
  }

  // Community Event default
  return {
    summary: `A community-focused blueprint for ${name} engaging ${guests} neighborhood participants with clarity on permits, volunteers, and logistics.`,
    assumptions: [
      'Accessible venue compliant with public access guidelines',
      'Volunteer-assisted operational coordination on event day',
    ],
    budgetCategories: normalizeBudgetCategories([
      { name: 'Site Infrastructure & Audio', percentage: 35, reason: 'Canopies, tables, chairs, PA system, and electrical supply' },
      { name: 'Hospitality & Refreshments', percentage: 30, reason: 'Water stations, subsidized snacks, and volunteer meals' },
      { name: 'Permits, Insurance & Safety', percentage: 15, reason: 'City permits, park booking, and first aid coverage' },
      { name: 'Signage & Community Outreach', percentage: 12, reason: 'Bilingual banners, directional boards, and print fliers' },
      { name: 'Contingency Fund', percentage: 8, reason: 'Backup weather coverings and cleanup supplies' },
    ]),
    tasks: [
      {
        title: 'Submit Municipal Permits and Park Reservations',
        description: 'File public gathering notifications, sound permits, and trash removal requests.',
        category: 'Permits & City',
        daysBeforeEvent: 60,
        priority: 'high',
      },
      {
        title: 'Recruit and Brief Lead Volunteers',
        description: 'Assign leads for welcome desk, stage coordination, and safety.',
        category: 'Volunteers',
        daysBeforeEvent: 30,
        priority: 'high',
      },
      {
        title: 'Confirm Accessible Facilities and Restrooms',
        description: 'Verify step-free entrances, ADA accessibility, and restroom availability.',
        category: 'Accessibility',
        daysBeforeEvent: 14,
        priority: 'high',
      },
      {
        title: 'Conduct Final Site Walkthrough',
        description: 'Inspect power outlets, entrance flow, and emergency vehicle access.',
        category: 'Logistics',
        daysBeforeEvent: 2,
        priority: 'medium',
      },
    ],
    ideas: [
      {
        title: 'Community Contribution Board',
        description: 'A large chalk or marker board where attendees share aspirations for their neighborhood.',
        reasonItFits: 'Zero cost, highly engaging, and builds civic pride.',
        category: 'Engagement',
      },
    ],
    risks: [
      {
        title: 'Weather Disruption in Outdoor Area',
        reason: 'Community events without covered pavilions are vulnerable to sudden rain or wind.',
        suggestedAction: 'Designate an indoor backup location or rent heavy-duty pop-up tents.',
        severity: 'high',
      },
      {
        title: 'Volunteer No-shows on Event Morning',
        reason: 'Community volunteers can encounter last-minute schedule changes.',
        suggestedAction: 'Recruit 20% volunteer surplus and run a 15-minute morning briefing.',
        severity: 'medium',
      },
    ],
  };
}
