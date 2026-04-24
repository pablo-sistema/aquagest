import { useState, useEffect } from "react";
import Clientes      from "./modules/Clientes";
import Paquetes      from "./modules/Paquetes";
import Cobros        from "./modules/Cobros";
import Reportes      from "./modules/Reportes";
import Dashboard     from "./modules/Dashboard";
import Finanzas      from "./modules/Finanzas";
import Usuarios      from "./modules/Usuarios";
import Mapa          from "./modules/Mapa";
import Configuracion from "./modules/Configuracion";
import { CONFIG_KEY, defaultConfig } from "./modules/Configuracion";
import { dbUsuarios, dbPaquetes, dbClientes, dbRecibos, dbGastos, dbReportes } from "./supabase";

// ── THEME ────────────────────────────────────────────────────────
export const T = {
  bg: "#060D1A", surface: "#0D1B2E", card: "#112035",
  border: "#1E3A5F", borderLight: "#2A4F7A",
  primary: "#1A8FE3", primaryDark: "#0E6BB5", primaryGlow: "#1A8FE340",
  accent: "#00D4FF", accentDim: "#00D4FF20",
  success: "#00C48C", successDim: "#00C48C20",
  warning: "#FFB020", warningDim: "#FFB02020",
  danger:  "#FF4757", dangerDim:  "#FF475720",
  text: "#E8F4FD", textMuted: "#6B8FAF", textDim: "#3D6080",
};

export const font     = "'IBM Plex Mono', 'Courier New', monospace";
export const fontSans = "'IBM Plex Sans', system-ui, sans-serif";

export const uid            = () => crypto.randomUUID();
export const today          = () => new Date().toISOString().split("T")[0];
export const formatCurrency = (n) => `S/ ${Number(n).toFixed(2)}`;
export const formatDate     = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-PE", { day:"2-digit", month:"2-digit", year:"numeric" }) : "-";
export const periodLabel    = (p) => {
  if (!p) return "";
  const [y, m] = p.split("-");
  const ms = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${ms[parseInt(m)-1]} ${y}`;
};

// ── NAVEGACIÓN ───────────────────────────────────────────────────
const NAV_ADMIN = [
  { id: "dashboard", icon: "📊", label: "Dashboard"     },
  { id: "clients",   icon: "👥", label: "Clientes"      },
  { id: "packages",  icon: "📦", label: "Paquetes"      },
  { id: "billing",   icon: "💰", label: "Cobros"        },
  { id: "finanzas",  icon: "📈", label: "Finanzas"      },
  { id: "mapa",      icon: "🗺️", label: "Mapa"          },
  { id: "reports",   icon: "🔧", label: "Reportes"      },
  { id: "usuarios",  icon: "👤", label: "Usuarios"      },
  { id: "config",    icon: "⚙️", label: "Configuración" },
];

const NAV_COBRADOR = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "clients",   icon: "👥", label: "Clientes"  },
  { id: "billing",   icon: "💰", label: "Cobros"    },
  { id: "finanzas",  icon: "📈", label: "Finanzas"  },
  { id: "mapa",      icon: "🗺️", label: "Mapa"      },
];

// ── PANTALLA DE CARGA ────────────────────────────────────────────
function Cargando() {
  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 34, boxShadow: `0 0 40px ${T.primary}40`,
        animation: "pulse 1.5s ease-in-out infinite",
      }}>💧</div>
      <div style={{ color: T.textMuted, fontSize: 14, fontFamily: font, letterSpacing: 1 }}>
        CARGANDO SISTEMA...
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.8} }`}</style>
    </div>
  );
}

