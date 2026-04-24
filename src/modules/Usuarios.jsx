import { useState } from "react";
import { T, font, fontSans, uid } from "../App";
import { Btn, Input, Modal, Chip, Card } from "./Compartidos";

// ── FORMULARIO USUARIO ───────────────────────────────────────────
function UsuarioForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    name:     "",
    username: "",
    password: "",
    role:     "cobrador",
    activo:   true,
  });

  const [showPass, setShowPass] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!f.name.trim())     return alert("El nombre es obligatorio");
    if (!f.username.trim()) return alert("El usuario es obligatorio");
    if (!f.password.trim()) return alert("La contraseña es obligatoria");
    onSave(f);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Info */}
      <div style={{
        background: T.primaryGlow, border: `1px solid ${T.primary}30`,
        borderRadius: 10, padding: "10px 14px",
        fontSize: 12, color: T.textMuted,
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <span>
          Los <strong style={{ color: T.success }}>Administradores</strong> tienen acceso total.
          Los <strong style={{ color: T.warning }}>Cobradores</strong> solo ven Dashboard, Clientes, Cobros y Finanzas.
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Nombre Completo" required
            value={f.name} onChange={v => set("name", v)}
            placeholder="Ej: Juan Pérez García" />
        </div>

        <Input label="Usuario (login)" required
          value={f.username} onChange={v => set("username", v.toLowerCase().replace(/\s/g, ""))}
          placeholder="Ej: juan.perez" />

        {/* Contraseña con ojo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>
            Contraseña <span style={{ color: T.danger }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={f.password}
              onChange={e => set("password", e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{
                width: "100%", background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 8,
                padding: "8px 40px 8px 10px", color: T.text,
                fontSize: 13, fontFamily: fontSans, boxSizing: "border-box",
              }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: "absolute", right: 10, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", fontSize: 14, color: T.textMuted,
            }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <Input label="Rol del Usuario"
          value={f.role} onChange={v => set("role", v)}
          opts={[
            { value: "cobrador", label: "💳 Cobrador" },
            { value: "admin",    label: "👔 Administrador" },
          ]} />

        <Input label="Estado"
          value={f.activo ? "true" : "false"}
          onChange={v => set("activo", v === "true")}
          opts={[
            { value: "true",  label: "✅ Activo"   },
            { value: "false", label: "❌ Inactivo" },
          ]} />
      </div>

      {/* Preview */}
      {f.name && (
        <div style={{
          background: T.bg, borderRadius: 10,
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 14,
          border: `1px solid ${f.role === "admin" ? T.success : T.warning}30`,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: f.role === "admin" ? T.successDim : T.warningDim,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            {f.role === "admin" ? "👔" : "💳"}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{f.name}</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontFamily: font }}>
              @{f.username || "usuario"} ·
              <span style={{ color: f.role === "admin" ? T.success : T.warning, marginLeft: 4 }}>
                {f.role}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Chip
              label={f.activo ? "Activo" : "Inactivo"}
              color={f.activo ? T.success : T.textMuted}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>💾 Guardar Usuario</Btn>
      </div>
    </div>
  );
}

// ── CAMBIAR CONTRASEÑA ───────────────────────────────────────────
function CambiarPasswordModal({ user, onSave, onClose }) {
  const [actual,   setActual]   = useState("");
  const [nueva,    setNueva]    = useState("");
  const [confirma, setConfirma] = useState("");
  const [showA,    setShowA]    = useState(false);
  const [showN,    setShowN]    = useState(false);

  const guardar = () => {
    if (actual !== user.password) return alert("La contraseña actual es incorrecta.");
    if (nueva.length < 6)         return alert("La nueva contraseña debe tener al menos 6 caracteres.");
    if (nueva !== confirma)       return alert("Las contraseñas no coinciden.");
    onSave(nueva);
  };

  const campo = (label, val, setVal, show, setShow) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={val} onChange={e => setVal(e.target.value)}
          style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 40px 8px 10px", color: T.text, fontSize: 13, fontFamily: fontSans, boxSizing: "border-box" }} />
        <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: T.textMuted }}>
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );

  return (
    <Modal title="🔑 Cambiar Contraseña" onClose={onClose} width={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.primaryGlow, border: `1px solid ${T.primary}30`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: T.textMuted }}>
          Cambiando contraseña de <strong style={{ color: T.text }}>{user.name}</strong> (@{user.username})
        </div>
        {campo("Contraseña actual",    actual,   setActual,   showA, setShowA)}
        {campo("Nueva contraseña",     nueva,    setNueva,    showN, setShowN)}
        {campo("Confirmar contraseña", confirma, setConfirma, showN, setShowN)}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={guardar}>🔑 Cambiar contraseña</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
