
-- Feature 7: Add custom_css column to capture_jobs
ALTER TABLE public.capture_jobs ADD COLUMN custom_css text DEFAULT NULL;

-- Feature 8: Create scheduled_captures table
CREATE TABLE public.scheduled_captures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  url text NOT NULL,
  device_preset text NOT NULL DEFAULT 'desktop-1440',
  viewport_width integer NOT NULL DEFAULT 1440,
  viewport_height integer NOT NULL DEFAULT 900,
  cron_expression text NOT NULL DEFAULT '0 0 * * *',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone NOT NULL DEFAULT now(),
  capture_options jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_captures ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own schedules"
  ON public.scheduled_captures FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create schedules"
  ON public.scheduled_captures FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own schedules"
  ON public.scheduled_captures FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own schedules"
  ON public.scheduled_captures FOR DELETE
  USING (user_id = auth.uid());
