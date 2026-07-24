import { defineTool } from "@lovable.dev/mcp-js";
import { getPublicSupabase, textResult, z } from "../shared";

export default defineTool({
  name: "create_appointment",
  title: "Create appointment",
  description:
    "Book a new appointment for Dr. Sameh. All fields are optional; provide at least a patient name or phone.",
  inputSchema: {
    patient_name: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
    appointment_at: z
      .string()
      .optional()
      .describe("ISO 8601 datetime of the appointment."),
    reason: z.string().max(500).optional(),
    diagnosis: z.string().max(2000).optional(),
    treatment: z.string().max(2000).optional(),
    medical_history: z.string().max(2000).optional(),
    allergies: z.string().max(1000).optional(),
    private_notes: z.string().max(2000).optional(),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async (input) => {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_name: input.patient_name ?? null,
        phone: input.phone ?? null,
        appointment_at: input.appointment_at ?? null,
        reason: input.reason ?? null,
        diagnosis: input.diagnosis ?? null,
        treatment: input.treatment ?? null,
        medical_history: input.medical_history ?? null,
        allergies: input.allergies ?? null,
        private_notes: input.private_notes ?? null,
      })
      .select()
      .single();
    if (error) return textResult(error.message, true);
    return textResult(data);
  },
});
