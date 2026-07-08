
CREATE POLICY "Anyone can update appointments"
ON public.appointments FOR UPDATE
USING (true) WITH CHECK (true);
