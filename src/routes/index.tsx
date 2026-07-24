import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Heart, Calendar, Clock, Phone, User, Stethoscope, Sparkles,
  History, Plus, Trash2, Lock, LogOut, FileText, ChevronDown, ChevronUp, Save,
  FolderHeart, ArrowLeft, Search, Pill, AlertTriangle, ClipboardList, NotebookPen,
  Pencil, X,
} from "lucide-react";
import {
  bookAppointment, listAppointments, deleteAppointment, updateAppointment,
} from "@/lib/appointments.functions";
import { toast, Toaster } from "sonner";

// Change these PINs to your own
const PIN_DOCTOR = "1234";
const PIN_SECRETARY = "0000";
const ROLE_KEY = "cabinet_role_v1";

type Role = "doctor" | "secretary";
type Tab = "book" | "history" | "records";

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

function Home() {
  const [role, setRole] = useState<Role | null>(null);
  const [tab, setTab] = useState<Tab>("book");

  useEffect(() => {
    const saved = localStorage.getItem(ROLE_KEY) as Role | null;
    if (saved === "doctor" || saved === "secretary") setRole(saved);
  }, []);

  const login = (r: Role) => {
    localStorage.setItem(ROLE_KEY, r);
    setRole(r);
  };
  const logout = () => {
    localStorage.removeItem(ROLE_KEY);
    setRole(null);
  };

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-6">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-md flex flex-col gap-6">
        {!role ? (
          <PinGate onLogin={login} />
        ) : (
          <>
            <Header role={role} onLogout={logout} />
            <Tabs tab={tab} setTab={setTab} role={role} />
            {tab === "book" && <BookForm onBooked={() => setTab("history")} />}
            {tab === "history" && <HistoryList role={role} />}
            {tab === "records" && role === "doctor" && <PatientRecords />}
            <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              Fait avec <Heart className="w-3 h-3 fill-primary text-primary" /> pour Dr. Sameh
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function PinGate({ onLogin }: { onLogin: (r: Role) => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_DOCTOR) {
      toast.success("Bienvenue Dr. Sameh 🌷");
      onLogin("doctor");
    } else if (pin === PIN_SECRETARY) {
      toast.success("Bienvenue 🌸");
      onLogin("secretary");
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      toast.error("Code PIN incorrect");
      setPin("");
    }
  };

  return (
    <div className={`flex flex-col gap-5 mt-10 ${shake ? "animate-shake" : ""}`}>
      <div
        className="rounded-3xl p-6 text-white shadow-[var(--shadow-cute)] relative overflow-hidden"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <div className="absolute -top-6 -right-6 opacity-20">
          <Sparkles className="w-24 h-24" />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold">Cabinet Dr. Sameh</h1>
        <p className="text-sm opacity-95 mt-1">Entrez votre code PIN pour continuer</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-3xl p-5 border border-border flex flex-col gap-4 shadow-sm">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="cute-input text-center text-2xl tracking-[0.5em] font-bold"
        />
        <button
          type="submit"
          className="py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          Se connecter
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Docteur & Secrétaire ont chacun leur code
        </p>
      </form>

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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

function Header({ role, onLogout }: { role: Role; onLogout: () => void }) {
  return (
    <header
      className="rounded-3xl p-5 text-white shadow-[var(--shadow-cute)] relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-primary)" }}
    >
      <div className="absolute -top-6 -right-6 opacity-20">
        <Sparkles className="w-24 h-24" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs opacity-90 font-medium">
            {role === "doctor" ? "Docteur" : "Secrétaire"}
          </p>
          <h1 className="text-xl font-bold leading-tight">Dr. Sameh</h1>
        </div>
        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-3 text-sm opacity-95">Prenez rendez-vous en quelques secondes 🌸</p>
    </header>
  );
}

function Tabs({ tab, setTab, role }: { tab: Tab; setTab: (t: Tab) => void; role: Role }) {
  const btn = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
      active
        ? "bg-white text-primary shadow-[var(--shadow-cute)]"
        : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <div className="flex gap-1.5 p-1.5 bg-white/60 backdrop-blur rounded-3xl border border-border">
      <button className={btn(tab === "book")} onClick={() => setTab("book")}>
        <Plus className="w-4 h-4" /> Nouveau
      </button>
      <button className={btn(tab === "history")} onClick={() => setTab("history")}>
        <History className="w-4 h-4" /> RDV
      </button>
      {role === "doctor" && (
        <button className={btn(tab === "records")} onClick={() => setTab("records")}>
          <FolderHeart className="w-4 h-4" /> Fiches
        </button>
      )}
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
    mutationFn: (payload: Record<string, string | null>) => book({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous enregistré ! 🌷");
      setForm({ patient_name: "", phone: "", date: "", time: "", reason: "" });
      onBooked();
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let iso: string | null = null;
    if (form.date && form.time) {
      iso = new Date(`${form.date}T${form.time}`).toISOString();
    } else if (form.date) {
      iso = new Date(`${form.date}T09:00`).toISOString();
    }
    mutation.mutate({
      patient_name: form.patient_name || null,
      phone: form.phone || null,
      appointment_at: iso,
      reason: form.reason || null,
    });
  };

  return (
    <form onSubmit={onSubmit} className="bg-card rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-4">
      <p className="text-xs text-muted-foreground -mb-1">Tous les champs sont optionnels ✨</p>
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
      <Field icon={<Sparkles className="w-4 h-4" />} label="Motif">
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
        {mutation.isPending ? "En cours..." : "Enregistrer 💌"}
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
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
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

type Appointment = {
  id: string;
  patient_name: string | null;
  phone: string | null;
  appointment_at: string | null;
  reason: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medical_history: string | null;
  allergies: string | null;
  private_notes: string | null;
  created_at: string;
};

function HistoryList({ role }: { role: Role }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(appointmentsQO());
  const del = useServerFn(deleteAppointment);

  const delMutation = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous supprimé 🗑️");
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

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
        <p className="text-sm text-muted-foreground mt-1">Ajoutez votre premier rendez-vous 🌸</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {(data as Appointment[]).map((a) => (
        <AppointmentCard
          key={a.id}
          appt={a}
          role={role}
          onDelete={() => delMutation.mutate(a.id)}
          deleting={delMutation.isPending}
        />
      ))}
    </div>
  );
}

function AppointmentCard({
  appt, role, onDelete, deleting,
}: {
  appt: Appointment; role: Role; onDelete: () => void; deleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const dt = appt.appointment_at ? new Date(appt.appointment_at) : null;
  const past = dt ? dt.getTime() < Date.now() : false;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 flex gap-3 items-start">
        <div
          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
            dt ? (past ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground") : "bg-muted text-muted-foreground"
          }`}
        >
          {dt ? (
            <>
              <span className="text-[10px] font-semibold uppercase leading-none">
                {dt.toLocaleDateString("fr-FR", { month: "short" })}
              </span>
              <span className="text-lg font-bold leading-none mt-0.5">{dt.getDate()}</span>
            </>
          ) : (
            <Calendar className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold truncate">{appt.patient_name || "Sans nom"}</p>
            {dt && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  past ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                }`}
              >
                {past ? "Passé" : "À venir"}
              </span>
            )}
          </div>
          {dt && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dt.toLocaleString("fr-FR", {
                weekday: "short", day: "numeric", month: "short",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
          {appt.phone && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {appt.phone}
            </p>
          )}
          {appt.reason && (
            <p className="text-sm mt-2 bg-muted rounded-xl px-3 py-2">{appt.reason}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setEditing((e) => !e)}
            className={`p-2 rounded-xl transition-colors ${
              editing
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
            title="Modifier"
          >
            {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {editing && <EditAppointment appt={appt} onClose={() => setEditing(false)} />}

      {role === "doctor" && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full px-4 py-2.5 border-t border-border flex items-center justify-between text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Fiche patient (confidentielle)
            </span>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {open && <MedicalFile appt={appt} />}
        </>
      )}
    </div>
  );
}

function EditAppointment({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  const qc = useQueryClient();
  const update = useServerFn(updateAppointment);
  const initialDt = appt.appointment_at ? new Date(appt.appointment_at) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const [form, setForm] = useState({
    patient_name: appt.patient_name ?? "",
    phone: appt.phone ?? "",
    date: initialDt
      ? `${initialDt.getFullYear()}-${pad(initialDt.getMonth() + 1)}-${pad(initialDt.getDate())}`
      : "",
    time: initialDt ? `${pad(initialDt.getHours())}:${pad(initialDt.getMinutes())}` : "",
    reason: appt.reason ?? "",
  });

  const mutation = useMutation({
    mutationFn: () => {
      let iso: string | null = null;
      if (form.date && form.time) iso = new Date(`${form.date}T${form.time}`).toISOString();
      else if (form.date) iso = new Date(`${form.date}T09:00`).toISOString();
      return update({
        data: {
          id: appt.id,
          patient_name: form.patient_name || null,
          phone: form.phone || null,
          appointment_at: iso,
          reason: form.reason || null,
          diagnosis: appt.diagnosis,
          treatment: appt.treatment,
          medical_history: appt.medical_history,
          allergies: appt.allergies,
          private_notes: appt.private_notes,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous modifié ✨");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  return (
    <div className="p-4 bg-primary/5 border-t border-border flex flex-col gap-3">
      <Field icon={<User className="w-4 h-4" />} label="Nom du patient">
        <input
          value={form.patient_name}
          onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
          className="cute-input"
        />
      </Field>
      <Field icon={<Phone className="w-4 h-4" />} label="Téléphone">
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
      <Field icon={<Sparkles className="w-4 h-4" />} label="Motif">
        <textarea
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          rows={2}
          className="cute-input resize-none"
        />
      </Field>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-1 py-2.5 rounded-xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Save className="w-4 h-4" />
        {mutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
      <style>{`
        .cute-input {
          width: 100%;
          background: var(--color-card);
          border: 1.5px solid transparent;
          border-radius: 1rem;
          padding: 0.65rem 0.9rem;
          font-size: 0.9rem;
          color: var(--color-foreground);
          outline: none;
          transition: all 0.15s;
        }
        .cute-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 4px oklch(0.72 0.16 80 / 0.12);
        }
      `}</style>
    </div>
  );
}

function MedicalFile({ appt }: { appt: Appointment }) {
  const qc = useQueryClient();
  const update = useServerFn(updateAppointment);
  const [form, setForm] = useState({
    diagnosis: appt.diagnosis ?? "",
    treatment: appt.treatment ?? "",
    medical_history: appt.medical_history ?? "",
    allergies: appt.allergies ?? "",
    private_notes: appt.private_notes ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: appt.id,
          patient_name: appt.patient_name,
          phone: appt.phone,
          appointment_at: appt.appointment_at,
          reason: appt.reason,
          ...form,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Fiche enregistrée 💾");
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  const ta = (key: keyof typeof form, label: string, placeholder: string) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <textarea
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        rows={2}
        className="cute-input resize-none text-sm"
      />
    </label>
  );

  return (
    <div className="p-4 bg-primary/5 border-t border-border flex flex-col gap-3">
      {ta("diagnosis", "Diagnostic", "Diagnostic médical...")}
      {ta("treatment", "Traitement", "Médicaments prescrits, posologie...")}
      {ta("medical_history", "Antécédents", "Historique médical, chirurgies...")}
      {ta("allergies", "Allergies", "Médicaments, aliments...")}
      {ta("private_notes", "Notes privées", "Observations confidentielles...")}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-1 py-2.5 rounded-xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Save className="w-4 h-4" />
        {mutation.isPending ? "Enregistrement..." : "Enregistrer la fiche"}
      </button>
    </div>
  );
}

// ============================================================
// PATIENT RECORDS — Dedicated doctor-only interface
// Groups appointments by patient name and shows a full medical file
// ============================================================

type PatientGroup = {
  name: string;
  appointments: Appointment[];
  lastVisit: Date | null;
};

function groupByPatient(appts: Appointment[]): PatientGroup[] {
  const map = new Map<string, Appointment[]>();
  for (const a of appts) {
    const key = (a.patient_name || "Sans nom").trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries())
    .map(([name, list]) => {
      const dates = list
        .map((a) => (a.appointment_at ? new Date(a.appointment_at).getTime() : 0))
        .filter((n) => n > 0);
      const lastVisit = dates.length ? new Date(Math.max(...dates)) : null;
      return { name, appointments: list, lastVisit };
    })
    .sort((a, b) => {
      const at = a.lastVisit?.getTime() ?? 0;
      const bt = b.lastVisit?.getTime() ?? 0;
      return bt - at;
    });
}

function PatientRecords() {
  const { data, isLoading } = useQuery(appointmentsQO());
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return <div className="bg-card rounded-3xl p-8 text-center text-muted-foreground">Chargement...</div>;
  }
  const groups = groupByPatient((data ?? []) as Appointment[]);
  const filtered = search
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups;

  if (selected) {
    const group = groups.find((g) => g.name === selected);
    if (!group) {
      setSelected(null);
      return null;
    }
    return <PatientDetail group={group} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card rounded-3xl p-4 border border-border shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un patient..."
            className="cute-input pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-3xl p-8 text-center border border-border">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <FolderHeart className="w-6 h-6 text-secondary-foreground" />
          </div>
          <p className="font-semibold">Aucun patient</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Aucun résultat" : "Les fiches apparaîtront ici 🌸"}
          </p>
        </div>
      ) : (
        filtered.map((g) => (
          <button
            key={g.name}
            onClick={() => setSelected(g.name)}
            className="bg-card rounded-2xl p-4 border border-border shadow-sm text-left hover:border-primary transition-colors flex items-center gap-3"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {g.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{g.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {g.appointments.length} rendez-vous
                {g.lastVisit && ` • dernier ${g.lastVisit.toLocaleDateString("fr-FR")}`}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
          </button>
        ))
      )}
    </div>
  );
}

function PatientDetail({ group, onBack }: { group: PatientGroup; onBack: () => void }) {
  // Master medical file = most recent appointment (or first if none dated)
  const master =
    [...group.appointments].sort((a, b) => {
      const at = a.appointment_at ? new Date(a.appointment_at).getTime() : 0;
      const bt = b.appointment_at ? new Date(b.appointment_at).getTime() : 0;
      return bt - at;
    })[0] ?? group.appointments[0];

  const qc = useQueryClient();
  const update = useServerFn(updateAppointment);
  const [form, setForm] = useState({
    diagnosis: master.diagnosis ?? "",
    treatment: master.treatment ?? "",
    medical_history: master.medical_history ?? "",
    allergies: master.allergies ?? "",
    private_notes: master.private_notes ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: master.id,
          patient_name: master.patient_name,
          phone: master.phone,
          appointment_at: master.appointment_at,
          reason: master.reason,
          ...form,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Fiche patient enregistrée 💾");
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  const bigField = (
    key: keyof typeof form,
    label: string,
    icon: React.ReactNode,
    placeholder: string,
  ) => (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-primary/5 border-b border-border flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <span className="text-xs font-bold text-primary uppercase tracking-wide">{label}</span>
      </div>
      <textarea
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Patient header */}
      <div
        className="rounded-3xl p-5 text-white shadow-[var(--shadow-cute)] relative overflow-hidden"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <button
          onClick={onBack}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-2xl font-bold">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs opacity-90 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> Fiche confidentielle
            </p>
            <h2 className="text-xl font-bold leading-tight">{group.name}</h2>
            {master.phone && (
              <p className="text-xs opacity-90 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {master.phone}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/15 backdrop-blur rounded-xl py-2">
            <p className="text-lg font-bold leading-none">{group.appointments.length}</p>
            <p className="text-[10px] opacity-90 mt-1">Consultations</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl py-2">
            <p className="text-xs font-bold leading-none pt-1">
              {group.lastVisit ? group.lastVisit.toLocaleDateString("fr-FR") : "—"}
            </p>
            <p className="text-[10px] opacity-90 mt-1">Dernière visite</p>
          </div>
        </div>
      </div>

      {/* Medical file */}
      {bigField("diagnosis", "Diagnostic", <ClipboardList className="w-4 h-4" />, "Diagnostic médical actuel...")}
      {bigField("treatment", "Traitement", <Pill className="w-4 h-4" />, "Médicaments prescrits, posologie, durée...")}
      {bigField("medical_history", "Antécédents", <History className="w-4 h-4" />, "Historique médical, chirurgies passées...")}
      {bigField("allergies", "Allergies", <AlertTriangle className="w-4 h-4" />, "Médicaments, aliments, environnement...")}
      {bigField("private_notes", "Notes privées", <NotebookPen className="w-4 h-4" />, "Observations confidentielles du docteur...")}

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 sticky bottom-4"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Save className="w-4 h-4" />
        {mutation.isPending ? "Enregistrement..." : "Enregistrer la fiche patient"}
      </button>

      {/* Consultations history */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Historique des consultations</span>
        </div>
        <div className="divide-y divide-border">
          {group.appointments
            .slice()
            .sort((a, b) => {
              const at = a.appointment_at ? new Date(a.appointment_at).getTime() : 0;
              const bt = b.appointment_at ? new Date(b.appointment_at).getTime() : 0;
              return bt - at;
            })
            .map((a) => {
              const dt = a.appointment_at ? new Date(a.appointment_at) : null;
              return (
                <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {dt
                        ? dt.toLocaleString("fr-FR", {
                            weekday: "short", day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "Date non renseignée"}
                    </p>
                    {a.reason && (
                      <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                    )}
                  </div>
                  {a.id === master.id && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                      Fiche
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
