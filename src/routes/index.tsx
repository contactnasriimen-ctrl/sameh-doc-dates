import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Heart, Calendar, Clock, Phone, User, Stethoscope, Sparkles, History, Plus, Trash2 } from "lucide-react";
import { bookAppointment, listAppointments, deleteAppointment } from "@/lib/appointments.functions";
import { toast, Toaster } from "sonner";

const appointmentsQO = () =>
  queryOptions({
    queryKey: ["appointments"],
    queryFn: () => listAppointments(),
  });

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(appointmentsQO());
  },
  component: Home,
});

type Tab = "book" | "history";

function Home() {
  const [tab, setTab] = useState<Tab>("book");
  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-6">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-md flex flex-col gap-6">
        <Header />
        <Tabs tab={tab} setTab={setTab} />
        {tab === "book" ? <BookForm onBooked={() => setTab("history")} /> : <HistoryList />}
        <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
          Fait avec <Heart className="w-3 h-3 fill-primary text-primary" /> pour Dr. Sameh
        </p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="rounded-3xl p-5 text-white shadow-[var(--shadow-cute)] relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-primary)" }}>
      <div className="absolute -top-6 -right-6 opacity-20">
        <Sparkles className="w-24 h-24" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs opacity-90 font-medium">Cabinet médical</p>
          <h1 className="text-xl font-bold leading-tight">Dr. Sameh</h1>
        </div>
      </div>
      <p className="mt-3 text-sm opacity-95">
        Prenez rendez-vous en quelques secondes 🌸
      </p>
    </header>
  );
}

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const btn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
      active
        ? "bg-white text-primary shadow-[var(--shadow-cute)]"
        : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur rounded-3xl border border-border">
      <button className={btn(tab === "book")} onClick={() => setTab("book")}>
        <Plus className="w-4 h-4" /> Nouveau
      </button>
      <button className={btn(tab === "history")} onClick={() => setTab("history")}>
        <History className="w-4 h-4" /> Historique
      </button>
    </div>
  );
}

function BookForm({ onBooked }: { onBooked: () => void }) {
  const qc = useQueryClient();
  const book = useServerFn(bookAppointment);
  const [form, setForm] = useState({
    patient_name: "",
    phone: "",
    date: "",
    time: "",
    reason: "",
  });

  const mutation = useMutation({
    mutationFn: (payload: {
      patient_name: string;
      phone: string;
      appointment_at: string;
      reason?: string | null;
    }) => book({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous confirmé ! 🌷");
      setForm({ patient_name: "", phone: "", date: "", time: "", reason: "" });
      onBooked();
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.phone || !form.date || !form.time) {
      toast.error("Merci de remplir tous les champs 💕");
      return;
    }
    const iso = new Date(`${form.date}T${form.time}`).toISOString();
    mutation.mutate({
      patient_name: form.patient_name,
      phone: form.phone,
      appointment_at: iso,
      reason: form.reason || null,
    });
  };

  return (
    <form onSubmit={onSubmit} className="bg-card rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-4">
      <Field icon={<User className="w-4 h-4" />} label="Nom du patient">
        <input
          value={form.patient_name}
          onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
          placeholder="Ex. Nour Ben Ali"
          className="cute-input"
        />
      </Field>
      <Field icon={<Phone className="w-4 h-4" />} label="Téléphone">
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+216 ..."
          className="cute-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field icon={<Calendar className="w-4 h-4" />} label="Date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="cute-input"
          />
        </Field>
        <Field icon={<Clock className="w-4 h-4" />} label="Heure">
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="cute-input"
          />
        </Field>
      </div>
      <Field icon={<Sparkles className="w-4 h-4" />} label="Motif (optionnel)">
        <textarea
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Consultation, contrôle..."
          rows={3}
          className="cute-input resize-none"
        />
      </Field>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-2 py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        {mutation.isPending ? "En cours..." : "Confirmer le rendez-vous 💌"}
      </button>

      <style>{`
        .cute-input {
          width: 100%;
          background: var(--color-muted);
          border: 1.5px solid transparent;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: var(--color-foreground);
          outline: none;
          transition: all 0.15s;
        }
        .cute-input:focus {
          border-color: var(--color-primary);
          background: var(--color-card);
          box-shadow: 0 0 0 4px oklch(0.72 0.16 80 / 0.12);
        }
      `}</style>
    </form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function HistoryList() {
  const { data, isLoading } = useQuery(appointmentsQO());

  if (isLoading) {
    return <div className="bg-card rounded-3xl p-8 text-center text-muted-foreground">Chargement...</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-8 text-center border border-border">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <Calendar className="w-6 h-6 text-secondary-foreground" />
        </div>
        <p className="font-semibold">Aucun rendez-vous</p>
        <p className="text-sm text-muted-foreground mt-1">Prenez votre premier rendez-vous 🌸</p>
      </div>
    );
  }

  const now = Date.now();
  return (
    <div className="flex flex-col gap-3">
      {data.map((a) => {
        const dt = new Date(a.appointment_at);
        const past = dt.getTime() < now;
        return (
          <div
            key={a.id}
            className="bg-card rounded-2xl p-4 border border-border flex gap-3 items-start shadow-sm"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                past ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase leading-none">
                {dt.toLocaleDateString("fr-FR", { month: "short" })}
              </span>
              <span className="text-lg font-bold leading-none mt-0.5">{dt.getDate()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold truncate">{a.patient_name}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    past ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                  }`}
                >
                  {past ? "Passé" : "À venir"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dt.toLocaleString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {a.phone}
              </p>
              {a.reason && (
                <p className="text-sm mt-2 bg-muted rounded-xl px-3 py-2">{a.reason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