// ── LOGIN ────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Ingresa usuario y contraseña"); return; }
    setLoading(true); setError("");
    try {
      // Intentar con Supabase
      const user = await dbUsuarios.login(username, password);
      if (user) { onLogin(user); setLoading(false); return; }

      // Acceso local si Supabase no tiene usuarios configurados
      const locales = [
        { id: "1", username: "admin",     password: "admin123",    name: "Administrador", role: "admin",    avatar: "👔", activo: true },
        { id: "2", username: "cobrador1", password: "cobrador123", name: "Juan Pérez",    role: "cobrador", avatar: "💳", activo: true },
        { id: "3", username: "cobrador2", password: "cobrador123", name: "María Torres",  role: "cobrador", avatar: "💳", activo: true },
      ];
      const local = locales.find(u => u.username === username.trim() && u.password === password.trim());
      if (local) { onLogin(local); setLoading(false); return; }

      setError("Usuario o contraseña incorrectos");
    } catch (e) {
      console.error("Login error:", e);
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: fontSans, padding: 16,
      backgroundImage: `radial-gradient(ellipse at 20% 50%, #1A8FE312 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, #00D4FF08 0%, transparent 50%)`,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, margin: "0 auto 16px",
            boxShadow: `0 0 40px ${T.primary}40`,
          }}>💧</div>
          <div style={{
            fontSize: 28, fontWeight: 900, fontFamily: font,
            background: `linear-gradient(90deg, ${T.accent}, ${T.primary})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 2,
          }}>AQUAGEST PRO</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontFamily: font, letterSpacing: 1 }}>
            SISTEMA DE AGUA POTABLE
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: T.surface, border: `1px solid ${T.borderLight}`,
          borderRadius: 20, padding: 32,
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: T.text }}>
            Iniciar Sesión
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, display: "block", marginBottom: 6 }}>Usuario</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Ingresa tu usuario"
              style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 14, fontFamily: fontSans, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, display: "block", marginBottom: 6 }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Ingresa tu contraseña"
                style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 44px 11px 14px", color: T.text, fontSize: 14, fontFamily: fontSans, outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.textMuted }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: T.dangerDim, border: `1px solid ${T.danger}40`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.danger, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{
            width: "100%",
            background: loading ? T.surface : `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
            border: `1px solid ${T.primary}`, borderRadius: 10, padding: "13px",
            color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: fontSans, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "⏳ Verificando..." : "Ingresar al Sistema"}
          </button>

          {/* Info versión */}
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: T.textDim }}>
            AquaGest Pro v2.0 — Base de datos en la nube ☁️
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICACIÓN VENCIDOS ────────────────────────────────────────
function AlertaVencidos({ bills, onClose }) {
  const ahora    = new Date();
  const vencidos = bills.filter(b => b.status === "vencido");
  const hoy      = bills.filter(b => {
    if (b.status !== "pendiente" || !b.dueDate) return false;
    const d = new Date(b.dueDate + "T00:00:00");
    return d.toDateString() === ahora.toDateString();
  });
  const en3dias  = bills.filter(b => {
    if (b.status !== "pendiente" || !b.dueDate) return false;
    const d    = new Date(b.dueDate + "T00:00:00");
    const diff = (d - ahora) / 86400000;
    return diff > 0 && diff <= 3;
  });

  if (vencidos.length === 0 && hoy.length === 0 && en3dias.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 70, right: 16, zIndex: 150,
      display: "flex", flexDirection: "column", gap: 8,
      maxWidth: 320,
    }}>
      {vencidos.length > 0 && (
        <div style={{
          background: T.dangerDim, border: `1px solid ${T.danger}50`,
          borderRadius: 12, padding: "12px 16px",
          display: "flex", gap: 10, alignItems: "flex-start",
          boxShadow: `0 4px 20px rgba(0,0,0,.3)`,
          animation: "slideIn .3s ease",
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.danger, fontSize: 13 }}>
              {vencidos.length} recibo(s) vencido(s)
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              Requieren atención inmediata
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}
      {hoy.length > 0 && (
        <div style={{
          background: T.warningDim, border: `1px solid ${T.warning}50`,
          borderRadius: 12, padding: "12px 16px",
          display: "flex", gap: 10, alignItems: "flex-start",
          boxShadow: `0 4px 20px rgba(0,0,0,.3)`,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.warning, fontSize: 13 }}>
              {hoy.length} recibo(s) vencen hoy
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              Gestionar antes de fin del día
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}
      {en3dias.length > 0 && (
        <div style={{
          background: T.accentDim, border: `1px solid ${T.accent}50`,
          borderRadius: 12, padding: "12px 16px",
          display: "flex", gap: 10, alignItems: "flex-start",
          boxShadow: `0 4px 20px rgba(0,0,0,.3)`,
        }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.accent, fontSize: 13 }}>
              {en3dias.length} recibo(s) vencen en 3 días
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              Avisar a los clientes con anticipación
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}
      <style>{`@keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }`}</style>
    </div>
  );
}

