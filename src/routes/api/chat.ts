import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

function getSupabase() {
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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages requis", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = getSupabase();
        const { data: appointments } = await supabase
          .from("appointments")
          .select("*")
          .order("appointment_at", { ascending: true })
          .limit(300);

        const now = new Date();
        const context = JSON.stringify(appointments ?? [], null, 1);

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: `Tu es Bahja, la secrétaire médicale virtuelle du cabinet du Dr. Sameh Aissa.
Tu es chaleureuse, efficace, tu réponds en français (ou en arabe tunisien / dialecte si on te parle comme ça), avec un ton amical et professionnel. Tu peux utiliser un emoji de temps en temps.

Tu connais TOUTES les informations des rendez-vous du cabinet (données ci-dessous), y compris les fiches patients confidentielles (diagnostic, traitement, antécédents, allergies, notes privées). Tu parles uniquement au Dr. Sameh, donc tu peux discuter librement de ces informations médicales.

Ce que tu sais faire :
- dire les rendez-vous du jour, de demain, de la semaine, ou d'un patient précis
- compter/résumer les rendez-vous, repérer les trous dans l'agenda ou les conflits d'horaires
- retrouver un numéro de téléphone, un motif, un diagnostic, un traitement
- résumer l'historique complet d'un patient
- rappeler quels dossiers sont incomplets (pas de nom, pas de téléphone, pas de date)

Règles :
- Réponds court et clair, avec des listes à puces quand il y a plusieurs rendez-vous.
- Utilise le format des dates JJ/MM/AAAA et l'heure sur 24h.
- Si l'information n'existe pas dans les données, dis-le simplement, n'invente jamais un rendez-vous, un numéro ou un diagnostic.
- Tu ne peux pas créer ni supprimer un rendez-vous toi-même : explique au docteur d'utiliser les onglets « Nouveau » ou « RDV ».

Date et heure actuelles : ${now.toISOString()} (${now.toLocaleString("fr-FR")}).

Rendez-vous du cabinet (JSON) :
${context}`,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
