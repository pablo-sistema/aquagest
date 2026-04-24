import { useState, useRef } from "react";
import { T, font, fontSans, today } from "../App";
import { Btn, Input, Card } from "./Compartidos";

export const CONFIG_KEY   = "aquagest_config";
export const defaultConfig = {
  empresa:   "Sistema de Agua Potable",
  ruc:       "20000000000",
  direccion: "",
  telefono:  "",
  email:     "",
};

export default function Configuracion({
  config, onUpdateConfig,
  clients, packages, bills, gastos, reports, usuarios,
  onRestoreBackup,
}) {
  const [form,    setForm]    = useState({ ...config });
  const [tab,     setTab]     = useState("empresa");
  const [guardado,setGuardado]= useState(false);
  const restoreRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = () => {
    onUpdateConfig(form);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  // ── BACKUP ──
  const exportarBackup = () => {
    const data = {
      version:  "2.0",
      fecha:    today(),
      config,
      clientes: clients,
      paquetes: packages,
      recibos:  bills,
      gastos,
      reportes: reports,
      usuarios,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `aquagest-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importarBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) throw new Error("Formato inválido");
        if (confirm(
          `¿Restaurar backup del ${data.fecha}?\n` +
          `Clientes: ${data.clientes?.length ?? 0} | ` +
          `Recibos: ${data.recibos?.length ?? 0} | ` +
          `Gastos: ${data.gastos?.length ?? 0}\n\n` +
          `Esto reemplazará todos los datos actuales.`
        )) {
          onRestoreBackup(data);
          alert("✅ Backup restaurado correctamente.");
        }
      } catch {
        alert("❌ Archivo de backup inválido o corrupto.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: "empresa",  label: "🏢 Empresa"  },
    { id: "backup",   label: "💾 Backup"   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Encabezado */}
      <div>
        <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
          ⚙️ Configuración
        </h1>
        <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
          Datos de la empresa y gestión del sistema
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "transparent", border: "none",
            borderBottom: tab === t.id ? `2px solid ${T.primary}` : "2px solid transparent",
            padding: "10px 16px", marginBottom: -1,
            color: tab === t.id ? T.primary : T.textMuted,
            cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
            fontFamily: fontSans,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB EMPRESA ── */}
      {tab === "empresa" && (
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, fontFamily: fontSans }}>
            🏢 Datos de la Empresa
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div style={{ gridColumn: "span 2" }}>
              <Input label="Nombre de la Empresa" required
                value={form.empresa} onChange={v => set("empresa", v)}
                placeholder="Ej: Junta de Agua Potable San José" />
            </div>

            <Input label="RUC / DNI"
              value={form.ruc} onChange={v => set("ruc", v)}
              placeholder="Ej: 20512345678" />

            <Input label="Teléfono"
              value={form.telefono} onChange={v => set("telefono", v)}
              placeholder="Ej: 01-234-5678" />

            <div style={{ gridColumn: "span 2" }}>
              <Input label="Dirección"
                value={form.direccion} onChange={v => set("direccion", v)}
                placeholder="Ej: Jr. Las Flores 123, Lima" />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <Input label="Correo Electrónico"
                value={form.email} onChange={v => set("email", v)}
                type="email" placeholder="Ej: contacto@aguasanjose.pe" />
            </div>
          </div>

          {/* Preview ticket */}
          {form.empresa && (
            <div style={{
              marginTop: 20, background: T.bg, borderRadius: 12,
              padding: "16px 20px", border: `1px solid ${T.border}`,
              fontFamily: "'Courier New', monospace", fontSize: 12,
            }}>
              <div style={{ fontWeight: 900, fontSize: 14, textAlign: "center" }}>💧 {form.empresa}</div>
              {form.direccion && <div style={{ color: T.textMuted, textAlign: "center" }}>{form.direccion}</div>}
              {form.ruc && <div style={{ color: T.textMuted, textAlign: "center" }}>RUC: {form.ruc}</div>}
              {form.telefono && <div style={{ color: T.textMuted, textAlign: "center" }}>Tel: {form.telefono}</div>}
              <div style={{ borderTop: `1px dashed ${T.border}`, marginTop: 8, paddingTop: 8, color: T.textDim, textAlign: "center", fontSize: 10 }}>
                Vista previa del encabezado en tickets
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={guardar}>
              {guardado ? "✅ Guardado" : "💾 Guardar Configuración"}
            </Btn>
          </div>
        </Card>
      )}

      {/* ── TAB BACKUP ── */}
      {tab === "backup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Exportar */}
          <Card style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, fontFamily: fontSans }}>
              📤 Exportar Backup
            </div>
            <p style={{ margin: "0 0 16px", color: T.textMuted, fontSize: 13 }}>
              Descarga todos los datos del sistema en un archivo JSON.
              Guárdalo en un lugar seguro como respaldo.
            </p>
            <div style={{
              display: "flex", gap: 20, flexWrap: "wrap",
              background: T.bg, borderRadius: 10, padding: "14px 18px",
              marginBottom: 16, border: `1px solid ${T.border}`,
            }}>
              {[
                ["👥 Clientes",  clients.length],
                ["📦 Paquetes",  packages.length],
                ["💰 Recibos",   bills.length],
                ["💸 Gastos",    gastos.length],
                ["🔧 Reportes",  reports.length],
                ["👤 Usuarios",  usuarios.length],
              ].map(([label, n]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.accent, fontFamily: font }}>{n}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{label}</div>
                </div>
              ))}
            </div>
            <Btn onClick={exportarBackup}>
              📥 Descargar Backup — {today()}
            </Btn>
          </Card>

          {/* Restaurar */}
          <Card style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, fontFamily: fontSans }}>
              📂 Restaurar Backup
            </div>
            <div style={{
              background: T.dangerDim, border: `1px solid ${T.danger}40`,
              borderRadius: 10, padding: "12px 16px",
              fontSize: 13, color: T.danger, marginBottom: 16,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span>
                Esta acción <strong>reemplazará todos los datos actuales</strong>.
                Solo úsala si quieres restaurar un estado anterior del sistema.
              </span>
            </div>
            <input
              ref={restoreRef} type="file" accept=".json"
              style={{ display: "none" }} onChange={importarBackup}
            />
            <Btn variant="danger" onClick={() => restoreRef.current.click()}>
              📂 Seleccionar archivo de backup...
            </Btn>
          </Card>
        </div>
      )}
    </div>
  );
}
