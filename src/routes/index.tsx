import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Heart, Calendar, Clock, Phone, User, Stethoscope, Sparkles,
  History, Plus, Trash2, Lock, LogOut, FileText, ChevronDown, ChevronUp, Save,
  FolderHeart, ArrowLeft, Search, Pill, AlertTriangle, ClipboardList, NotebookPen,
  Pencil, X, MessageCircleHeart, BarChart3, Users, CalendarCheck, Tag, UserCheck,
  MapPin, Share2, Activity, TrendingUp, Microscope, Filter, SlidersHorizontal,
  Hash, Cake, ShieldCheck,
} from "lucide-react";
import {
  bookAppointment, listAppointments, deleteAppointment, updateAppointment,
} from "@/lib/appointments.functions";
import { toast, Toaster } from "sonner";
import { JoyChat } from "@/components/JoyChat";
import logoAsset from "@/assets/dr-sameh-logo.png.asset.json";

// Change these PINs to your own
const PIN_DOCTOR = "bruno silencio";
const PIN_SECRETARY = "1234";
const CODE2_DOCTOR = "7788";
const CODE2_SECRETARY = "5566";
const ROLE_KEY = "cabinet_role_v1";

type Role = "doctor" | "secretary";
type Tab = "book" | "history" | "stats" | "joy";

export const VISIT_TYPES = [
  { key: "classique", label: "Consultation classique", short: "Classique", emoji: "🩺" },
  { key: "controle", label: "Contrôle", short: "Contrôle", emoji: "🔁" },
  { key: "holistique", label: "Consultation holistique", short: "Holistique", emoji: "🌿" },
  { key: "seance", label: "Séance", short: "Séance", emoji: "✨" },
] as const;

const visitLabel = (k: string) =>
  VISIT_TYPES.find((v) => v.key === k)?.label ?? k;
const visitEmoji = (k: string) => VISIT_TYPES.find((v) => v.key === k)?.emoji ?? "•";

export const REFERRAL_SOURCES = [
  { key: "google", label: "Google", emoji: "🔎", detailLabel: "Recherche / mot-clé", placeholder: "Ex. médecin holistique Tunis" },
  { key: "tiktok", label: "TikTok", emoji: "🎵", detailLabel: "Compte ou vidéo TikTok", placeholder: "Ex. @dr.sameh — vidéo sur le stress" },
  { key: "contact", label: "Contact", emoji: "🤝", detailLabel: "Nom de la personne qui a adressé", placeholder: "Ex. Mme Farah Mansour" },
  { key: "facebook", label: "Facebook", emoji: "📘", detailLabel: "Page ou publication Facebook", placeholder: "Ex. page Dr. Sameh Aissa" },
  { key: "instagram", label: "Instagram", emoji: "📸", detailLabel: "Compte ou publication Instagram", placeholder: "Ex. @dr.sameh — reel bien-être" },
  { key: "medecin", label: "Médecin", emoji: "🩺", detailLabel: "Nom du médecin référent", placeholder: "Ex. Dr. Mezgheni (cardiologue)" },
  { key: "famille", label: "Famille", emoji: "👨‍👩‍👧", detailLabel: "Lien de parenté / nom", placeholder: "Ex. sa sœur, patiente depuis 2024" },
  { key: "pharmacie", label: "Pharmacie", emoji: "💊", detailLabel: "Nom de la pharmacie", placeholder: "Ex. Pharmacie Centrale, Ariana" },
  { key: "passage", label: "Passage", emoji: "🚶", detailLabel: "Précision", placeholder: "Ex. a vu la plaque du cabinet" },
  { key: "groupe_social", label: "Groupe social media", emoji: "🌐", detailLabel: "Nom du groupe (Facebook, WhatsApp...)", placeholder: "Ex. groupe Santé Naturelle Tunisie" },
  { key: "rabta", label: "Rabta groupe", emoji: "🔗", detailLabel: "Précision sur le groupe Rabta", placeholder: "Ex. Rabta — groupe bien-être" },
  { key: "autre", label: "Autre", emoji: "✨", detailLabel: "Précisez la source", placeholder: "Ex. affiche, radio, événement..." },
] as const;

export const SOCIAL_COVERAGE = ["CNAM", "Assurance privée", "Sans couverture", "Autre"] as const;

// Code patient déterministe : initiales + empreinte stable du nom
export function makePatientCode(name: string): string {
  const clean = (name ?? "").trim();
  if (!clean) return "";
  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  let h = 0;
  const norm = clean.toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < norm.length; i++) h = (h * 31 + norm.charCodeAt(i)) % 100000;
  return `P-${initials || "X"}${String(h).padStart(4, "0").slice(0, 4)}`;
}

const referralInfo = (k?: string | null) =>
  REFERRAL_SOURCES.find((r) => r.key === k);
const referralLabel = (k?: string | null) => referralInfo(k)?.label ?? "";

