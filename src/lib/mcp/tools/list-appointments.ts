import { defineTool } from "@lovable.dev/mcp-js";
import { getPublicSupabase, textResult, z } from "../shared";

export default defineTool({
  name: "list_appointments",
  title: "List appointments",
  description: "List all appointments for Dr. Sameh, most recent first.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Maximum number of appointments to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return textResult(error.message, true);
    return textResult(data ?? []);
  },
});
