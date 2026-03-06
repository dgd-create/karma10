'use client'

import { useState, useEffect, useRef } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface User {
  name: string;
  email: string;
  bio: string;
  skills: string[];
  karma: number;
  favors: number;
  rating: number;
  level: number;
}

interface Favor {
  id: number;
  userId: number;
  user: string;
  title: string;
  desc: string;
  time: number;
  cost: number;
  status: string;
  avatar: string;
}

interface FeedItem {
  id: number;
  type: string;
  helper: string;
  helped: string | null;
  task: string;
  karma: number;
  time: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, name: "Anna García", bio: "Diseñadora UX | Startup entusiasta", skills: ["Feedback UI/UX", "Branding", "Pitch decks"], karma: 120, favors: 24, rating: 4.9, level: 3 },
  { id: 2, name: "David Sánchez", bio: "Full-stack dev & mentor", skills: ["Código React", "APIs", "Bug fixing"], karma: 95, favors: 19, rating: 4.8, level: 2 },
  { id: 3, name: "Marc Puig", bio: "Growth hacker | Ex-Glovo", skills: ["LinkedIn", "Copywriting", "SEO rápido"], karma: 80, favors: 16, rating: 4.7, level: 2 },
  { id: 4, name: "Marta López", bio: "HR consultant & coach", skills: ["CV review", "Entrevistas", "Negociación"], karma: 60, favors: 12, rating: 4.6, level: 2 },
  { id: 5, name: "Pau Ferrer", bio: "Product Manager | Fintech", skills: ["PRDs", "User stories", "Roadmaps"], karma: 35, favors: 7, rating: 4.5, level: 2 },
];

const INITIAL_FEED: FeedItem[] = [
  { id: 1, type: "help", helper: "Anna", helped: "Carlos", task: "validar idea de startup", karma: 5, time: "hace 2 min" },
  { id: 2, type: "help", helper: "David", helped: "Marta", task: "preparar entrevista de trabajo", karma: 5, time: "hace 8 min" },
  { id: 3, type: "help", helper: "Marc", helped: "Pau", task: "revisar perfil de LinkedIn", karma: 5, time: "hace 15 min" },
  { id: 4, type: "join", helper: "Sara Vidal", helped: null, task: "se unió a Karma5", karma: 10, time: "hace 23 min" },
  { id: 5, type: "help", helper: "Marta", helped: "Laia", task: "dar feedback de CV", karma: 5, time: "hace 31 min" },
];

const INITIAL_FAVORS: Favor[] = [
  { id: 1, userId: 2, user: "David Sánchez", title: "Necesito feedback rápido de mi landing page", desc: "Solo quiero saber si el mensaje principal es claro y si el CTA tiene sentido.", time: 5, cost: 5, status: "open", avatar: "DS" },
  { id: 2, userId: 3, user: "Marc Puig", title: "Revisión de copy para email de lanzamiento", desc: "Tengo un email de 150 palabras para una campaña. Necesito que suene más humano.", time: 10, cost: 10, status: "open", avatar: "MP" },
  { id: 3, userId: 4, user: "Marta López", title: "¿Me ayudas a estructurar un pitch de 3 minutos?", desc: "Tengo una reunión mañana. Solo necesito consejo sobre estructura y flujo.", time: 10, cost: 10, status: "open", avatar: "ML" },
  { id: 4, userId: 5, user: "Pau Ferrer", title: "Valida esta user story antes de mi sprint", desc: "¿Tiene sentido desde perspectiva de usuario? 5 minutos máximo.", time: 5, cost: 5, status: "open", avatar: "PF" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getLevel = (karma: number) => {
  if (karma >= 100) return { n: 3, name: "Karma Hero", color: "#f59e0b", icon: "🏆" };
  if (karma >= 20) return { n: 2, name: "Trusted Helper", color: "#10b981", icon: "⭐" };
  return { n: 1, name: "New Helper", color: "#6366f1", icon: "🌱" };
};

const getMaxDailyFavors = (karma: number) => {
  if (karma >= 100) return Infinity;
  if (karma >= 20) return 3;
  return 1;
};

const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const initials = name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors = ["#f59e0b", "#10b981", "#6366f1", "#ef4444", "#ec4899", "#06b6d4"];
  const bg = colors[name?.charCodeAt(0) % colors.length] || "#6366f1";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35,
      fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0
    }}>{initials}</div>
  );
};

