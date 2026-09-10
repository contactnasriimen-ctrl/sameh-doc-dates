CREATE TABLE public.appointment_files (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  field_key text not null,
  file_name text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

CREATE INDEX appointment_files_appt_idx ON public.appointment_files (appointment_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_files TO anon, authenticated;
GRANT ALL ON public.appointment_files TO service_role;

ALTER TABLE public.appointment_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view appointment files" ON public.appointment_files FOR SELECT USING (true);
CREATE POLICY "Anyone can add appointment files" ON public.appointment_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete appointment files" ON public.appointment_files FOR DELETE USING (true);

CREATE POLICY "Clinical files read" ON storage.objects FOR SELECT USING (bucket_id = 'clinical-files');
CREATE POLICY "Clinical files insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clinical-files');
CREATE POLICY "Clinical files delete" ON storage.objects FOR DELETE USING (bucket_id = 'clinical-files');