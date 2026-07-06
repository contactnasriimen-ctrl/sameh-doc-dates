import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const bookSchema = z.object({
  patient_name: z.string().min(2).max(100),
  phone: z.string().min(4).max(30),
  appointment_at: z.string().min(1),
  reason: z.string().max(500).optional().nullable(),
});

function getClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        if (headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const bookAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getClient();
    const { data: row, error } = await supabase
      .from("appointments")
      .insert({
        patient_name: data.patient_name,
        phone: data.phone,
        appointment_at: data.appointment_at,
        reason: data.reason ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAppointments = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const deleteAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = getClient();
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