function ReferralPicker({
  value, detail, onChange, onDetail,
}: {
  value: string | null;
  detail: string;
  onChange: (v: string | null) => void;
  onDetail: (v: string) => void;
}) {
  const info = referralInfo(value);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {REFERRAL_SOURCES.map((r) => {
          const active = value === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => onChange(active ? null : r.key)}
              className={`px-3 py-2 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-cute)]"
                  : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {r.emoji} {r.label}
            </button>
          );
        })}
      </div>
      {info && (
        <input
          value={detail}
          onChange={(e) => onDetail(e.target.value)}
          placeholder={info.placeholder}
          aria-label={info.detailLabel}
          className="cute-input"
        />
      )}
      {info && (
        <span className="text-[11px] text-muted-foreground">{info.detailLabel}</span>
      )}
    </div>
  );
}

const CLINICAL_FIELDS = [
  { key: "address", label: "Adresse", placeholder: "Ville, rue..." },
  { key: "atcd", label: "ATCD (antécédents)", placeholder: "Antécédents médicaux, chirurgicaux, familiaux..." },
  { key: "illness_history", label: "Histoire de la maladie", placeholder: "Début, évolution des symptômes..." },
  { key: "physical_exam", label: "Examen physique", placeholder: "TA, poids, auscultation..." },
  { key: "complementary_exam", label: "Examen complémentaire", placeholder: "Bilans, imagerie, analyses..." },
  { key: "diagnosis", label: "DG (diagnostic)", placeholder: "Diagnostic retenu..." },
  { key: "treatment", label: "Traitement", placeholder: "Médicaments, posologie, durée..." },
  { key: "evolution", label: "Évolution", placeholder: "Réponse au traitement, suivi..." },
  { key: "private_notes", label: "Notes", placeholder: "Observations..." },
] as const;

function VisitTypePicker({
  value, onChange,
}: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (k: string) =>
    onChange(value.includes(k) ? value.filter((v) => v !== k) : [...value, k]);
  return (
    <div className="flex flex-wrap gap-2">
      {VISIT_TYPES.map((t) => {
        const active = value.includes(t.key);
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => toggle(t.key)}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-cute)]"
                : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.emoji} {t.short}
          </button>
        );
      })}
    </div>
  );
}

function VisitTypeBadges({ types }: { types: string[] }) {
  if (!types || types.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {types.map((t) => (
        <span
          key={t}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
        >
          {visitEmoji(t)} {visitLabel(t)}
        </span>
      ))}
    </div>
  );
}

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
    <div className="min-h-screen w-full flex justify-center px-3 sm:px-5 py-6">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl flex flex-col gap-6">

        {!role ? (
          <PinGate onLogin={login} />
        ) : (
          <>
            <Header role={role} onLogout={logout} />
            <Tabs tab={tab} setTab={setTab} role={role} />
            {tab === "book" && <BookAndRecords role={role} onBooked={() => setTab("history")} />}
            {tab === "history" && <HistoryList role={role} />}
            {tab === "stats" && <StatsDashboard />}
            {tab === "joy" && role === "doctor" && <JoyChat />}
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
  const [code2, setCode2] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState<Role | null>(null);
  const [shake, setShake] = useState(false);

  const fail = (msg: string) => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
    toast.error(msg);
  };

  const submitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_DOCTOR) {
      setPending("doctor");
      setStep(2);
    } else if (pin === PIN_SECRETARY) {
      setPending("secretary");
      setStep(2);
    } else {
      fail("Code d'accès incorrect");
      setPin("");
    }
  };

  const submitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = pending === "doctor" ? CODE2_DOCTOR : CODE2_SECRETARY;
    if (code2.trim() === expected && pending) {
      toast.success(pending === "doctor" ? "Bienvenue Dr. Sameh 🌿" : "Bienvenue 🌸");
      onLogin(pending);
    } else {
      fail("Code de vérification incorrect");
      setCode2("");
    }
  };

  const reset = () => {
    setStep(1);
    setPending(null);
    setPin("");
    setCode2("");
  };

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col gap-5 mt-10 ${shake ? "animate-shake" : ""}`}>

      <div
        className="rounded-3xl p-6 text-white shadow-[var(--shadow-cute)] relative overflow-hidden"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <div className="absolute -top-6 -right-6 opacity-20">
          <Sparkles className="w-24 h-24" />
        </div>
        <div className="w-20 h-20 rounded-3xl bg-white/90 backdrop-blur flex items-center justify-center mb-3 shadow-lg overflow-hidden">
          <img src={logoAsset.url} alt="Logo Dr. Sameh Aissa" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold">Dr. Sameh Aissa</h1>
        <p className="text-sm opacity-95 mt-1">
          {step === 1 ? "Étape 1 / 2 · Entrez votre code d'accès" : "Étape 2 / 2 · Code de vérification"}
        </p>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <span className={`h-2 w-10 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <span className={`h-2 w-10 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      {step === 1 ? (
        <form onSubmit={submitStep1} className="bg-card rounded-3xl p-5 border border-border flex flex-col gap-4 shadow-sm">
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Code d'accès"
            className="cute-input text-center text-lg tracking-widest font-bold"
          />
          <button
            type="submit"
            className="py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Continuer
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Docteur &amp; Secrétaire ont chacun leur code
          </p>
        </form>
      ) : (
        <form onSubmit={submitStep2} className="bg-card rounded-3xl p-5 border border-border flex flex-col gap-4 shadow-sm">
          <p className="text-sm text-center text-muted-foreground">
            Accès <span className="font-semibold text-foreground">{pending === "doctor" ? "Docteur" : "Secrétaire"}</span> — entrez le 2ᵉ code
          </p>
          <input
            type="password"
            autoFocus
            value={code2}
            onChange={(e) => setCode2(e.target.value)}
            placeholder="Code de vérification"
            className="cute-input text-center text-lg tracking-widest font-bold"
          />
          <button
            type="submit"
            className="py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Se connecter
          </button>
          <button type="button" onClick={reset} className="text-xs text-muted-foreground underline">
            Retour
          </button>
        </form>
      )}


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
        <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center overflow-hidden shadow-md">
          <img src={logoAsset.url} alt="Logo Dr. Sameh Aissa" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-xs opacity-90 font-medium">
            {role === "doctor" ? "Docteur" : "Secrétaire"}
          </p>
          <h1 className="text-xl font-bold leading-tight">Dr. Sameh Aissa</h1>
        </div>
        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-3 text-sm opacity-95">Prenez rendez-vous en quelques secondes 🌿</p>
    </header>
  );
}

function Tabs({ tab, setTab, role }: { tab: Tab; setTab: (t: Tab) => void; role: Role }) {
  const btn = (active: boolean) =>
    `flex-1 min-w-[64px] flex items-center justify-center gap-1 py-3 rounded-2xl text-[11px] font-semibold transition-all whitespace-nowrap ${
      active
        ? "bg-white text-primary shadow-[var(--shadow-cute)]"
        : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <div className="flex gap-1.5 p-1.5 bg-white/60 backdrop-blur rounded-3xl border border-border overflow-x-auto">
      <button className={btn(tab === "book")} onClick={() => setTab("book")}>
        <FolderHeart className="w-4 h-4" /> Fiches & Nouveau
      </button>
      <button className={btn(tab === "history")} onClick={() => setTab("history")}>
        <History className="w-4 h-4" /> RDV
      </button>
      <button className={btn(tab === "stats")} onClick={() => setTab("stats")}>
        <BarChart3 className="w-4 h-4" /> Stats
      </button>
      {role === "doctor" && (
        <button className={btn(tab === "joy")} onClick={() => setTab("joy")}>
          <MessageCircleHeart className="w-4 h-4" /> Joy
        </button>
      )}
    </div>
  );
}

function CoveragePicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOCIAL_COVERAGE.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(active ? null : c)}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold border transition-all active:scale-95 ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-cute)]"
                : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

const norm = (v: string) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Recherche intelligente : accents ignorés, initiales, index alphabétique
function smartMatch(name: string, code: string, q: string) {
  const n = norm(name);
  const query = norm(q);
  if (!query) return true;
  if (n.includes(query) || norm(code).includes(query)) return true;
  const initials = n.split(/\s+/).map((w) => w[0] ?? "").join("");
  if (initials.startsWith(query)) return true;
  // toutes les lettres de la requête dans l'ordre (fuzzy)
  let i = 0;
  for (const ch of n) if (ch === query[i]) i++;
  return i === query.length;
}

function PatientPicker({
  patients, active, onPick,
}: { patients: Appointment[]; active: string | null; onPick: (a: Appointment) => void }) {
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const sorted = [...patients].sort((a, b) =>
    (a.patient_name ?? "").localeCompare(b.patient_name ?? "", "fr"),
  );
  const letters = [...new Set(sorted.map((a) => norm(a.patient_name ?? "")[0]?.toUpperCase() ?? "#"))];
  const results = sorted.filter((a) => {
    const name = a.patient_name ?? "";
    if (letter && norm(name)[0]?.toUpperCase() !== letter) return false;
    return smartMatch(name, a.patient_code ?? "", q);
  });
  const show = q.trim() !== "" || letter !== null;

  return (
    <div className="bg-secondary/40 rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
        <UserCheck className="w-3.5 h-3.5" /> Patient déjà venu ? Cherchez son nom ou son code
      </p>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, initiales ou code patient..."
          className="cute-input pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {letters.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLetter(letter === l ? null : l)}
            className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
              letter === l ? "bg-primary text-primary-foreground" : "bg-white text-foreground/70 hover:text-primary"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      {show && (
        <div className="mt-2 flex flex-col gap-1 max-h-56 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Aucun patient trouvé.</p>
          ) : (
            results.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onPick(a); setQ(""); setLetter(null); }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                  active === a.patient_name ? "bg-primary text-primary-foreground" : "bg-white hover:text-primary"
                }`}
              >
                <span className="truncate">{a.patient_name}</span>
                <span className="font-mono text-[10px] opacity-70">
                  {a.patient_code || makePatientCode(a.patient_name ?? "")}
                </span>
              </button>
            ))
          )}
        </div>
      )}
      {active && (
        <p className="text-[11px] text-primary font-semibold mt-2">
          Fiche récupérée : ajoutez juste la date et l'heure 🌿
        </p>
      )}
    </div>
  );
}

