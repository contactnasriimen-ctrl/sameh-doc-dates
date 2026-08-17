import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  MessageCircleHeart, RotateCcw, Mic, Square, Loader2, Volume2, VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { startRecording, type VoiceRecorder } from "@/lib/voice-recorder";

const STORAGE_KEY = "joy_chat_v1";

const SUGGESTIONS = [
  "Les rendez-vous d'aujourd'hui ?",
  "Combien de RDV cette semaine ?",
  "Résume la fiche du dernier patient",
];

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function JoyChat() {
  const [initial] = useState<UIMessage[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: "joy",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "Joy n'a pas pu répondre"),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        /* ignore */
      }
    }
  }, [messages, status]);

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    setInput("");
    void sendMessage({ text: value });
  };

  const reset = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Nouvelle discussion avec Joy");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card rounded-3xl border border-border p-4 shadow-sm flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-[var(--shadow-cute)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <MessageCircleHeart className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold leading-tight">Joy</p>
          <p className="text-xs text-muted-foreground">
            Votre secrétaire IA — elle connaît tous les rendez-vous
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            title="Nouvelle discussion"
            className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <Conversation className="h-[52vh] min-h-[320px]">
          <ConversationContent className="gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div
                  className="w-14 h-14 rounded-3xl flex items-center justify-center text-white"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <MessageCircleHeart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold">Bonjour Docteur 🌿</p>
                <p className="text-xs text-muted-foreground max-w-[16rem]">
                  Demandez-moi n'importe quoi sur vos rendez-vous et vos fiches patients.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-2 rounded-2xl bg-muted hover:bg-muted/70 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              if (!text) return null;
              return (
                <Message from={m.role} key={m.id}>
                  <MessageContent
                    className={
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl px-3.5 py-2.5 text-sm"
                        : "bg-transparent text-foreground p-0 text-sm"
                    }
                  >
                    <MessageResponse>{text}</MessageResponse>
                  </MessageContent>
                </Message>
              );
            })}

            {status === "submitted" && (
              <Shimmer className="text-sm">Joy réfléchit…</Shimmer>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="p-3 border-t border-border">
          <PromptInput
            onSubmit={(message) => {
              send(message.text ?? input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez à Joy…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() && !isLoading}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
