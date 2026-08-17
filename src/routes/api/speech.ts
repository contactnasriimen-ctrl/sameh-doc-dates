import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { text } = (await request.json()) as { text?: string };
        if (!text || !text.trim()) {
          return new Response("Texte requis", { status: 400 });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text.slice(0, 4000),
            voice: "alloy",
            response_format: "mp3",
            instructions:
              "Parle en français avec une voix douce, chaleureuse et posée, comme une secrétaire médicale bienveillante.",
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          return new Response(body || "Synthèse vocale échouée", {
            status: res.status,
          });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    },
  },
});
