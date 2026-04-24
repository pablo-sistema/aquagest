import { useState } from "react";
import { T, font, fontSans, uid, today } from "../App";
import { Btn, Input, Modal, Chip, Card, PhotoUploader } from "./Compartidos";
import { TYPE_REPORT, STATUS_REPORT } from "./Compartidos";

// ── FORMULARIO REPORTE ───────────────────────────────────────────
function ReporteForm({ initial, clients, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    type:        "averia",
    status:      "pendiente",
    title:       "",
    clientId:    "",
    address:     "",
    technician:  "",
    date:        today(),
    description: "",
    lat:         "",
    lng:         "",
    photos:      [],
    priority:    "media",
  });

  const [locating, setLocating] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const getGPS = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        set("lat", pos.coords.latitude.toFixed(6));
        set("lng", pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        alert("No se pudo obtener ubicación. Activa el GPS.");
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Al seleccionar cliente, autocompletamos dirección y coords
  const onClientChange = (v) => {
    set("clientId", v);
    const c = clients.find(x => x.id === parseInt(v));
    if (c) {
      set("address", c.address);
      if (c.lat) set("lat", c.lat);
      if (c.lng) set("lng", c.lng);
    }
  };

  const guardar = () => {
    if (!f.title.trim()) return alert("El título es obligatorio");
    onSave(f);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <Input label="Tipo" value={f.type} onChange={v => set("type", v)}
          opts={Object.entries(TYPE_REPORT).map(([v, c]) => ({ value: v, label: `${c.icon} ${c.label}` }))} />

        <Input label="Prioridad" value={f.priority} onChange={v => set("priority", v)}
          opts={[
            { value: "alta",  label: "🔴 Alta"  },
            { value: "media", label: "🟡 Media" },
            { value: "baja",  label: "🟢 Baja"  },
          ]} />

        <Input label="Título" required
          value={f.title} onChange={v => set("title", v)}
          placeholder="Ej: Fuga en tubería principal" />

        <Input label="Estado" value={f.status} onChange={v => set("status", v)}
          opts={Object.entries(STATUS_REPORT).map(([v, c]) => ({ value: v, label: c.label }))} />

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Cliente Relacionado (opcional)"
            value={f.clientId} onChange={onClientChange}
            opts={[
              { value: "", label: "— Sin cliente específico —" },
              ...clients.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` })),
            ]} />
        </div>

        <Input label="Dirección"
          value={f.address} onChange={v => set("address", v)}
          placeholder="Dirección del incidente" />

        <Input label="Técnico Asignado"
          value={f.technician} onChange={v => set("technician", v)}
          placeholder="Nombre del técnico" />

        <Input label="Fecha" value={f.date} onChange={v => set("date", v)} type="date" />

        <div />

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Descripción del problema"
            value={f.description} onChange={v => set("description", v)}
            type="textarea"
            placeholder="Describe el problema con detalle..." />
        </div>
      </div>

      {/* GPS */}
      <div>
        <label style={{
          fontSize: 11, color: T.textMuted, fontFamily: font,
          textTransform: "uppercase", letterSpacing: 0.6,
          fontWeight: 600, display: "block", marginBottom: 6,
        }}>
          📍 Ubicación GPS del Incidente
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={f.lat}
            onChange={e => set("lat", e.target.value)}
            placeholder="Latitud"
            style={{
              flex: 1, background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "8px 10px", color: T.text,
              fontSize: 13, fontFamily: fontSans,
            }}
          />
          <input
            value={f.lng}
            onChange={e => set("lng", e.target.value)}
            placeholder="Longitud"
            style={{
              flex: 1, background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "8px 10px", color: T.text,
              fontSize: 13, fontFamily: fontSans,
            }}
          />
          <Btn variant="outline" onClick={getGPS} disabled={locating}>
            {locating ? "⏳ Buscando..." : "📡 Mi GPS"}
          </Btn>
        </div>
        {f.lat && f.lng && (
          <div style={{ fontSize: 11, color: T.success, marginTop: 4 }}>
            ✅ Ubicación capturada: {f.lat}, {f.lng}
          </div>
        )}
      </div>

      {/* Fotos */}
      <div>
        <label style={{
          fontSize: 11, color: T.textMuted, fontFamily: font,
          textTransform: "uppercase", letterSpacing: 0.6,
          fontWeight: 600, display: "block", marginBottom: 6,
        }}>
          📸 Fotos del Incidente
        </label>
        <PhotoUploader photos={f.photos} onChange={v => set("photos", v)} />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>💾 Guardar Reporte</Btn>
      </div>
    </div>
  );
}

// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
export default function Reportes({ reports, setReports, clients, dbReportes }) {
  const [modal,        setModal]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType,   setFilterType]   = useState("all");

  const filtered = reports.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterType   !== "all" && r.type   !== filterType)   return false;
    const q = search.toLowerCase();
    return !q
      || r.title.toLowerCase().includes(q)
      || r.address.toLowerCase().includes(q)
      || r.technician.toLowerCase().includes(q);
  });

  const guardar = async (f) => {
    try {
      if (modal === "new") {
        const nuevo = await dbReportes.create(f);
        setReports(rs => [...rs, nuevo]);
      } else {
        const actualizado = await dbReportes.update(modal.id, f);
        setReports(rs => rs.map(r => r.id === modal.id ? actualizado : r));
      }
      setModal(null);
    } catch (e) {
      console.error("Error guardando reporte:", e);
      alert("Error al guardar. Intenta de nuevo.");
    }
  };

  const cambiarEstado = async (r, status) => {
    try {
      const actualizado = await dbReportes.update(r.id, { ...r, status });
      setReports(rs => rs.map(x => x.id === r.id ? actualizado : x));
    } catch (e) {
      alert("Error al actualizar estado. Intenta de nuevo.");
    }
  };

  const eliminar = async (r) => {
    if (confirm(`¿Eliminar el reporte "${r.title}"?`)) {
      try {
        await dbReportes.delete(r.id);
        setReports(rs => rs.filter(x => x.id !== r.id));
      } catch (e) {
        alert("Error al eliminar. Intenta de nuevo.");
      }
    }
  };

  // Colores de prioridad
  const priColor = { alta: "#FF4757", media: "#FFB020", baja: "#00C48C" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            🔧 Reportes Técnicos
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            Averías, cortes, visitas y mantenimiento en campo
          </p>
        </div>
        <Btn onClick={() => setModal("new")}>+ Nuevo Reporte</Btn>
      </div>

      {/* Contadores rápidos */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Object.entries(STATUS_REPORT).map(([k, v]) => {
          const count = reports.filter(r => r.status === k).length;
          return (
            <div key={k} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer",
              borderColor: filterStatus === k ? v.color : T.border,
            }} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: v.color, boxShadow: `0 0 6px ${v.color}`,
              }} />
              <span style={{ fontSize: 12, color: T.text }}>{v.label}</span>
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: v.color, fontFamily: font,
              }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar título, dirección, técnico..."
          style={{
            flex: "1 1 220px", background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            padding: "9px 14px", color: T.text,
            fontSize: 13, fontFamily: fontSans,
          }}
        />
        {["all", ...Object.keys(TYPE_REPORT)].map(t => {
          const tc = TYPE_REPORT[t];
          return (
            <Btn
              key={t}
              size="sm"
              variant={filterType === t ? "primary" : "ghost"}
              onClick={() => setFilterType(t)}
            >
              {t === "all" ? "Todos" : `${tc.icon} ${tc.label}`}
            </Btn>
          );
        })}
      </div>

      {/* Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
        gap: 12,
      }}>
        {filtered.map(r => {
          const tc = TYPE_REPORT[r.type];
          const sc = STATUS_REPORT[r.status];
          const c  = clients.find(x => x.id === r.clientId);

          return (
            <Card key={r.id} style={{
              padding: 16,
              borderLeft: `3px solid ${tc.color}`,
              transition: "transform .15s, box-shadow .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${tc.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{tc.icon}</span>
                <Chip label={sc.label} color={sc.color} />
              </div>

              {/* Título */}
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: T.text }}>
                {r.title}
              </div>

              {/* Dirección */}
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
                📍 {r.address || "Sin dirección"}
              </div>

              {/* Cliente */}
              {c && (
                <div style={{ fontSize: 11, color: T.primary, marginBottom: 4 }}>
                  👤 {c.name}
                </div>
              )}

              {/* Descripción */}
              {r.description && (
                <div style={{
                  fontSize: 11, color: T.textMuted,
                  marginBottom: 8, lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {r.description}
                </div>
              )}

              {/* Footer */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, color: T.textMuted, marginBottom: 10,
              }}>
                <span>👷 {r.technician || "Sin asignar"}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span>📅 {r.date}</span>
                  <span style={{ color: priColor[r.priority] }}>
                    ● {r.priority}
                  </span>
                </div>
              </div>

              {/* Fotos */}
              {r.photos?.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                  {r.photos.slice(0, 3).map((p, i) => (
                    <img key={i} src={p.url} alt=""
                      style={{
                        width: 48, height: 48,
                        objectFit: "cover", borderRadius: 6,
                        border: `1px solid ${T.border}`,
                      }} />
                  ))}
                  {r.photos.length > 3 && (
                    <div style={{
                      width: 48, height: 48, borderRadius: 6,
                      background: T.surface, border: `1px solid ${T.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: T.textMuted,
                    }}>
                      +{r.photos.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {r.status === "pendiente" && (
                  <Btn size="sm" variant="warning"
                    onClick={() => cambiarEstado(r, "en-progreso")}>
                    ▶ Iniciar
                  </Btn>
                )}
                {r.status === "en-progreso" && (
                  <Btn size="sm" variant="success"
                    onClick={() => cambiarEstado(r, "completado")}>
                    ✓ Completar
                  </Btn>
                )}
                <Btn size="sm" variant="ghost" onClick={() => setModal(r)}>✏️ Editar</Btn>
                <Btn size="sm" variant="danger" onClick={() => eliminar(r)}>🗑️</Btn>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            gridColumn: "span 3",
            textAlign: "center", padding: 50,
            color: T.textMuted,
          }}>
            No se encontraron reportes
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "new" ? "➕ Nuevo Reporte" : `✏️ ${modal.title}`}
          onClose={() => setModal(null)}
          width={700}
        >
          <ReporteForm
            initial={modal !== "new" ? modal : null}
            clients={clients}
            onSave={guardar}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}