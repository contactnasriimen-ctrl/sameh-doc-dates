import { defineTool } from "@lovable.dev/mcp-js";
import { getPublicSupabase, textResult, z } from "../shared";

export default defineTool({
  name: "delete_appointment",
  title: "Delete appointment",
  description: "Delete an appointment by its ID.",
  inputSchema: {
    id: z.string().uuid().describe("Appointment ID to delete."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = getPublicSupabase();
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return textResult(error.message, true);
    return textResult({ ok: true, id });
  },
});