const KarmaChip = ({ value, sign }: { value: number; sign: string }) => (
  <span style={{
    background: sign === "+" ? "#d1fae5" : "#fee2e2",
    color: sign === "+" ? "#059669" : "#dc2626",
    fontWeight: 700, fontSize: 12, padding: "2px 8px", borderRadius: 20,
    fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap"
  }}>{sign}{value}k</span>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #ecfdf5 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🔥</div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 38, fontWeight: 800, color: "#1c1917", margin: 0 }}>
          Karma<span style={{ color: "#f59e0b" }}>5</span>
        </h1>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#78716c", fontSize: 16, marginTop: 8 }}>
          Ayuda en 5 minutos. Gana karma. Recibe ayuda.
        </p>
      </div>

      <div style={{
        background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)", border: "1px solid #fef3c7"
      }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 22, color: "#1c1917", marginBottom: 24, marginTop: 0 }}>
          {isSignup ? "Crear cuenta" : "Bienvenido/a"}
        </h2>

        {isSignup && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#78716c", display: "block", marginBottom: 6 }}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, boxSizing: "border-box", outline: "none" }} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#78716c", display: "block", marginBottom: 6 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" type="email"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, boxSizing: "border-box", outline: "none" }} />
        </div>

        <button
          onClick={() => onLogin({ name: name || "Usuario", email, karma: 10, favors: 0, rating: 0, level: 1, bio: "", skills: [] })}
          style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16,
            border: "none", cursor: "pointer", marginBottom: 12, boxShadow: "0 4px 20px rgba(245,158,11,0.4)"
          }}>
          {isSignup ? "Crear cuenta (+10 karma 🎁)" : "Entrar"}
        </button>

        <button
          onClick={() => onLogin({ name: "Demo User", email: "demo@karma5.app", karma: 10, favors: 0, rating: 0, level: 1, bio: "Explorando Karma5 🚀", skills: ["Diseño", "Producto", "Pitch"] })}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, background: "#f5f5f4",
            color: "#44403c", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15,
            border: "1.5px solid #e7e5e4", cursor: "pointer", marginBottom: 20
          }}>
          🎮 Entrar como demo
        </button>

        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: "center", color: "#a8a29e", fontSize: 14, margin: 0 }}>
          {isSignup ? "¿Ya tienes cuenta? " : "¿Eres nuevo/a? "}
          <span onClick={() => setIsSignup(!isSignup)} style={{ color: "#f59e0b", fontWeight: 700, cursor: "pointer" }}>
            {isSignup ? "Entra aquí" : "Regístrate gratis"}
          </span>
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {["🌱 Empieza con 10 karma", "⚡ Ayuda en 5 min", "🏆 Sube de nivel"].map((t, i) => (
          <div key={i} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#92400e", fontWeight: 600 }}>{t}</div>
        ))}
      </div>
    </div>
  );
};

