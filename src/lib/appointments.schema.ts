import { z } from "zod";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const optText = (max: number) =>
  z.preprocess(emptyToNull, z.string().max(max).nullable().optional());

export const bookSchema = z.object({
  patient_name: optText(100),
  phone: optText(30),
  appointment_at: z.preprocess(emptyToNull, z.string().nullable().optional()),
  reason: optText(500),
  diagnosis: optText(2000),
  treatment: optText(2000),
  medical_history: optText(2000),
  allergies: optText(1000),
  private_notes: optText(2000),
  visit_types: z.array(z.string().max(50)).max(10).optional(),
  referral_source: optText(50),
  referral_detail: optText(300),
  address: optText(300),
  atcd: optText(3000),
  illness_history: optText(3000),
  physical_exam: optText(3000),
  complementary_exam: optText(3000),
  evolution: optText(3000),
});

export const updateSchema = bookSchema.extend({ id: z.string().uuid() });
export const idSchema = z.object({ id: z.string().uuid() });

const EXTRA_KEYS = [
  "referral_source",
  "referral_detail",
  "address",
  "atcd",
  "illness_history",
  "physical_exam",
  "complementary_exam",
  "evolution",
] as const;

export function extras(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of EXTRA_KEYS) out[k] = (data[k] as string | null | undefined) ?? null;
  return out;
}
