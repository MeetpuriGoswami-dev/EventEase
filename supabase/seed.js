const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'sidgzopijlzkikqennfh';

  if (!token) {
    console.error('ERROR: SUPABASE_ACCESS_TOKEN environment variable is required to run seed script.');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const sql = `
  -- Clean up test records
  DELETE FROM public.events WHERE owner_id = '${DEMO_USER_ID}';

  -- 1. Insert Riya's 25th Birthday
  WITH e1 AS (
    INSERT INTO public.events (id, owner_id, name, event_type, event_date, city, currency, guest_count, total_budget, preferences)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      '${DEMO_USER_ID}',
      'Riya''s 25th Birthday',
      'birthday',
      '2026-11-15',
      'Jaipur, Rajasthan',
      'INR',
      100,
      25000000, -- ₹ 2,50,000
      '{"theme": "Royal Traditional", "tags": ["Traditional", "Outdoor", "Food Focused"]}'::jsonb
    )
    RETURNING id
  ),
  -- Insert Vendors for e1
  v1 AS (
    INSERT INTO public.vendors (event_id, name, category, status, quote_amount, currency, inclusions, exclusions)
    SELECT id, 'Royal Palace Hotel', 'Venue', 'booked', 8000000, 'INR', '["Outdoor Lawn", "AC Banquet Hall", "Valet Parking"]'::jsonb, '["Diesel fuel generator"]'::jsonb FROM e1
    UNION ALL
    SELECT id, 'Spice & Beyond', 'Catering', 'booked', 6000000, 'INR', '["Multi-cuisine buffet", "Live counters", "Service staff"]'::jsonb, '["Alcohol corkage fee"]'::jsonb FROM e1
    UNION ALL
    SELECT id, 'Blooming Events', 'Decoration', 'quote_received', 4500000, 'INR', '["Fairy light canopy", "Floral stage", "Entrance arch"]'::jsonb, '["Fresh exotic imported flowers"]'::jsonb FROM e1
    UNION ALL
    SELECT id, 'Shutter Stories', 'Photography', 'booked', 2500000, 'INR', '["Traditional & candid photos", "Teaser video", "Full digital album"]'::jsonb, '["Drone photography"]'::jsonb FROM e1
    UNION ALL
    SELECT id, 'Glow & Grace', 'Makeup & Styling', 'quote_received', 1800000, 'INR', '["Party makeup", "Hair styling", "Draping"]'::jsonb, '["Extra family member touchups"]'::jsonb FROM e1
    RETURNING id
  ),
  -- Insert Budget Items for e1
  b1 AS (
    INSERT INTO public.budget_items (event_id, name, category, planned_amount, actual_amount, paid_amount, unit_cost_per_guest, notes)
    SELECT id, 'Venue & Space Hire', 'Venue', 8000000, 8000000, 4000000, null, 'Advance 50% paid to Royal Palace Hotel' FROM e1
    UNION ALL
    SELECT id, 'Food & Beverages', 'Food & Beverages', 6000000, 6000000, 2500000, 60000, '₹600/guest per-person catering rate' FROM e1
    UNION ALL
    SELECT id, 'Decoration & Florals', 'Decoration', 4500000, 4500000, 1500000, null, 'Canopy drapes and centerpieces' FROM e1
    UNION ALL
    SELECT id, 'Photography & Videography', 'Photography', 2500000, 2500000, 1000000, null, 'Full evening candid coverage' FROM e1
    UNION ALL
    SELECT id, 'Entertainment & DJ', 'Entertainment', 2000000, 2000000, 0, null, 'DJ console and dance floor lighting' FROM e1
    UNION ALL
    SELECT id, 'Party Favors & Miscellaneous', 'Others', 2000000, 1500000, 0, 15000, 'Custom souvenir boxes at ₹150/head' FROM e1
    RETURNING id
  ),
  -- Insert Tasks for e1
  t1 AS (
    INSERT INTO public.tasks (event_id, title, description, category, due_date, priority, status, created_by)
    SELECT id, 'Confirm venue booking and deposit', 'Finalize booking with Royal Palace Hotel and verify curfew', 'Venue', '2026-10-25'::date, 'high', 'done', 'user' FROM e1
    UNION ALL
    SELECT id, 'Review vendor quotes for catering', 'Confirm menu tasting with Spice & Beyond', 'Catering', '2026-10-28'::date, 'high', 'in_progress', 'user' FROM e1
    UNION ALL
    SELECT id, 'Finalize guest list and RSVP count', 'Check invitations responses to confirm catering plate count', 'Guests', '2026-11-01'::date, 'medium', 'todo', 'user' FROM e1
    UNION ALL
    SELECT id, 'Approve decoration & lighting design', 'Finalize color palette and fairy light backdrop with decorator', 'Decoration', '2026-11-05'::date, 'medium', 'todo', 'user' FROM e1
    UNION ALL
    SELECT id, 'Send digital invitations via WhatsApp', 'Send personalized links with event schedule and location pins', 'Planning', '2026-11-08'::date, 'low', 'todo', 'user' FROM e1
    RETURNING id
  )
  SELECT count(*) FROM e1;

  -- 2. Insert Aarav & Meera's Wedding
  WITH e2 AS (
    INSERT INTO public.events (id, owner_id, name, event_type, event_date, city, currency, guest_count, total_budget, preferences)
    VALUES (
      '22222222-2222-2222-2222-222222222222',
      '${DEMO_USER_ID}',
      'Aarav & Meera''s Wedding',
      'wedding',
      '2026-12-22'::date,
      'Udaipur, Rajasthan',
      'INR',
      250,
      120000000, -- ₹ 12,00,000
      '{"theme": "Royal Heritage Palace", "tags": ["Traditional", "Outdoor", "Live Music"]}'::jsonb
    )
    RETURNING id
  )
  INSERT INTO public.tasks (event_id, title, description, category, due_date, priority, status, created_by)
  SELECT id, 'Reserve palace courtyard for sangeet & ceremony', 'Book historical heritage property', 'Venue', '2026-11-10'::date, 'high', 'done', 'user' FROM e2
  UNION ALL
  SELECT id, 'Finalize live band and shehnai performers', 'Traditional welcome instrumentalists', 'Entertainment', '2026-11-20'::date, 'high', 'todo', 'user' FROM e2;

  -- 3. Insert Green Community Fest
  WITH e3 AS (
    INSERT INTO public.events (id, owner_id, name, event_type, event_date, city, currency, guest_count, total_budget, preferences)
    VALUES (
      '33333333-3333-3333-3333-333333333333',
      '${DEMO_USER_ID}',
      'Green Community Fest',
      'community',
      '2026-11-30'::date,
      'Bangalore, Karnataka',
      'INR',
      300,
      10000000, -- ₹ 1,00,000
      '{"theme": "Eco-friendly Neighborhood Carnival", "tags": ["Outdoor", "Sustainable"]}'::jsonb
    )
    RETURNING id
  )
  INSERT INTO public.tasks (event_id, title, description, category, due_date, priority, status, created_by)
  SELECT id, 'Obtain municipal park permits and acoustic permissions', 'File city hall gathering license', 'Permits', '2026-11-05'::date, 'high', 'todo', 'user' FROM e3;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.text();
  console.log('Seed result:', res.status, data);
}

seed();
