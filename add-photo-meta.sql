-- Photo labels travel with the report, so a report started on the phone can
-- be finished on the website (and the other way round) with its photos still
-- tagged. Run once in the Supabase SQL editor; safe to run again.
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS photo_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Let the API see the new column straight away.
NOTIFY pgrst, 'reload schema';