// ── APP PRINCIPAL ────────────────────────────────────────────────
export default function App() {
  const [user,      setUser]      = useState(() => {
    try { const s = localStorage.getItem("aquagest_user"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [view,      setView]      = useState("dashboard");
  const [loading,   setLoading]   = useState(true);
  const [alerta,    setAlerta]    = useState(true);

  // Configuración de la empresa (localStorage)
  const [config, setConfig] = useState(() => {
    try { return { ...defaultConfig, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}") }; }
    catch { return defaultConfig; }
  });
  const updateConfig = (newConfig) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  };

  // Datos desde Supabase
  const [usuarios,  setUsuarios]  = useState([]);
  const [clients,   setClients]   = useState([]);
  const [packages,  setPackages]  = useState([]);
  const [bills,     setBills]     = useState([]);
  const [reports,   setReports]   = useState([]);
  const [gastos,    setGastos]    = useState([]);

  const handleRestoreBackup = (data) => {
    if (data.clientes)  setClients(data.clientes);
    if (data.paquetes)  setPackages(data.paquetes);
    if (data.recibos)   setBills(data.recibos);
    if (data.gastos)    setGastos(data.gastos);
    if (data.reportes)  setReports(data.reportes);
    if (data.usuarios)  setUsuarios(data.usuarios);
    if (data.config)    updateConfig(data.config);
  };

  // ── Cargar todos los datos al iniciar ──
  useEffect(() => {
    const cargar = async () => {
      try {
        const [us, pk, cl, re, ga, rp] = await Promise.all([
          dbUsuarios.getAll(),
          dbPaquetes.getAll(),
          dbClientes.getAll(),
          dbRecibos.getAll(),
          dbGastos.getAll(),
          dbReportes.getAll(),
        ]);
        setUsuarios(us);
        setPackages(pk);
        setClients(cl);
        setBills(re);
        setGastos(ga);
        setReports(rp);
      } catch (e) {
        console.error("Error cargando datos:", e);
      }
      setLoading(false);
    };
    cargar();
  }, []);


  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem("aquagest_user", JSON.stringify(u));
    setView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("aquagest_user");
    setView("dashboard");
  };

  if (loading) return <Cargando />;
  if (!user)   return <Login onLogin={handleLogin} />;

  const cobrador = user.role === "cobrador";
  const NAV      = cobrador ? NAV_COBRADOR : NAV_ADMIN;
  const vencidosCount = bills.filter(b => b.status === "vencido").length;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: fontSans, display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <header style={{
        background: "rgba(6,13,26,.97)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`, padding: "0 20px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.primary},${T.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>💧</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, fontFamily: font, letterSpacing: 1, background: `linear-gradient(90deg,${T.accent},${T.primary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AQUAGEST PRO</div>
            <div style={{ fontSize: 9, color: T.textDim, fontFamily: font, textTransform: "uppercase", letterSpacing: 1 }}>Sistema de Agua Potable</div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              background: view === n.id ? T.primaryGlow : "transparent",
              border: view === n.id ? `1px solid ${T.primary}50` : "1px solid transparent",
              borderRadius: 8, padding: "6px 11px",
              color: view === n.id ? T.primary : T.textMuted,
              cursor: "pointer", fontSize: 12, fontWeight: view === n.id ? 700 : 400,
              fontFamily: fontSans, display: "flex", alignItems: "center", gap: 5,
              position: "relative",
            }}>
              <span>{n.icon}</span><span>{n.label}</span>
              {/* Badge vencidos en Cobros */}
              {n.id === "billing" && vencidosCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: T.danger, color: "#fff",
                  borderRadius: "50%", width: 16, height: 16,
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {vencidosCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{user.avatar} {user.name}</div>
            <div style={{ fontSize: 10, color: user.role === "admin" ? T.success : T.warning, fontFamily: font, textTransform: "uppercase" }}>{user.role}</div>
          </div>
          <button onClick={handleLogout} style={{
            background: T.dangerDim, border: `1px solid ${T.danger}40`,
            borderRadius: 8, padding: "6px 12px",
            color: T.danger, cursor: "pointer", fontSize: 12, fontFamily: fontSans,
          }}>
            🚪 Salir
          </button>
        </div>
      </header>

      {/* ALERTA VENCIDOS */}
      {alerta && <AlertaVencidos bills={bills} onClose={() => setAlerta(false)} />}

      {/* CONTENIDO */}
      <main style={{ flex: 1, padding: 20, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        {view === "dashboard" && (
          <Dashboard
            clients={clients} setClients={setClients}
            bills={bills} reports={reports}
            packages={packages}
            dbClientes={dbClientes}
          />
        )}
        {view === "clients" && (
          <Clientes
            clients={clients} setClients={setClients}
            packages={packages} bills={bills} role={user.role}
            dbClientes={dbClientes}
          />
        )}
        {view === "packages" && !cobrador && (
          <Paquetes
            packages={packages} setPackages={setPackages}
            dbPaquetes={dbPaquetes}
          />
        )}
        {view === "billing" && (
          <Cobros
            bills={bills} setBills={setBills}
            clients={clients} packages={packages}
            role={user.role} currentUser={user}
            config={config} dbRecibos={dbRecibos}
          />
        )}
        {view === "finanzas" && (
          <Finanzas
            bills={bills} gastos={gastos} setGastos={setGastos}
            clients={clients} role={user.role} dbGastos={dbGastos}
          />
        )}
        {view === "reports" && !cobrador && (
          <Reportes
            reports={reports} setReports={setReports}
            clients={clients} dbReportes={dbReportes}
          />
        )}
        {view === "mapa" && (
          <Mapa clients={clients} packages={packages} bills={bills} />
        )}
        {view === "usuarios" && !cobrador && (
          <Usuarios
            usuarios={usuarios} setUsuarios={setUsuarios}
            currentUser={user} dbUsuarios={dbUsuarios}
          />
        )}
        {view === "config" && !cobrador && (
          <Configuracion
            config={config} onUpdateConfig={updateConfig}
            clients={clients} packages={packages} bills={bills}
            gastos={gastos} reports={reports} usuarios={usuarios}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>
    </div>
  );
}