export default function Usuarios({ usuarios, setUsuarios, currentUser }) {
  const [modal,    setModal]    = useState(null);
  const [cambPass, setCambPass] = useState(null);

  const guardar = (f) => {
    if (modal === "new") {
      setUsuarios(us => [...us, { ...f, id: uid(), avatar: f.role === "admin" ? "👔" : "💳" }]);
    } else {
      setUsuarios(us => us.map(u =>
        u.id === modal.id
          ? { ...modal, ...f, avatar: f.role === "admin" ? "👔" : "💳" }
          : u
      ));
    }
    setModal(null);
  };

  const guardarPassword = (userId, nuevaPass) => {
    setUsuarios(us => us.map(u => u.id === userId ? { ...u, password: nuevaPass } : u));
    setCambPass(null);
    alert("✅ Contraseña actualizada correctamente.");
  };

  const toggleActivo = (u) => {
    if (u.id === currentUser.id) return alert("No puedes desactivarte a ti mismo");
    setUsuarios(us => us.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x));
  };

  const eliminar = (u) => {
    if (u.id === currentUser.id) return alert("No puedes eliminar tu propio usuario");
    if (confirm(`¿Eliminar al usuario "${u.name}"?`))
      setUsuarios(us => us.filter(x => x.id !== u.id));
  };

  const admins    = usuarios.filter(u => u.role === "admin");
  const cobradores = usuarios.filter(u => u.role === "cobrador");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            👤 Gestión de Usuarios
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            {usuarios.length} usuarios registrados en el sistema
          </p>
        </div>
        <Btn onClick={() => setModal("new")}>+ Nuevo Usuario</Btn>
      </div>

      {/* Stats rápidos */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Administradores", value: admins.length,    color: T.success, icon: "👔" },
          { label: "Cobradores",      value: cobradores.length, color: T.warning, icon: "💳" },
          { label: "Activos",         value: usuarios.filter(u => u.activo).length,   color: T.primary, icon: "✅" },
          { label: "Inactivos",       value: usuarios.filter(u => !u.activo).length,  color: T.textMuted,icon: "💤" },
        ].map(s => (
          <div key={s.label} style={{
            background: T.card, border: `1px solid ${s.color}30`,
            borderRadius: 12, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 12,
            flex: "1 1 140px",
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: font, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección Administradores */}
      {admins.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: T.success, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.success, display: "inline-block", boxShadow: `0 0 6px ${T.success}` }} />
            Administradores ({admins.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {admins.map(u => <UsuarioCard key={u.id} user={u} currentUser={currentUser} onEdit={() => setModal(u)} onToggle={() => toggleActivo(u)} onDelete={() => eliminar(u)} onCambiarPass={() => setCambPass(u)} />)}
          </div>
        </div>
      )}

      {/* Sección Cobradores */}
      {cobradores.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: T.warning, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.warning, display: "inline-block", boxShadow: `0 0 6px ${T.warning}` }} />
            Cobradores ({cobradores.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {cobradores.map(u => <UsuarioCard key={u.id} user={u} currentUser={currentUser} onEdit={() => setModal(u)} onToggle={() => toggleActivo(u)} onDelete={() => eliminar(u)} onCambiarPass={() => setCambPass(u)} />)}
          </div>
        </div>
      )}

      {/* Permisos por rol */}
      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, fontFamily: fontSans }}>
          🔐 Permisos por Rol
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: fontSans }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {["Módulo", "Administrador", "Cobrador"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { modulo: "📊 Dashboard",   admin: true,  cobrador: true  },
                { modulo: "👥 Clientes",    admin: true,  cobrador: true  },
                { modulo: "📦 Paquetes",    admin: true,  cobrador: false },
                { modulo: "💰 Cobros",      admin: true,  cobrador: true  },
                { modulo: "📈 Finanzas",    admin: true,  cobrador: true  },
                { modulo: "🔧 Reportes",    admin: true,  cobrador: false },
                { modulo: "👤 Usuarios",    admin: true,  cobrador: false },
              ].map(r => (
                <tr key={r.modulo} style={{ borderBottom: `1px solid ${T.border}30` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "9px 12px", color: T.text }}>{r.modulo}</td>
                  <td style={{ padding: "9px 12px" }}>
                    <span style={{ color: r.admin ? T.success : T.danger, fontSize: 16 }}>
                      {r.admin ? "✅" : "❌"}
                    </span>
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <span style={{ color: r.cobrador ? T.success : T.danger, fontSize: 16 }}>
                      {r.cobrador ? "✅" : "❌"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal editar/crear */}
      {modal && (
        <Modal
          title={modal === "new" ? "➕ Nuevo Usuario" : `✏️ Editar — ${modal.name}`}
          onClose={() => setModal(null)}
          width={520}
        >
          <UsuarioForm
            initial={modal !== "new" ? modal : null}
            onSave={guardar}
            onClose={() => setModal(null)}
            currentUser={currentUser}
          />
        </Modal>
      )}

      {/* Modal cambiar contraseña */}
      {cambPass && (
        <CambiarPasswordModal
          user={cambPass}
          onSave={nuevaPass => guardarPassword(cambPass.id, nuevaPass)}
          onClose={() => setCambPass(null)}
        />
      )}
    </div>
  );
}

// ── TARJETA USUARIO ──────────────────────────────────────────────
function UsuarioCard({ user, currentUser, onEdit, onToggle, onDelete, onCambiarPass }) {
  const esActual = user.id === currentUser.id;
  const color    = user.role === "admin" ? T.success : T.warning;

  return (
    <Card style={{
      padding: 18,
      borderTop: `3px solid ${color}`,
      opacity: user.activo ? 1 : 0.6,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: color + "20",
          border: `2px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {user.avatar}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <Chip label={user.activo ? "Activo" : "Inactivo"} color={user.activo ? T.success : T.textMuted} />
          {esActual && <Chip label="Tú" color={T.accent} />}
        </div>
      </div>

      {/* Info */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{user.name}</div>
        <div style={{ fontSize: 12, color: T.textMuted, fontFamily: font, marginTop: 2 }}>
          @{user.username}
        </div>
        <div style={{ fontSize: 11, color: color, fontFamily: font, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {user.role === "admin" ? "👔 Administrador" : "💳 Cobrador"}
        </div>
      </div>

      {/* Contraseña oculta */}
      <div style={{
        background: T.bg, borderRadius: 8,
        padding: "7px 10px", marginBottom: 14,
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: T.textMuted,
      }}>
        <span>Contraseña:</span>
        <span style={{ fontFamily: font, letterSpacing: 2 }}>{"•".repeat(user.password.length)}</span>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn size="sm" variant="ghost" onClick={onEdit}>✏️ Editar</Btn>
        <Btn size="sm" variant="outline" onClick={onCambiarPass}>🔑</Btn>
        {!esActual && (
          <>
            <Btn size="sm" variant={user.activo ? "warning" : "success"} onClick={onToggle}>
              {user.activo ? "⏸" : "▶"}
            </Btn>
            <Btn size="sm" variant="danger" onClick={onDelete}>🗑️</Btn>
          </>
        )}
      </div>
    </Card>
  );
}