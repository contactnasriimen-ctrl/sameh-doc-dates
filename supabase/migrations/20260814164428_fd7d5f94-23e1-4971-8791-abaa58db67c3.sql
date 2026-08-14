ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referral_detail text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS atcd text,
  ADD COLUMN IF NOT EXISTS illness_history text,
  ADD COLUMN IF NOT EXISTS physical_exam text,
  ADD COLUMN IF NOT EXISTS complementary_exam text,
  ADD COLUMN IF NOT EXISTS evolution text;