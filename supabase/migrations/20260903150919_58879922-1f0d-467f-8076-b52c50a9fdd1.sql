ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS age text,
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS social_coverage text,
  ADD COLUMN IF NOT EXISTS phone2 text,
  ADD COLUMN IF NOT EXISTS patient_code text;

CREATE INDEX IF NOT EXISTS appointments_patient_code_idx ON public.appointments (patient_code);