ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS phone2_name text,
  ADD COLUMN IF NOT EXISTS habit_tobacco text,
  ADD COLUMN IF NOT EXISTS habit_alcohol text,
  ADD COLUMN IF NOT EXISTS habit_sexual text;