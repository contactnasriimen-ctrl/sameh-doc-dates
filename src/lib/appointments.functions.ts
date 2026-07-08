import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const bookSchema = z.object({
  patient_name: z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
  phone: z.preprocess(emptyToNull, z.string().max(30).nullable().optional()),
  appointment_at: z.preprocess(emptyToNull, z.string().nullable().optional()),
  reason: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  diagnosis: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
  treatment: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
  medical_history: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
  allergies: z.preprocess(emptyToNull, z.string().max(1000).nullable().optional()),
  private_notes: z.preprocess(emptyToNull, z.string().max(2000).nullable().optional()),
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
        patient_name: data.patient_name ?? null,
        phone: data.phone ?? null,
        appointment_at: data.appointment_at ?? null,
        reason: data.reason ?? null,
        diagnosis: data.diagnosis ?? null,
        treatment: data.treatment ?? null,
        medical_history: data.medical_history ?? null,
        allergies: data.allergies ?? null,
        private_notes: data.private_notes ?? null,
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
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

const updateSchema = bookSchema.extend({ id: z.string().uuid() });

export const updateAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = getClient();
    const { id, ...rest } = data;
    const { error } = await supabase
      .from("appointments")
      .update({
        patient_name: rest.patient_name ?? null,
        phone: rest.phone ?? null,
        appointment_at: rest.appointment_at ?? null,
        reason: rest.reason ?? null,
        diagnosis: rest.diagnosis ?? null,
        treatment: rest.treatment ?? null,
        medical_history: rest.medical_history ?? null,
        allergies: rest.allergies ?? null,
        private_notes: rest.private_notes ?? null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
