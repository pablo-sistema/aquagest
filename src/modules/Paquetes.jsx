import { useState } from "react";
import { T, font, fontSans, uid, formatCurrency } from "../App";
import { Btn, Input, Modal, Chip, Card } from "./Compartidos";

// ── FORMULARIO ───────────────────────────────────────────────────
function PaqueteForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    name:        "",
    description: "",
    price:       "",
    color:       "#1A8FE3",
    active:      true,
  });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!f.name.trim()) return alert("El nombre es obligatorio");
    if (!f.price)       return alert("El precio es obligatorio");
    onSave({ ...f, price: parseFloat(f.price) || 0 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <Input label="Nombre del Paquete" required
          value={f.name} onChange={v => set("name", v)}
          placeholder="Ej: Básico, Familiar, Comercial" />

        <Input label="Precio Mensual (S/)" required
          value={f.price} onChange={v => set("price", v)}
          type="number" placeholder="Ej: 25.00" />

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Descripción"
            value={f.description} onChange={v => set("description", v)}
            placeholder="Breve descripción del paquete..." />
        </div>

        {/* Color */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{
            fontSize: 11, color: T.textMuted, fontFamily: font,
            textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600,
          }}>
            Color identificador
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="color" value={f.color}
              onChange={e => set("color", e.target.value)}
              style={{ width: 48, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, cursor: "pointer", background: "none" }} />
            <span style={{ fontSize: 12, color: T.textMuted, fontFamily: font }}>{f.color}</span>
          </div>
        </div>

        <Input label="Estado"
          value={f.active ? "true" : "false"}
          onChange={v => set("active", v === "true")}
          opts={[
            { value: "true",  label: "✅ Activo"   },
            { value: "false", label: "❌ Inactivo" },
          ]} />
      </div>

      {/* Preview en vivo */}
      {f.name && (
        <div style={{
          background: T.bg, borderRadius: 12,
          padding: "16px 20px", borderLeft: `4px solid ${f.color}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          border: `1px solid ${f.color}30`,
        }}>
          <div>
            <div style={{ fontWeight: 800, color: f.color, fontSize: 16 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
              {f.description || "Sin descripción"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: font, fontSize: 24, fontWeight: 900, color: T.text }}>
              {f.price ? formatCurrency(f.price) : "S/ 0.00"}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted }}>por mes</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>💾 Guardar Paquete</Btn>
      </div>
    </div>
  );
}

// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
export default function Paquetes({ packages, setPackages }) {
  const [modal, setModal] = useState(null);

  const guardar = (f) => {
    if (modal === "new") {
      setPackages(ps => [...ps, { ...f, id: uid() }]);
    } else {
      setPackages(ps => ps.map(p => p.id === modal.id ? { ...modal, ...f } : p));
    }
    setModal(null);
  };

  const toggleActivo = (pkg) =>
    setPackages(ps => ps.map(p => p.id === pkg.id ? { ...p, active: !p.active } : p));

  const eliminar = (pkg) => {
    if (confirm(`¿Eliminar el paquete "${pkg.name}"?`))
      setPackages(ps => ps.filter(p => p.id !== pkg.id));
  };

  const activos   = packages.filter(p =>  p.active);
  const inactivos = packages.filter(p => !p.active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            📦 Paquetes de Servicio
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            Define los precios mensuales para cada tipo de cliente
          </p>
        </div>
        <Btn onClick={() => setModal("new")}>+ Nuevo Paquete</Btn>
      </div>

      {/* Aviso */}
      <div style={{
        background: T.primaryGlow, border: `1px solid ${T.primary}30`,
        borderRadius: 10, padding: "12px 16px",
        fontSize: 13, color: T.textMuted,
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <span>
          Solo el <strong style={{ color: T.warning }}>Administrador</strong> gestiona los paquetes.
          Cada paquete tiene un <strong style={{ color: T.accent }}>precio fijo mensual</strong> que
          el cobrador usará al registrar un pago.
        </span>
      </div>

      {/* Paquetes activos */}
      {activos.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>
            ● Activos ({activos.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {activos.map(p => <PaqueteCard key={p.id} pkg={p} onEdit={() => setModal(p)} onToggle={() => toggleActivo(p)} onDelete={() => eliminar(p)} />)}
          </div>
        </div>
      )}

      {/* Paquetes inactivos */}
      {inactivos.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: T.textDim, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>
            ○ Inactivos ({inactivos.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, opacity: 0.6 }}>
            {inactivos.map(p => <PaqueteCard key={p.id} pkg={p} onEdit={() => setModal(p)} onToggle={() => toggleActivo(p)} onDelete={() => eliminar(p)} />)}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "new" ? "➕ Nuevo Paquete" : `✏️ Editar — ${modal.name}`}
          onClose={() => setModal(null)}
          width={520}
        >
          <PaqueteForm
            initial={modal !== "new" ? modal : null}
            onSave={guardar}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ── TARJETA PAQUETE ──────────────────────────────────────────────
function PaqueteCard({ pkg, onEdit, onToggle, onDelete }) {
  return (
    <Card style={{ padding: 22, borderTop: `3px solid ${pkg.color}`, position: "relative" }}>

      {/* Indicador color */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        width: 12, height: 12, borderRadius: "50%",
        background: pkg.color, boxShadow: `0 0 8px ${pkg.color}`,
      }} />

      {/* Nombre */}
      <div style={{ fontWeight: 800, fontSize: 18, color: pkg.color, fontFamily: fontSans, marginBottom: 4 }}>
        {pkg.name}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, minHeight: 18 }}>
        {pkg.description || "Sin descripción"}
      </div>

      {/* Precio destacado */}
      <div style={{
        background: T.bg, borderRadius: 12,
        padding: "14px 16px", marginBottom: 16,
        display: "flex", alignItems: "baseline", gap: 6,
      }}>
        <span style={{ fontFamily: font, fontSize: 32, fontWeight: 900, color: T.text }}>
          {formatCurrency(pkg.price)}
        </span>
        <span style={{ fontSize: 13, color: T.textMuted }}>/ mes</span>
      </div>

      {/* Estado */}
      <div style={{ marginBottom: 14 }}>
        <Chip
          label={pkg.active ? "✅ Activo" : "⏸ Inactivo"}
          color={pkg.active ? "#00C48C" : T.textMuted}
        />
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn size="sm" variant="ghost"   onClick={onEdit}>✏️ Editar</Btn>
        <Btn size="sm" variant={pkg.active ? "warning" : "success"} onClick={onToggle}>
          {pkg.active ? "⏸ Pausar" : "▶ Activar"}
        </Btn>
        <Btn size="sm" variant="danger" onClick={onDelete}>🗑️</Btn>
      </div>
    </Card>
  );
}