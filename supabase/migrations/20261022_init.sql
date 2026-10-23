-- Migration: Initial Schema for Event Planning Assistant

-- 1. Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'birthday', 'community')),
  event_date DATE NOT NULL,
  city TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  guest_count INTEGER,
  total_budget BIGINT NOT NULL DEFAULT 0,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create vendors table first (so budget_items can reference it if needed)
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  contact TEXT,
  status TEXT NOT NULL CHECK (status IN ('to_contact', 'contacted', 'quote_received', 'shortlisted', 'booked', 'not_selected')) DEFAULT 'to_contact',
  quote_amount BIGINT,
  currency TEXT NOT NULL DEFAULT 'USD',
  inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  advance_amount BIGINT,
  balance_due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  due_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  assignee_label TEXT,
  created_by TEXT NOT NULL CHECK (created_by IN ('ai', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create budget_items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  planned_amount BIGINT NOT NULL DEFAULT 0,
  quoted_amount BIGINT,
  actual_amount BIGINT,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  notes TEXT,
  unit_cost_per_guest BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON public.tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON public.budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_vendors_event_id ON public.vendors(event_id);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Events policies
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
CREATE POLICY "Users can insert own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own events" ON public.events;
CREATE POLICY "Users can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = owner_id);

-- Tasks policies
DROP POLICY IF EXISTS "Users can view own event tasks" ON public.tasks;
CREATE POLICY "Users can view own event tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own event tasks" ON public.tasks;
CREATE POLICY "Users can insert own event tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own event tasks" ON public.tasks;
CREATE POLICY "Users can update own event tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own event tasks" ON public.tasks;
CREATE POLICY "Users can delete own event tasks" ON public.tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_id = auth.uid())
  );

-- Budget items policies
DROP POLICY IF EXISTS "Users can view own event budget items" ON public.budget_items;
CREATE POLICY "Users can view own event budget items" ON public.budget_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own event budget items" ON public.budget_items;
CREATE POLICY "Users can insert own event budget items" ON public.budget_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own event budget items" ON public.budget_items;
CREATE POLICY "Users can update own event budget items" ON public.budget_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own event budget items" ON public.budget_items;
CREATE POLICY "Users can delete own event budget items" ON public.budget_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid())
  );

-- Vendors policies
DROP POLICY IF EXISTS "Users can view own event vendors" ON public.vendors;
CREATE POLICY "Users can view own event vendors" ON public.vendors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = vendors.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own event vendors" ON public.vendors;
CREATE POLICY "Users can insert own event vendors" ON public.vendors
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = vendors.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own event vendors" ON public.vendors;
CREATE POLICY "Users can update own event vendors" ON public.vendors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = vendors.event_id AND events.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own event vendors" ON public.vendors;
CREATE POLICY "Users can delete own event vendors" ON public.vendors
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = vendors.event_id AND events.owner_id = auth.uid())
  );