function BookAndRecords({ role, onBooked }: { role: Role; onBooked: () => void }) {
  const [view, setView] = useState<"new" | "records">("new");
  const seg = (active: boolean) =>
    `flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
      active ? "bg-white text-primary shadow-[var(--shadow-cute)]" : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 p-1.5 bg-white/60 backdrop-blur rounded-3xl border border-border">
        <button className={seg(view === "new")} onClick={() => setView("new")}>
          <Plus className="w-4 h-4" /> Nouveau RDV
        </button>
        <button className={seg(view === "records")} onClick={() => setView("records")}>
          <FolderHeart className="w-4 h-4" /> Fiches patients
        </button>
      </div>
      {view === "new" ? <BookForm onBooked={onBooked} /> : <PatientRecords role={role} />}
    </div>
  );
}

function BookForm({ onBooked }: { onBooked: () => void }) {
  const qc = useQueryClient();
  const book = useServerFn(bookAppointment);
  const { data: existing } = useQuery(appointmentsQO());
  const [form, setForm] = useState({
    patient_name: "",
    phone: "",
    phone2: "",
    age: "",
    origin: "",
    date: "",
    time: "",
  });
  const [coverage, setCoverage] = useState<string | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [known, setKnown] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [source, setSource] = useState<string | null>(null);
  const [sourceDetail, setSourceDetail] = useState("");
  const [clinical, setClinical] = useState<Record<string, string>>({});
  const [openClinical, setOpenClinical] = useState(false);

  // Patients déjà venus : un clic remplit la fiche automatiquement
  const returning = (() => {
    const map = new Map<string, Appointment>();
    const list = ((existing ?? []) as Appointment[])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    for (const a of list) {
      const n = (a.patient_name ?? "").trim();
      if (!n) continue;
      if (!map.has(n.toLowerCase())) map.set(n.toLowerCase(), a);
    }
    return [...map.values()].slice(0, 12);
  })();

  const prefill = (a: Appointment) => {
    setForm((f) => ({
      ...f,
      patient_name: a.patient_name ?? "",
      phone: a.phone ?? "",
      phone2: a.phone2 ?? "",
      age: a.age ?? "",
      origin: a.origin ?? "",
    }));
    setCoverage(a.social_coverage ?? null);
    setCode(a.patient_code || makePatientCode(a.patient_name ?? ""));
    setTypes(a.visit_types ?? []);
    setSource(a.referral_source ?? null);
    setSourceDetail(a.referral_detail ?? "");
    setClinical({
      address: a.address ?? "",
      atcd: a.atcd ?? "",
      illness_history: a.illness_history ?? "",
      physical_exam: a.physical_exam ?? "",
      complementary_exam: a.complementary_exam ?? "",
      diagnosis: a.diagnosis ?? "",
      treatment: a.treatment ?? "",
      evolution: a.evolution ?? "",
      private_notes: a.private_notes ?? "",
    });
    setKnown(a.patient_name ?? null);
    toast.success("Patient déjà connu — infos remplies ✨");
  };

  const mutation = useMutation({
    mutationFn: (payload: Record<string, string | null>) => book({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Rendez-vous enregistré ! 🌷");
      setForm({ patient_name: "", phone: "", phone2: "", age: "", origin: "", date: "", time: "" });
      setCoverage(null);
      setCode("");
      setTypes([]);
      setSource(null);
      setSourceDetail("");
      setClinical({});
      setKnown(null);
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
      phone2: form.phone2 || null,
      age: form.age || null,
      origin: form.origin || null,
      social_coverage: coverage,
      patient_code: code || makePatientCode(form.patient_name) || null,
      appointment_at: iso,
      visit_types: types,
      referral_source: source,
      referral_detail: source ? sourceDetail || null : null,
      ...Object.fromEntries(
        CLINICAL_FIELDS.map((f) => [f.key, clinical[f.key]?.trim() ? clinical[f.key] : null]),
      ),
    } as never);
  };

  return (
    <form onSubmit={onSubmit} className="bg-card rounded-3xl p-5 shadow-sm border border-border flex flex-col gap-4">
      <p className="text-xs text-muted-foreground -mb-1">Tous les champs sont optionnels ✨</p>

      {returning.length > 0 && (
        <PatientPicker
          patients={returning}
          active={known}
          onPick={prefill}
        />
      )}
      <div className="grid md:grid-cols-2 gap-3">
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
        <Field icon={<Phone className="w-4 h-4" />} label="Deuxième numéro">
          <input
            value={form.phone2}
            onChange={(e) => setForm({ ...form, phone2: e.target.value })}
            placeholder="+216 ..."
            className="cute-input"
          />
        </Field>
        <Field icon={<Hash className="w-4 h-4" />} label="Code patient">
          <input
            value={code || makePatientCode(form.patient_name)}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Généré automatiquement"
            className="cute-input font-mono tracking-wide"
          />
        </Field>
        <Field icon={<Cake className="w-4 h-4" />} label="Âge">
          <input
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            placeholder="Ex. 34 ans"
            className="cute-input"
          />
        </Field>
        <Field icon={<MapPin className="w-4 h-4" />} label="Origine">
          <input
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            placeholder="Ex. Ariana, Tunis"
            className="cute-input"
          />
        </Field>
        <Field icon={<ShieldCheck className="w-4 h-4" />} label="Couverture sociale">
          <CoveragePicker value={coverage} onChange={setCoverage} />
        </Field>
      </div>

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
      <Field icon={<Tag className="w-4 h-4" />} label="Type de visite (plusieurs choix possibles)">
        <VisitTypePicker value={types} onChange={setTypes} />
      </Field>
      <Field icon={<Share2 className="w-4 h-4" />} label="Adressée par">
        <ReferralPicker
          value={source}
          detail={sourceDetail}
          onChange={setSource}
          onDetail={setSourceDetail}
        />
      </Field>
      <div className="rounded-2xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenClinical((o) => !o)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-primary bg-primary/5"
        >
          <span className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Dossier clinique (optionnel)
          </span>
          {openClinical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openClinical && (
          <div className="p-4 grid gap-3 md:grid-cols-2">
            {CLINICAL_FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {f.label}
                </span>
                <textarea
                  value={clinical[f.key] ?? ""}
                  onChange={(e) => setClinical({ ...clinical, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={2}
                  className="cute-input resize-none text-sm"
                />
              </label>
            ))}
          </div>
        )}
      </div>
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
  visit_types: string[] | null;
  referral_source: string | null;
  referral_detail: string | null;
  address: string | null;
  atcd: string | null;
  illness_history: string | null;
  physical_exam: string | null;
  complementary_exam: string | null;
  evolution: string | null;
  age: string | null;
  origin: string | null;
  social_coverage: string | null;
  phone2: string | null;
  patient_code: string | null;
  created_at: string;
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function MonthCalendar({
  appts, selected, onSelect,
}: {
  appts: Appointment[];
  selected: string | null;
  onSelect: (k: string | null) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const counts = new Map<string, number>();
  for (const a of appts) {
    if (!a.appointment_at) continue;
    const k = dayKey(new Date(a.appointment_at));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  const todayKey = dayKey(new Date());

  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-3 max-w-sm mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold capitalize">
          {cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-muted-foreground text-center py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const k = dayKey(d);
          const n = counts.get(k) ?? 0;
          const isSel = selected === k;
          return (
            <button
              key={k}
              onClick={() => onSelect(isSel ? null : k)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] transition-colors ${
                isSel
                  ? "bg-primary text-primary-foreground font-bold"
                  : n > 0
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "hover:bg-muted text-foreground/70"
              } ${k === todayKey && !isSel ? "ring-2 ring-primary/50" : ""}`}
            >
              {d.getDate()}
              <span
                className={`w-1 h-1 rounded-full mt-0.5 ${
                  n > 0 ? (isSel ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {selected && (
        <button
          onClick={() => onSelect(null)}
          className="mt-3 w-full text-xs font-semibold text-primary py-2 rounded-xl hover:bg-primary/5"
        >
          Voir tous les rendez-vous
        </button>
      )}
    </div>
  );
}

function HistoryList({ role }: { role: Role }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(appointmentsQO());
  const del = useServerFn(deleteAppointment);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fSource, setFSource] = useState<string | null>(null);
  const [fType, setFType] = useState<string | null>(null);
  const [fWhen, setFWhen] = useState<"all" | "upcoming" | "past">("all");
  const [showFilters, setShowFilters] = useState(false);

  const askDelete = (a: Appointment) => {
    const label = a.patient_name || "ce rendez-vous";
    if (window.confirm(`Supprimer définitivement le rendez-vous de ${label} ?\nCette action est irréversible.`)) {
      delMutation.mutate(a.id);
    }
  };

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

  const all = data as Appointment[];
  const sorted = [...all].sort((a, b) => {
    const ta = a.appointment_at ? new Date(a.appointment_at).getTime() : Infinity;
    const tb = b.appointment_at ? new Date(b.appointment_at).getTime() : Infinity;
    return ta - tb;
  });
  const q = search.trim().toLowerCase();
  const list = sorted.filter((a) => {
    if (selected && !(a.appointment_at && dayKey(new Date(a.appointment_at)) === selected)) return false;
    if (fSource && a.referral_source !== fSource) return false;
    if (fType && !(a.visit_types ?? []).includes(fType)) return false;
    if (fWhen !== "all") {
      if (!a.appointment_at) return false;
      const t = new Date(a.appointment_at).getTime();
      if (fWhen === "upcoming" && t < Date.now()) return false;
      if (fWhen === "past" && t >= Date.now()) return false;
    }
    if (!q) return true;
    const haystack = [
      a.patient_name, a.phone, a.phone2, a.patient_code, a.age, a.origin,
      a.social_coverage, a.address, a.atcd, a.illness_history,
      a.physical_exam, a.complementary_exam, a.diagnosis, a.treatment,
      a.evolution, a.private_notes, a.referral_detail,
      referralLabel(a.referral_source),
      ...(a.visit_types ?? []).map((k) => visitLabel(k)),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
  const activeFilters = (fSource ? 1 : 0) + (fType ? 1 : 0) + (fWhen !== "all" ? 1 : 0);
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card rounded-3xl p-4 border border-border shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, code, tél, diagnostic...)"
            className="cute-input pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="mt-3 w-full flex items-center justify-between text-xs font-semibold text-primary"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
            {activeFilters > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                {activeFilters}
              </span>
            )}
          </span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showFilters && (
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Période</p>
              <div className="flex flex-wrap gap-1.5">
                {([["all", "Tous"], ["upcoming", "À venir"], ["past", "Passés"]] as const).map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setFWhen(k)} className={chip(fWhen === k)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Type de visite</p>
              <div className="flex flex-wrap gap-1.5">
                {VISIT_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFType(fType === t.key ? null : t.key)}
                    className={chip(fType === t.key)}
                  >
                    {t.emoji} {t.short}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Adressée par</p>
              <div className="flex flex-wrap gap-1.5">
                {REFERRAL_SOURCES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setFSource(fSource === r.key ? null : r.key)}
                    className={chip(fSource === r.key)}
                  >
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>
            </div>
            {(activeFilters > 0 || selected) && (
              <button
                type="button"
                onClick={() => { setFSource(null); setFType(null); setFWhen("all"); setSelected(null); }}
                className="text-[11px] font-semibold text-muted-foreground underline self-start"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
      <MonthCalendar appts={all} selected={selected} onSelect={setSelected} />
      {selected && (
        <p className="text-xs font-semibold text-muted-foreground px-1">
          {list.length} rendez-vous le{" "}
          {new Date(`${selected}T00:00:00`).toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
      )}
      {list.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
          {q ? "Aucun résultat pour cette recherche." : "Aucun rendez-vous ce jour-là."}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 items-start">
          {list.map((a) => (
            <AppointmentCard
              key={a.id}
              appt={a}
              role={role}
              onDelete={() => askDelete(a)}
              deleting={delMutation.isPending}
            />
          ))}
        </div>
      )}

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
            <a
              href={`tel:${appt.phone.replace(/\s+/g, "")}`}
              className="text-xs mt-1 inline-flex items-center gap-1.5 bg-primary/10 text-primary font-semibold rounded-full px-2.5 py-1 active:scale-95 transition-transform"
            >
              <Phone className="w-3 h-3" /> {appt.phone}
            </a>
          )}

          {appt.phone2 && (
            <a
              href={`tel:${appt.phone2.replace(/\s+/g, "")}`}
              className="text-xs mt-1 ml-1.5 inline-flex items-center gap-1.5 bg-muted text-muted-foreground font-semibold rounded-full px-2.5 py-1 active:scale-95 transition-transform"
            >
              <Phone className="w-3 h-3" /> {appt.phone2}
            </a>
          )}

          <VisitTypeBadges types={appt.visit_types ?? []} />

          {appt.referral_source && (
            <p className="text-[10px] font-semibold mt-2 inline-flex items-center gap-1 bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              <Share2 className="w-3 h-3" /> {referralInfo(appt.referral_source)?.emoji}{" "}
              {referralLabel(appt.referral_source)}
              {appt.referral_detail ? ` — ${appt.referral_detail}` : ""}
            </p>
          )}

          {(appt.patient_code || appt.age || appt.origin || appt.social_coverage) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {appt.patient_code && (
                <span className="text-[10px] font-mono font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {appt.patient_code}
                </span>
              )}
              {appt.age && (
                <span className="text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  {appt.age}
                </span>
              )}
              {appt.origin && (
                <span className="text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  📍 {appt.origin}
                </span>
              )}
              {appt.social_coverage && (
                <span className="text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  🛡️ {appt.social_coverage}
                </span>
              )}
            </div>
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
    phone2: appt.phone2 ?? "",
    age: appt.age ?? "",
    origin: appt.origin ?? "",
    patient_code: appt.patient_code ?? "",
  });
  const [coverage, setCoverage] = useState<string | null>(appt.social_coverage ?? null);
  const [types, setTypes] = useState<string[]>(appt.visit_types ?? []);
  const [source, setSource] = useState<string | null>(appt.referral_source ?? null);
  const [sourceDetail, setSourceDetail] = useState(appt.referral_detail ?? "");

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
          phone2: form.phone2 || null,
          age: form.age || null,
          origin: form.origin || null,
          social_coverage: coverage,
          patient_code: form.patient_code || makePatientCode(form.patient_name) || null,
          diagnosis: appt.diagnosis,
          treatment: appt.treatment,
          medical_history: appt.medical_history,
          allergies: appt.allergies,
          private_notes: appt.private_notes,
          visit_types: types,
          referral_source: source,
          referral_detail: source ? sourceDetail || null : null,
          address: appt.address,
          atcd: appt.atcd,
          illness_history: appt.illness_history,
          physical_exam: appt.physical_exam,
          complementary_exam: appt.complementary_exam,
          evolution: appt.evolution,
        } as never,
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
      <div className="grid grid-cols-2 gap-3">
        <Field icon={<Phone className="w-4 h-4" />} label="Téléphone">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="cute-input"
          />
        </Field>
        <Field icon={<Phone className="w-4 h-4" />} label="Deuxième numéro">
          <input
            value={form.phone2}
            onChange={(e) => setForm({ ...form, phone2: e.target.value })}
            className="cute-input"
          />
        </Field>
        <Field icon={<Hash className="w-4 h-4" />} label="Code patient">
          <input
            value={form.patient_code || makePatientCode(form.patient_name)}
            onChange={(e) => setForm({ ...form, patient_code: e.target.value })}
            className="cute-input font-mono"
          />
        </Field>
        <Field icon={<Cake className="w-4 h-4" />} label="Âge">
          <input
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="cute-input"
          />
        </Field>
        <Field icon={<MapPin className="w-4 h-4" />} label="Origine">
          <input
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            className="cute-input"
          />
        </Field>
      </div>
      <Field icon={<ShieldCheck className="w-4 h-4" />} label="Couverture sociale">
        <CoveragePicker value={coverage} onChange={setCoverage} />
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
      <Field icon={<Tag className="w-4 h-4" />} label="Type de visite">
        <VisitTypePicker value={types} onChange={setTypes} />
      </Field>
      <Field icon={<Share2 className="w-4 h-4" />} label="Adressée par">
        <ReferralPicker
          value={source}
          detail={sourceDetail}
          onChange={setSource}
          onDetail={setSourceDetail}
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
  const [form, setForm] = useState<Record<string, string>>({
    address: appt.address ?? "",
    atcd: appt.atcd ?? "",
    illness_history: appt.illness_history ?? "",
    physical_exam: appt.physical_exam ?? "",
    complementary_exam: appt.complementary_exam ?? "",
    diagnosis: appt.diagnosis ?? "",
    treatment: appt.treatment ?? "",
    evolution: appt.evolution ?? "",
    private_notes: appt.private_notes ?? "",
    medical_history: appt.medical_history ?? "",
    allergies: appt.allergies ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: appt.id,
          patient_name: appt.patient_name,
          phone: appt.phone,
          appointment_at: appt.appointment_at,
          phone2: appt.phone2,
          age: appt.age,
          origin: appt.origin,
          social_coverage: appt.social_coverage,
          patient_code: appt.patient_code,
          visit_types: appt.visit_types ?? [],
          referral_source: appt.referral_source,
          referral_detail: appt.referral_detail,
          ...Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v.trim() ? v : null]),
          ),
        } as never,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Fiche enregistrée 💾");
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  const ta = (key: string, label: string, placeholder: string) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <textarea
        value={form[key] ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        rows={2}
        className="cute-input resize-none text-sm"
      />
    </label>
  );

  return (
    <div className="p-4 bg-primary/5 border-t border-border flex flex-col gap-3">
      {CLINICAL_FIELDS.map((f) => (
        <div key={f.key}>{ta(f.key, f.label, f.placeholder)}</div>
      ))}
      {ta("allergies", "Allergies", "Médicaments, aliments...")}
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
  code: string;
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
      const code =
        list.find((a) => a.patient_code)?.patient_code ?? makePatientCode(name);
      return { name, code, appointments: list, lastVisit };
    })
    .sort((a, b) => {
      const at = a.lastVisit?.getTime() ?? 0;
      const bt = b.lastVisit?.getTime() ?? 0;
      return bt - at;
    });
}

function PatientRecords({ role }: { role: Role }) {
  const { data, isLoading } = useQuery(appointmentsQO());
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  if (isLoading) {
    return <div className="bg-card rounded-3xl p-8 text-center text-muted-foreground">Chargement...</div>;
  }
  const groups = groupByPatient((data ?? []) as Appointment[]);
  const letters = [...new Set(groups.map((g) => norm(g.name)[0]?.toUpperCase() ?? "#"))].sort();
  const filtered = groups
    .filter((g) => (letter ? norm(g.name)[0]?.toUpperCase() === letter : true))
    .filter((g) => smartMatch(g.name, g.code, search))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

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
            placeholder="Rechercher un patient (nom, initiales, code)..."
            className="cute-input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {letters.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLetter(letter === l ? null : l)}
              className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
                letter === l ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:text-primary"
              }`}
            >
              {l}
            </button>
          ))}
          {letter && (
            <button
              type="button"
              onClick={() => setLetter(null)}
              className="px-2 h-7 rounded-lg text-[11px] font-bold text-muted-foreground underline"
            >
              Tout
            </button>
          )}
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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
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
                <p className="text-[10px] font-mono font-semibold text-primary">{g.code}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {g.appointments.length} rendez-vous
                  {g.lastVisit && ` • dernier ${g.lastVisit.toLocaleDateString("fr-FR")}`}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
            </button>
          ))}
        </div>
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
  const pad = (n: number) => String(n).padStart(2, "0");
  const initialDt = master.appointment_at ? new Date(master.appointment_at) : null;

  const [form, setForm] = useState({
    patient_name: master.patient_name ?? "",
    phone: master.phone ?? "",
    date: initialDt
      ? `${initialDt.getFullYear()}-${pad(initialDt.getMonth() + 1)}-${pad(initialDt.getDate())}`
      : "",
    time: initialDt ? `${pad(initialDt.getHours())}:${pad(initialDt.getMinutes())}` : "",
    phone2: master.phone2 ?? "",
    age: master.age ?? "",
    origin: master.origin ?? "",
    patient_code: master.patient_code || group.code,
  });
  const [coverage, setCoverage] = useState<string | null>(master.social_coverage ?? null);
  const [types, setTypes] = useState<string[]>(master.visit_types ?? []);
  const [source, setSource] = useState<string | null>(master.referral_source ?? null);
  const [sourceDetail, setSourceDetail] = useState(master.referral_detail ?? "");
  const [clinical, setClinical] = useState<Record<string, string>>({
    address: master.address ?? "",
    atcd: master.atcd ?? "",
    illness_history: master.illness_history ?? "",
    physical_exam: master.physical_exam ?? "",
    complementary_exam: master.complementary_exam ?? "",
    diagnosis: master.diagnosis ?? "",
    treatment: master.treatment ?? "",
    evolution: master.evolution ?? "",
    private_notes: master.private_notes ?? "",
  });
  const [allergies, setAllergies] = useState(master.allergies ?? "");
  const [history, setHistory] = useState(master.medical_history ?? "");

  const mutation = useMutation({
    mutationFn: () => {
      let iso: string | null = null;
      if (form.date && form.time) iso = new Date(`${form.date}T${form.time}`).toISOString();
      else if (form.date) iso = new Date(`${form.date}T09:00`).toISOString();
      return update({
        data: {
          id: master.id,
          patient_name: form.patient_name || null,
          phone: form.phone || null,
          appointment_at: iso,
          phone2: form.phone2 || null,
          age: form.age || null,
          origin: form.origin || null,
          social_coverage: coverage,
          patient_code: form.patient_code || makePatientCode(form.patient_name) || null,
          visit_types: types,
          referral_source: source,
          referral_detail: source ? sourceDetail || null : null,
          allergies: allergies.trim() ? allergies : null,
          medical_history: history.trim() ? history : null,
          ...Object.fromEntries(
            CLINICAL_FIELDS.map((f) => [f.key, clinical[f.key]?.trim() ? clinical[f.key] : null]),
          ),
        } as never,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Fiche patient enregistrée 💾");
    },
    onError: (e: Error) => toast.error(e.message || "Erreur"),
  });

  const upcoming = group.appointments.filter(
    (a) => a.appointment_at && new Date(a.appointment_at).getTime() >= Date.now(),
  ).length;

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
            <p className="text-[11px] font-mono opacity-90">{group.code}</p>
            {master.phone && (
              <a
                href={`tel:${master.phone.replace(/\s/g, "")}`}
                className="text-xs opacity-90 mt-0.5 flex items-center gap-1 underline"
              >
                <Phone className="w-3 h-3" /> {master.phone}
              </a>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/15 backdrop-blur rounded-xl py-2">
            <p className="text-lg font-bold leading-none">{group.appointments.length}</p>
            <p className="text-[10px] opacity-90 mt-1">Consultations</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl py-2">
            <p className="text-lg font-bold leading-none">{upcoming}</p>
            <p className="text-[10px] opacity-90 mt-1">À venir</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl py-2">
            <p className="text-xs font-bold leading-none pt-1">
              {group.lastVisit ? group.lastVisit.toLocaleDateString("fr-FR") : "—"}
            </p>
            <p className="text-[10px] opacity-90 mt-1">Dernière visite</p>
          </div>
        </div>
      </div>

      {/* Fiche = mêmes champs que « Nouveau » */}
      <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col gap-4">
        <p className="text-xs text-muted-foreground -mb-1">
          Mêmes champs que le formulaire « Nouveau » — tout est optionnel ✨
        </p>
        <div className="grid md:grid-cols-2 gap-3">
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
          <Field icon={<Phone className="w-4 h-4" />} label="Deuxième numéro">
            <input
              value={form.phone2}
              onChange={(e) => setForm({ ...form, phone2: e.target.value })}
              className="cute-input"
            />
          </Field>
          <Field icon={<Hash className="w-4 h-4" />} label="Code patient">
            <input
              value={form.patient_code}
              onChange={(e) => setForm({ ...form, patient_code: e.target.value })}
              className="cute-input font-mono"
            />
          </Field>
          <Field icon={<Cake className="w-4 h-4" />} label="Âge">
            <input
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="cute-input"
            />
          </Field>
          <Field icon={<MapPin className="w-4 h-4" />} label="Origine">
            <input
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className="cute-input"
            />
          </Field>
          <Field icon={<ShieldCheck className="w-4 h-4" />} label="Couverture sociale">
            <CoveragePicker value={coverage} onChange={setCoverage} />
          </Field>
        </div>
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
        <Field icon={<Tag className="w-4 h-4" />} label="Type de visite (plusieurs choix possibles)">
          <VisitTypePicker value={types} onChange={setTypes} />
        </Field>
        <Field icon={<Share2 className="w-4 h-4" />} label="Adressée par">
          <ReferralPicker
            value={source}
            detail={sourceDetail}
            onChange={setSource}
            onDetail={setSourceDetail}
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          {CLINICAL_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {f.label}
              </span>
              <textarea
                value={clinical[f.key] ?? ""}
                onChange={(e) => setClinical({ ...clinical, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                rows={2}
                className="cute-input resize-none text-sm"
              />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Allergies
            </span>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Médicaments, aliments, environnement..."
              rows={2}
              className="cute-input resize-none text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <History className="w-3 h-3" /> Antécédents
            </span>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Historique médical, chirurgies passées..."
              rows={2}
              className="cute-input resize-none text-sm"
            />
          </label>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-cute)] transition-transform active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Save className="w-4 h-4" />
          {mutation.isPending ? "Enregistrement..." : "Enregistrer la fiche patient"}
        </button>
      </div>

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

                    <VisitTypeBadges types={a.visit_types ?? []} />
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


// ============================================================
// STATS DASHBOARD
// ============================================================

function StatsDashboard() {
  const { data, isLoading } = useQuery(appointmentsQO());
  if (isLoading) {
    return <div className="bg-card rounded-3xl p-8 text-center text-muted-foreground">Chargement...</div>;
  }
  const all = (data ?? []) as Appointment[];
  if (all.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-8 text-center border border-border">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6 text-secondary-foreground" />
        </div>
        <p className="font-semibold">Pas encore de statistiques</p>
        <p className="text-sm text-muted-foreground mt-1">Ajoutez des rendez-vous pour voir le tableau de bord 📊</p>
      </div>
    );
  }

  const now = new Date();
  const todayK = dayKey(now);
  const startWeek = new Date(now);
  startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startWeek.setHours(0, 0, 0, 0);

  const withDate = all.filter((a) => a.appointment_at);
  const upcoming = withDate.filter((a) => new Date(a.appointment_at!).getTime() >= now.getTime());
  const past = withDate.filter((a) => new Date(a.appointment_at!).getTime() < now.getTime());
  const today = withDate.filter((a) => dayKey(new Date(a.appointment_at!)) === todayK);
  const thisWeek = withDate.filter((a) => new Date(a.appointment_at!).getTime() >= startWeek.getTime());
  const thisMonth = withDate.filter((a) => {
    const d = new Date(a.appointment_at!);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // patients
  const byPatient = new Map<string, number>();
  for (const a of all) {
    const n = (a.patient_name ?? "").trim();
    if (!n) continue;
    byPatient.set(n, (byPatient.get(n) ?? 0) + 1);
  }
  const patients = [...byPatient.entries()].sort((a, b) => b[1] - a[1]);
  const recurring = patients.filter(([, c]) => c > 1).length;

  // types
  const typeCounts = VISIT_TYPES.map((t) => ({
    ...t,
    count: all.filter((a) => (a.visit_types ?? []).includes(t.key)).length,
  }));
  const maxType = Math.max(1, ...typeCounts.map((t) => t.count));
  const noType = all.filter((a) => (a.visit_types ?? []).length === 0).length;
  const multi = all.filter((a) => (a.visit_types ?? []).length > 1).length;

  // jours de la semaine
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekday = dayNames.map((label, i) => ({
    label,
    count: withDate.filter((a) => (new Date(a.appointment_at!).getDay() + 6) % 7 === i).length,
  }));
  const maxDay = Math.max(1, ...weekday.map((d) => d.count));

  const incomplete = all.filter((a) => !a.patient_name || !a.phone || !a.appointment_at).length;

  // 12 derniers mois
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const count = withDate.filter((a) => {
      const x = new Date(a.appointment_at!);
      return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
    }).length;
    return { label: d.toLocaleDateString("fr-FR", { month: "short" }), count };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  // sources d'acquisition
  const sources = REFERRAL_SOURCES.map((r) => ({
    ...r,
    count: all.filter((a) => a.referral_source === r.key).length,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const noSource = all.filter((a) => !a.referral_source).length;
  const maxSource = Math.max(1, ...sources.map((s) => s.count));

  // heures de pointe
  const hours = Array.from({ length: 24 }, (_, h) => ({
    h,
    count: withDate.filter((a) => new Date(a.appointment_at!).getHours() === h).length,
  })).filter((x) => x.count > 0);
  const peak = hours.slice().sort((a, b) => b.count - a.count)[0];

  // taux de retour + moyenne hebdo
  const returnRate = patients.length ? Math.round((recurring / patients.length) * 100) : 0;
  const avgVisits = patients.length
    ? Math.round((all.length / patients.length) * 10) / 10
    : 0;
  const spanWeeks = (() => {
    const times = withDate.map((a) => new Date(a.appointment_at!).getTime());
    if (times.length < 2) return 1;
    const weeks = (Math.max(...times) - Math.min(...times)) / (7 * 864e5);
    return Math.max(1, Math.round(weeks));
  })();
  const perWeek = Math.round((withDate.length / spanWeeks) * 10) / 10;
  const withFile = all.filter(
    (a) => a.diagnosis || a.treatment || a.atcd || a.illness_history || a.physical_exam,
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<CalendarCheck className="w-4 h-4" />} label="Total RDV" value={all.length} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="À venir" value={upcoming.length} />
        <StatCard icon={<History className="w-4 h-4" />} label="Passés" value={past.length} />
        <StatCard icon={<Calendar className="w-4 h-4" />} label="Aujourd'hui" value={today.length} />
        <StatCard icon={<Calendar className="w-4 h-4" />} label="Cette semaine" value={thisWeek.length} />
        <StatCard icon={<Calendar className="w-4 h-4" />} label="Ce mois" value={thisMonth.length} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Patients" value={patients.length} />
        <StatCard icon={<UserCheck className="w-4 h-4" />} label="Récurrents" value={recurring} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Taux de retour %" value={returnRate} />
        <StatCard icon={<Activity className="w-4 h-4" />} label="RDV / semaine" value={perWeek} />
        <StatCard icon={<UserCheck className="w-4 h-4" />} label="Visites / patient" value={avgVisits} />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Heure de pointe"
          value={peak ? `${peak.h}h` : "—"}
        />
      </div>

      <Panel title="Activité des 12 derniers mois" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="flex items-end justify-between gap-1 h-36">
          {months.map((m, i) => (
            <div key={i} className="flex-1 h-full flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">{m.count}</span>
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${Math.max(4, (m.count / maxMonth) * 100)}%`,
                    backgroundImage: "var(--gradient-primary)",
                  }}
                />
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Sources d'acquisition" icon={<Share2 className="w-4 h-4" />}>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune source renseignée.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sources.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{s.emoji} {s.label}</span>
                  <span className="text-muted-foreground">
                    {s.count} · {Math.round((s.count / all.length) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(s.count / maxSource) * 100}%`, backgroundImage: "var(--gradient-primary)" }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground mt-1">{noSource} sans source</p>
          </div>
        )}
      </Panel>

      <Panel title="Dossiers cliniques remplis" icon={<Microscope className="w-4 h-4" />}>
        <p className="text-sm">
          <span className="font-bold text-primary">{withFile}</span> rendez-vous avec dossier clinique ·{" "}
          <span className="font-bold text-muted-foreground">{all.length - withFile}</span> sans
        </p>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${(withFile / all.length) * 100}%`, backgroundImage: "var(--gradient-primary)" }}
          />
        </div>
      </Panel>


      <Panel title="Répartition par type de visite" icon={<Tag className="w-4 h-4" />}>
        <div className="flex flex-col gap-2.5">
          {typeCounts.map((t) => (
            <div key={t.key}>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{t.emoji} {t.label}</span>
                <span className="text-muted-foreground">
                  {t.count} · {all.length ? Math.round((t.count / all.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(t.count / maxType) * 100}%`, backgroundImage: "var(--gradient-primary)" }}
                />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground mt-1">
            {multi} rendez-vous avec plusieurs types · {noType} sans type
          </p>
        </div>
      </Panel>

      <Panel title="Activité par jour de la semaine" icon={<BarChart3 className="w-4 h-4" />}>
        <div className="flex items-end justify-between gap-1.5 h-32">
          {weekday.map((d) => (
            <div key={d.label} className="flex-1 h-full flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">{d.count}</span>
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${Math.max(4, (d.count / maxDay) * 100)}%`,
                    backgroundImage: "var(--gradient-primary)",
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Patients les plus fréquents" icon={<Users className="w-4 h-4" />}>
        {patients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun patient nommé.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {patients.slice(0, 6).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="truncate font-medium">{name}</span>
                <span className="text-xs font-semibold bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                  {count} visite{count > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Qualité des dossiers" icon={<ClipboardList className="w-4 h-4" />}>
        <p className="text-sm">
          <span className="font-bold text-primary">{all.length - incomplete}</span> dossiers complets ·{" "}
          <span className="font-bold text-destructive">{incomplete}</span> incomplets
        </p>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${((all.length - incomplete) / all.length) * 100}%`,
              backgroundImage: "var(--gradient-primary)",
            }}
          />
        </div>
      </Panel>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-3.5">
      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </span>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-3">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}