// ─── FEED TAB ─────────────────────────────────────────────────────────────────
const FeedTab = ({
  user, setUser, favors, setFavors, feed, setFeed, onPostFavor
}: {
  user: User; setUser: (u: User | ((u: User) => User)) => void;
  favors: Favor[]; setFavors: (f: Favor[] | ((f: Favor[]) => Favor[])) => void;
  feed: FeedItem[]; setFeed: (f: FeedItem[] | ((f: FeedItem[]) => FeedItem[])) => void;
  onPostFavor: () => void;
}) => {
  const [accepting, setAccepting] = useState<Favor | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rating, setRating] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHelp = (favor: Favor) => {
    setAccepting(favor);
    setTimeLeft(favor.time * 60);
    setCompleted(false);
    setRating(0);
    setTimerActive(false);
  };

  const startTimer = () => {
    setTimerActive(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerActive(false);
          setCompleted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const completeHelp = () => {
    if (!rating || !accepting) return;
    const earned = accepting.cost + 1;
    setUser((u: User) => ({ ...u, karma: u.karma + earned, favors: u.favors + 1 }));
    setFavors((fs: Favor[]) => fs.filter(f => f.id !== accepting.id));
    setFeed((f: FeedItem[]) => [{
      id: Date.now(), type: "help",
      helper: user.name.split(" ")[0],
      helped: accepting.user.split(" ")[0],
      task: accepting.title.toLowerCase().slice(0, 40),
      karma: earned, time: "ahora mismo"
    }, ...f]);
    setAccepting(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Karma header */}
      <div style={{
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        padding: "20px 20px 28px", color: "#fff", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>Tu karma</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{user.karma}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, opacity: 0.9, marginBottom: 10 }}>
            {getLevel(user.karma).icon} {getLevel(user.karma).name}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          {[["Favors", user.favors], ["Nivel", getLevel(user.karma).n]].map(([k, v]) => (
            <div key={String(k)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Post button */}
      <div style={{ padding: "16px 16px 8px" }}>
        <button onClick={onPostFavor} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: user.karma < 5 ? "#f5f5f4" : "linear-gradient(135deg, #1c1917, #292524)",
          color: user.karma < 5 ? "#a8a29e" : "#fff",
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
          border: "none", cursor: user.karma < 5 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {user.karma < 5 ? "⚠️ Karma insuficiente" : "✏️ Pedir un micro-favor (-5k)"}
        </button>
      </div>

      {/* Favors */}
      <div style={{ padding: "8px 16px" }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#1c1917", marginBottom: 12 }}>
          Favores activos
        </h3>
        {favors.map(favor => (
          <div key={favor.id} style={{
            background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #fef3c7"
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Avatar name={favor.user} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#1c1917", lineHeight: 1.3, flex: 1, marginRight: 8 }}>
                    {favor.title}
                  </div>
                  <KarmaChip value={favor.cost} sign="+" />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#78716c", marginTop: 4, lineHeight: 1.4 }}>
                  {favor.desc}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ⏱ {favor.time} min
                  </span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => startHelp(favor)} style={{
                    background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                    border: "none", borderRadius: 10, padding: "8px 14px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer"
                  }}>
                    Puedo ayudar →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {favors.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#a8a29e", fontSize: 14 }}>
            🎉 No hay favores pendientes. ¡Sé el primero!
          </div>
        )}
      </div>

      {/* Live feed */}
      <div style={{ padding: "8px 16px" }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#1c1917", marginBottom: 12 }}>
          🔴 En vivo
        </h3>
        {feed.map(item => (
          <div key={item.id} style={{
            display: "flex", gap: 10, alignItems: "center", padding: "10px 14px",
            background: "#fafaf9", borderRadius: 12, marginBottom: 8, border: "1px solid #f5f5f4"
          }}>
            <div style={{ fontSize: 18 }}>{item.type === "join" ? "👋" : "🤝"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#1c1917" }}>
                <strong>{item.helper}</strong>
                {item.type === "help"
                  ? <> ayudó a <strong>{item.helped}</strong> a {item.task}</>
                  : <> {item.task}</>}
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#a8a29e" }}>{item.time}</div>
            </div>
            <KarmaChip value={item.karma} sign="+" />
          </div>
        ))}
      </div>

      {/* Accept favor modal */}
      {accepting && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", borderRadius: "24px 24px 0 0", padding: 28, width: "100%", maxWidth: 480,
            boxShadow: "0 -10px 40px rgba(0,0,0,0.15)"
          }}>
            {!completed ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "#1c1917" }}>
                      Ayudando a {accepting.user.split(" ")[0]}
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#78716c", marginTop: 4 }}>
                      {accepting.title}
                    </div>
                  </div>
                  <button onClick={() => { setAccepting(null); if (intervalRef.current) clearInterval(intervalRef.current); }} style={{ background: "#f5f5f4", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                <div style={{ background: "#fef3c7", borderRadius: 16, padding: 20, textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 52, fontWeight: 800, color: "#92400e" }}>
                    {fmtTime(timeLeft)}
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#a16207" }}>
                    {timerActive ? "⏱ Temporizador activo..." : `Tienes ${accepting.time} minutos`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {!timerActive && (
                    <button onClick={startTimer} style={{
                      flex: 1, padding: 14, borderRadius: 12, background: "#fef3c7",
                      color: "#92400e", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700, fontSize: 14, cursor: "pointer"
                    }}>⏱ Iniciar timer</button>
                  )}
                  <button onClick={() => { setCompleted(true); if (intervalRef.current) clearInterval(intervalRef.current); }} style={{
                    flex: 1, padding: 14, borderRadius: 12,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700, fontSize: 14, cursor: "pointer"
                  }}>✅ Completado</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: "#1c1917" }}>¡Favor completado!</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#78716c", marginTop: 4 }}>Valora a {accepting.user.split(" ")[0]}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)} style={{
                      fontSize: 36, background: "none", border: "none", cursor: "pointer",
                      opacity: s <= rating ? 1 : 0.3, transition: "opacity 0.15s"
                    }}>⭐</button>
                  ))}
                </div>
                <div style={{
                  background: "#d1fae5", borderRadius: 12, padding: "12px 16px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#065f46",
                  fontWeight: 600, marginBottom: 16, textAlign: "center"
                }}>
                  +{accepting.cost + 1} karma para ti 🔥
                </div>
                <button onClick={completeHelp} disabled={!rating} style={{
                  width: "100%", padding: 14, borderRadius: 12,
                  background: rating ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#f5f5f4",
                  color: rating ? "#fff" : "#a8a29e", border: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
                  cursor: rating ? "pointer" : "not-allowed"
                }}>
                  Confirmar y ganar karma
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── POST FAVOR MODAL ─────────────────────────────────────────────────────────
const PostFavorModal = ({
  user, setUser, setFavors, setFeed, onClose
}: {
  user: User;
  setUser: (u: User | ((u: User) => User)) => void;
  setFavors: (f: Favor[] | ((f: Favor[]) => Favor[])) => void;
  setFeed: (f: FeedItem[] | ((f: FeedItem[]) => FeedItem[])) => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState(5);
  const cost = time;

  const submit = () => {
    if (!title || user.karma < cost) return;
    setFavors((f: Favor[]) => [{
      id: Date.now(), userId: 0, user: user.name, title, desc,
      time, cost, status: "open", avatar: user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)
    }, ...f]);
    setUser((u: User) => ({ ...u, karma: u.karma - cost }));
    setFeed((f: FeedItem[]) => [{
      id: Date.now() + 1, type: "request",
      helper: user.name.split(" ")[0], helped: null,
      task: `pidió ayuda: "${title.slice(0, 30)}..."`, karma: cost, time: "ahora mismo"
    }, ...f]);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: 28, width: "100%", maxWidth: 480,
        boxShadow: "0 -10px 40px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: "#1c1917" }}>Nuevo micro-favor</div>
          <button onClick={onClose} style={{ background: "#f5f5f4", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#78716c", display: "block", marginBottom: 6 }}>¿Qué necesitas? *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Feedback rápido de mi pitch deck"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, boxSizing: "border-box", outline: "none" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#78716c", display: "block", marginBottom: 6 }}>Descripción</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Contexto rápido..." rows={3}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, boxSizing: "border-box", outline: "none", resize: "none" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#78716c", display: "block", marginBottom: 10 }}>Tiempo estimado</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[5, 10].map(t => (
              <button key={t} onClick={() => setTime(t)} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: time === t ? "#fef3c7" : "#fafaf9",
                border: time === t ? "2px solid #f59e0b" : "2px solid #e7e5e4",
                color: time === t ? "#92400e" : "#78716c",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer"
              }}>
                ⏱ {t} min
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2 }}>-{t} karma</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: user.karma >= cost ? "#fef3c7" : "#fee2e2", borderRadius: 12, padding: "12px 16px", marginBottom: 16,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14,
          color: user.karma >= cost ? "#92400e" : "#dc2626", fontWeight: 600
        }}>
          {user.karma >= cost
            ? `Tu karma: ${user.karma} → ${user.karma - cost} (después de publicar)`
            : `⚠️ Necesitas ${cost} karma, tienes ${user.karma}.`}
        </div>

        <button onClick={submit} disabled={!title || user.karma < cost} style={{
          width: "100%", padding: 14, borderRadius: 12,
          background: title && user.karma >= cost ? "linear-gradient(135deg, #1c1917, #292524)" : "#f5f5f4",
          color: title && user.karma >= cost ? "#fff" : "#a8a29e",
          border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15,
          cursor: title && user.karma >= cost ? "pointer" : "not-allowed"
        }}>
          Publicar favor (-{cost} karma)
        </button>
      </div>
    </div>
  );
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
const LeaderboardTab = ({ user }: { user: User }) => {
  const allUsers = [
    ...MOCK_USERS,
    { id: 99, name: user.name, karma: user.karma, favors: user.favors, rating: user.rating || 0, level: getLevel(user.karma).n }
  ].sort((a, b) => b.karma - a.karma);

  const podium = [allUsers[1], allUsers[0], allUsers[2]];
  const podiumHeights = [90, 115, 75];
  const podiumColors = ["#9ca3af", "#f59e0b", "#b45309"];
  const podiumMedals = ["🥈", "🥇", "🥉"];

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: "20px 20px 16px", background: "#1c1917" }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", margin: 0 }}>🏆 Leaderboard</h2>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#a8a29e", marginTop: 4, marginBottom: 0 }}>Top helpers esta semana</p>
      </div>

      <div style={{ background: "#1c1917", padding: "0 20px 28px", display: "flex", gap: 10, alignItems: "flex-end", justifyContent: "center" }}>
        {podium.map((u, i) => (
          <div key={u?.id} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              {u?.name?.split(" ")[0]}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <Avatar name={u?.name || ""} size={36} />
            </div>
            <div style={{
              height: podiumHeights[i], background: podiumColors[i],
              borderRadius: "8px 8px 0 0", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2
            }}>
              <div style={{ fontSize: 20 }}>{podiumMedals[i]}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fff", fontWeight: 800, fontSize: 14 }}>{u?.karma}k</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {allUsers.map((u, i) => {
          const isMe = u.id === 99;
          const lv = getLevel(u.karma);
          return (
            <div key={u.id} style={{
              display: "flex", gap: 12, alignItems: "center", padding: "14px 16px",
              background: isMe ? "#fef3c7" : "#fff", borderRadius: 14, marginBottom: 8,
              border: isMe ? "2px solid #f59e0b" : "1px solid #f5f5f4",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: "#a8a29e", width: 24, textAlign: "center" }}>{i + 1}</div>
              <Avatar name={u.name} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#1c1917" }}>
                  {u.name} {isMe && <span style={{ fontSize: 11, color: "#f59e0b" }}>(tú)</span>}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#78716c" }}>
                  {lv.icon} {lv.name} · {u.favors} favors
                </div>
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "#f59e0b" }}>{u.karma}k</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
const ProfileTab = ({ user, setUser }: { user: User; setUser: (u: User) => void }) => {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || "");
  const [skills, setSkills] = useState<string[]>(user.skills || ["", "", ""]);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const lv = getLevel(user.karma);
  const maxFavors = getMaxDailyFavors(user.karma);
  const nextLevelKarma = lv.n === 1 ? 20 : lv.n === 2 ? 100 : 100;
  const progress = lv.n === 1 ? (user.karma / 20) * 100 : lv.n === 2 ? ((user.karma - 20) / 80) * 100 : 100;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(135deg, #1c1917, #292524)", padding: "28px 20px 24px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name={user.name} size={64} />
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>{user.name}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: lv.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {lv.icon} {lv.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#f5f5f4" }}>
        {([["Karma", `${user.karma} 🔥`], ["Favors", String(user.favors)], ["Rating", user.rating ? String(user.rating) : "—"]] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ background: "#fff", padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: "#1c1917" }}>{v}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#a8a29e" }}>{k}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {/* Progress */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid #f5f5f4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#1c1917" }}>Progreso de nivel</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#78716c" }}>
              {lv.n < 3 ? `${user.karma}/${nextLevelKarma}k` : "Nivel máximo 🏆"}
            </span>
          </div>
          <div style={{ height: 8, background: "#f5f5f4", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg, ${lv.color}, #f59e0b)`, borderRadius: 4, width: `${Math.min(100, progress)}%`, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#78716c", marginTop: 6 }}>
            Límite diario: {maxFavors === Infinity ? "ilimitado ✨" : `${maxFavors} favor${maxFavors > 1 ? "es" : ""}`}
          </div>
        </div>

        {/* Bio & skills */}
        {!editing ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid #f5f5f4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#1c1917" }}>Perfil</span>
              <button onClick={() => setEditing(true)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#f59e0b", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Editar</button>
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#78716c", marginBottom: 12 }}>
              {user.bio || "Sin bio todavía. ¡Añade una!"}
            </p>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1c1917", marginBottom: 8 }}>Puedo ayudar con:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(user.skills?.filter(Boolean).length ? user.skills.filter(Boolean) : ["Sin skills aún"]).map((s, i) => (
                <span key={i} style={{ background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, border: "2px solid #f59e0b" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#1c1917", marginBottom: 12 }}>Editar perfil</div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio corta..." rows={2}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, boxSizing: "border-box", resize: "none", marginBottom: 10, outline: "none" }} />
            {[0, 1, 2].map(i => (
              <input key={i} value={skills[i] || ""} onChange={e => { const s = [...skills]; s[i] = e.target.value; setSkills(s); }} placeholder={`Skill ${i + 1}`}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, boxSizing: "border-box", marginBottom: 8, outline: "none" }} />
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 10, borderRadius: 10, background: "#f5f5f4", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { setUser({ ...user, bio, skills: skills.filter(Boolean) }); setEditing(false); }} style={{ flex: 1, padding: 10, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        )}

        {/* Invite */}
        <div style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid #fcd34d" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: "#92400e", marginBottom: 4 }}>🎁 Invita amigos → +10 karma</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#a16207", marginBottom: 12 }}>
            Gana 10 karma por cada amigo que complete su primer favor.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#92400e", fontWeight: 700 }}>
              karma5.app/invite/{user.name?.split(" ")[0].toLowerCase()}
            </div>
            <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: "10px 14px", borderRadius: 10, background: "#f59e0b", color: "#fff", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {copied ? "✅" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Share */}
        <button onClick={() => setShowShare(true)} style={{
          width: "100%", padding: "14px", borderRadius: 14, background: "#fff",
          border: "2px solid #e7e5e4", fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700, fontSize: 14, color: "#1c1917", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          📤 Compartir mi perfil
        </button>
      </div>

      {showShare && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 }}>
            <div style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔥</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" }}>Acabo de ayudar a alguien en 5 minutos</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 8 }}>en Karma5 — la economía de micro-favores</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", marginTop: 12 }}>{user.karma} karma 🏆</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["💼 LinkedIn", "#0a66c2"], ["𝕏 X/Twitter", "#000"], ["💬 WhatsApp", "#25d366"]].map(([lbl, bg]) => (
                <button key={lbl} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, background: bg as string, color: "#fff", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>{lbl}</button>
              ))}
            </div>
            <button onClick={() => setShowShare(false)} style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, background: "#f5f5f4", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Karma5App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("feed");
  const [favors, setFavors] = useState<Favor[]>(INITIAL_FAVORS);
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [showPostFavor, setShowPostFavor] = useState(false);

  // Simulate live feed activity
  useEffect(() => {
    if (!user) return;
    const names = [["Elena", "Jordi"], ["Carlos", "Nuria"], ["Laia", "Miquel"], ["Sara", "Marc"]];
    const tasks = ["revisar un email", "dar feedback de UI", "validar nombre de marca", "brainstorm rápido", "revisar un pitch"];
    const interval = setInterval(() => {
      const [h, he] = names[Math.floor(Math.random() * names.length)];
      setFeed(f => [{
        id: Date.now(), type: "help", helper: h, helped: he,
        task: tasks[Math.floor(Math.random() * tasks.length)], karma: 5, time: "ahora mismo"
      }, ...f.slice(0, 19)]);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} />;

  const tabs = [
    { id: "feed", icon: "🏠", label: "Inicio" },
    { id: "leaderboard", icon: "🏆", label: "Top" },
    { id: "profile", icon: "👤", label: "Perfil" },
  ];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#fafaf9", position: "relative" }}>
      {tab === "feed" && (
        <FeedTab user={user} setUser={setUser as any} favors={favors} setFavors={setFavors as any} feed={feed} setFeed={setFeed as any} onPostFavor={() => setShowPostFavor(true)} />
      )}
      {tab === "leaderboard" && <LeaderboardTab user={user} />}
      {tab === "profile" && <ProfileTab user={user} setUser={setUser} />}

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #f5f5f4",
        display: "flex", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px 0 14px", background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3
          }}>
            <span style={{ fontSize: 22, filter: tab === t.id ? "none" : "grayscale(0.5) opacity(0.5)" }}>{t.icon}</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: tab === t.id ? "#f59e0b" : "#a8a29e" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {showPostFavor && (
        <PostFavorModal
          user={user} setUser={setUser as any}
          setFavors={setFavors as any} setFeed={setFeed as any}
          onClose={() => setShowPostFavor(false)}
        />
      )}
    </div>
  );
}
