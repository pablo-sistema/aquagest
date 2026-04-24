import { useRef, useEffect, useState } from "react";
import { T, font, fontSans, formatCurrency, periodLabel, uid, today } from "../App";
import { Card, Stat, Chip, Btn, Modal, Input, PhotoUploader } from "./Compartidos";
import { STATUS_BILL, STATUS_CLIENT } from "./Compartidos";

// ── MINI MAPA CANVAS ─────────────────────────────────────────────
function MiniMap({ points }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !points.length) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = T.bg; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = T.border+"50"; ctx.lineWidth=0.5;
    for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    const lats=points.map(p=>p.lat).filter(Boolean);
    const lngs=points.map(p=>p.lng).filter(Boolean);
    if(!lats.length) return;
    const minLat=Math.min(...lats)-0.01, maxLat=Math.max(...lats)+0.01;
    const minLng=Math.min(...lngs)-0.01, maxLng=Math.max(...lngs)+0.01;
    const toX=lng=>((lng-minLng)/(maxLng-minLng))*(W-60)+30;
    const toY=lat=>(1-(lat-minLat)/(maxLat-minLat))*(H-60)+30;
    points.forEach(p=>{
      if(!p.lat||!p.lng) return;
      const x=toX(p.lng),y=toY(p.lat);
      ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fillStyle=p.color+"18";ctx.fill();
      ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();
      ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.strokeStyle="#fff3";ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle=T.textMuted;ctx.font="9px sans-serif";ctx.textAlign="center";
      ctx.fillText(p.name?.split(" ")[0]||"",x,y-14);
    });
  },[points]);
  return <canvas ref={ref} width={700} height={200} style={{width:"100%",height:200,borderRadius:8}}/>;
}

// ── MODAL DETALLE CLIENTE ────────────────────────────────────────
function ClienteDetalle({ client, pkg, bills, onClose, onOpenMaps }) {
  const sc        = STATUS_CLIENT[client.status];
  const recibos   = bills.filter(b => b.clientId === client.id).sort((a,b)=>b.id-a.id);
  const initials  = client.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const hasPhoto  = client.photos && client.photos.length > 0;
  const [fotoIdx, setFotoIdx] = useState(0);

  return (
    <Modal title="" onClose={onClose} width={640}>
      {/* Header con foto o gradiente */}
      <div style={{
        height: 140, borderRadius: 12, marginBottom: 20,
        background: hasPhoto
          ? `url(${client.photos[fotoIdx].url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${pkg?.color||T.primary}30, ${pkg?.color||T.primary}10)`,
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "flex-end",
      }}>
        {/* Overlay */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(6,13,26,.9) 0%, transparent 50%)" }} />

        {/* Avatar si no hay foto */}
        {!hasPhoto && (
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:64, height:64, borderRadius:18,
            background:`${pkg?.color||T.primary}30`,
            border:`3px solid ${pkg?.color||T.primary}60`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, fontWeight:900, color:pkg?.color||T.primary, fontFamily:font,
          }}>
            {initials}
          </div>
        )}

        {/* Info sobre foto */}
        <div style={{ position:"relative", padding:"0 16px 14px", flex:1 }}>
          <div style={{ fontWeight:800, fontSize:18, color:"#fff", textShadow:"0 2px 8px rgba(0,0,0,.8)" }}>
            {client.name}
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.7)", marginTop:2, fontFamily:font }}>
            {client.code} · Medidor: {client.meterCode||"—"}
          </div>
        </div>

        {/* Estado */}
        <div style={{ position:"absolute", top:12, right:12 }}>
          <Chip label={sc?.label||client.status} color={sc?.color||T.textMuted} />
        </div>

        {/* Miniaturas fotos */}
        {hasPhoto && client.photos.length > 1 && (
          <div style={{
            position:"absolute", bottom:12, right:12,
            display:"flex", gap:4,
          }}>
            {client.photos.slice(0,4).map((p,i) => (
              <div key={i} onClick={()=>setFotoIdx(i)} style={{
                width:32, height:32, borderRadius:6,
                background:`url(${p.url}) center/cover`,
                border:`2px solid ${i===fotoIdx?"#fff":"transparent"}`,
                cursor:"pointer",
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* Grid de datos */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>

        {/* Datos personales */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:font, textTransform:"uppercase", letterSpacing:0.6, fontWeight:600, marginBottom:2 }}>
            👤 Datos Personales
          </div>
          {[
            ["DNI / RUC",  client.dni    || "—"],
            ["Teléfono",   client.phone  || "—"],
            ["Correo",     client.email  || "—"],
            ["Alta",       client.joinDate || "—"],
            ["Sector",     `Sector ${client.sector}`],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:`1px solid ${T.border}30` }}>
              <span style={{ color:T.textMuted }}>{k}</span>
              <span style={{ color:T.text, fontWeight:600, fontFamily:k==="DNI / RUC"?font:fontSans }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Servicio y ubicación */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:font, textTransform:"uppercase", letterSpacing:0.6, fontWeight:600, marginBottom:2 }}>
            💧 Servicio
          </div>

          {/* Paquete */}
          {pkg && (
            <div style={{
              background:T.bg, borderRadius:10, padding:"10px 12px",
              border:`1px solid ${pkg.color}30`,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <span style={{ color:pkg.color, fontWeight:700, fontSize:13 }}>● {pkg.name}</span>
              <span style={{ fontFamily:font, fontWeight:800, color:T.accent, fontSize:15 }}>
                {formatCurrency(pkg.price)}/mes
              </span>
            </div>
          )}

          {/* Dirección */}
          <div style={{ background:T.bg, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>📍 Dirección</div>
            <div style={{ fontSize:13, color:T.text, fontWeight:600, lineHeight:1.4 }}>
              {client.address}
              {client.district && <div style={{ fontSize:11, color:T.textMuted, fontWeight:400 }}>{client.district}</div>}
            </div>
          </div>

          {/* GPS */}
          {client.lat && client.lng && (
            <div style={{ background:T.bg, borderRadius:10, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:T.textMuted, marginBottom:2 }}>🛰️ Coordenadas GPS</div>
                <div style={{ fontFamily:font, fontSize:11, color:T.accent }}>
                  {parseFloat(client.lat).toFixed(4)}, {parseFloat(client.lng).toFixed(4)}
                </div>
              </div>
              <button onClick={onOpenMaps} style={{
                background:"#1A73E825", border:"1px solid #1A73E850",
                borderRadius:8, padding:"6px 12px",
                color:"#4285F4", cursor:"pointer",
                fontSize:12, fontWeight:700,
                display:"flex", alignItems:"center", gap:5,
              }}>
                🗺️ Ver en Maps
              </button>
            </div>
          )}

          {/* Sin GPS */}
          {(!client.lat || !client.lng) && (
            <button onClick={onOpenMaps} style={{
              background:"#1A73E820", border:"1px solid #1A73E840",
              borderRadius:8, padding:"8px 12px",
              color:"#4285F4", cursor:"pointer",
              fontSize:12, fontWeight:700, width:"100%",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              🗺️ Buscar dirección en Google Maps
            </button>
          )}
        </div>
      </div>

      {/* Mini mapa individual */}
      {client.lat && client.lng && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:font, textTransform:"uppercase", letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>
            🗺️ Ubicación en el Mapa
          </div>
          <MiniMap points={[{
            lat: parseFloat(client.lat),
            lng: parseFloat(client.lng),
            name: client.name,
            color: sc?.color || T.primary,
          }]} />
        </div>
      )}

      {/* Fotos del medidor */}
      {hasPhoto && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:font, textTransform:"uppercase", letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>
            📷 Fotos del Medidor ({client.photos.length})
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {client.photos.map((p,i) => (
              <img key={i} src={p.url} alt=""
                onClick={() => window.open(p.url,"_blank")}
                style={{
                  width:"calc(33% - 6px)", aspectRatio:"4/3",
                  objectFit:"cover", borderRadius:10,
                  border:`2px solid ${i===fotoIdx?pkg?.color||T.primary:T.border}`,
                  cursor:"pointer", transition:"transform .15s",
                }}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historial de recibos */}
      {recibos.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:T.textMuted, fontFamily:font, textTransform:"uppercase", letterSpacing:0.6, fontWeight:600, marginBottom:8 }}>
            💰 Historial de Recibos ({recibos.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:180, overflowY:"auto" }}>
            {recibos.map(b => {
              const sc = STATUS_BILL[b.status];
              return (
                <div key={b.id} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  background:T.bg, borderRadius:8, padding:"8px 12px",
                  border:`1px solid ${T.border}30`,
                }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text, fontFamily:font }}>{b.code}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{periodLabel(b.period)}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontFamily:font, fontWeight:700, color:T.accent, fontSize:13 }}>
                      {formatCurrency(b.total)}
                    </span>
                    <Chip label={sc?.label} color={sc?.color} bg={sc?.bg} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── TARJETA CLIENTE COMPACTA ─────────────────────────────────────
function ClienteCard({ client, pkg, bills, onClick }) {
  const sc       = STATUS_CLIENT[client.status];
  const initials = client.name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  const hasPhoto = client.photos && client.photos.length > 0;
  const lastBill = bills.filter(b=>b.clientId===client.id).sort((a,b)=>b.id-a.id)[0];
  const billSt   = lastBill ? STATUS_BILL[lastBill.status] : null;

  return (
    <Card onClick={onClick} style={{
      padding:0, overflow:"hidden",
      borderTop:`3px solid ${pkg?.color||T.border}`,
      cursor:"pointer", transition:"transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,.4)`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
    >
      {/* Imagen / Avatar */}
      <div style={{
        height:90, position:"relative",
        background: hasPhoto
          ? `url(${client.photos[0].url}) center/cover`
          : `linear-gradient(135deg,${pkg?.color||T.primary}18,${pkg?.color||T.primary}05)`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {!hasPhoto && (
          <div style={{
            width:48, height:48, borderRadius:12,
            background:`${pkg?.color||T.primary}30`,
            border:`2px solid ${pkg?.color||T.primary}50`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, fontWeight:900, color:pkg?.color||T.primary, fontFamily:font,
          }}>{initials}</div>
        )}
        {hasPhoto && <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(6,13,26,.75) 0%,transparent 55%)" }}/>}
        <div style={{ position:"absolute", top:6, left:6 }}>
          <Chip label={sc?.label||client.status} color={sc?.color||T.textMuted}/>
        </div>
        {hasPhoto && client.photos.length > 1 && (
          <div style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.5)", borderRadius:6, padding:"2px 6px", fontSize:10, color:"#fff" }}>
            📷 {client.photos.length}
          </div>
        )}
        {hasPhoto && (
          <div style={{ position:"absolute", bottom:6, left:10, right:10, fontWeight:700, fontSize:12, color:"#fff", textShadow:"0 1px 4px rgba(0,0,0,.9)" }}>
            {client.name}
          </div>
        )}
      </div>

      {/* Datos */}
      <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
        {!hasPhoto && (
          <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{client.name}</div>
        )}
        <div style={{ fontSize:10, color:T.textMuted, fontFamily:font }}>{client.code} · {client.meterCode||"Sin medidor"}</div>
        <div style={{ fontSize:11, color:T.textMuted }}>📍 {client.address}</div>
        {pkg && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:pkg.color, fontWeight:700 }}>● {pkg.name}</span>
            <span style={{ fontFamily:font, fontSize:12, fontWeight:800, color:T.accent }}>{formatCurrency(pkg.price)}/mes</span>
          </div>
        )}
        {billSt && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:4, borderTop:`1px solid ${T.border}30`, fontSize:10 }}>
            <span style={{ color:T.textMuted }}>Último recibo</span>
            <Chip label={billSt.label} color={billSt.color} bg={billSt.bg}/>
          </div>
        )}
        {/* Hint de clic */}
        <div style={{ textAlign:"center", fontSize:10, color:T.textDim, marginTop:2 }}>
          👆 Toca para ver detalles
        </div>
      </div>
    </Card>
  );
}

// ── FORM NUEVO CLIENTE RÁPIDO ────────────────────────────────────
function NuevoClienteForm({ packages, onSave, onClose }) {
  const [f,setF] = useState({
    code:`CLI-${String(uid()).padStart(3,"0")}`,
    name:"", dni:"", phone:"", email:"",
    address:"", district:"", sector:"A",
    packageId: packages[0]?.id||1,
    meterCode:"", lat:"", lng:"",
    status:"activo", joinDate:today(), photos:[],
  });
  const [locating,setLocating]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const getGPS=()=>{
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos=>{set("lat",pos.coords.latitude.toFixed(6));set("lng",pos.coords.longitude.toFixed(6));setLocating(false);},
      ()=>{alert("No se pudo obtener ubicación");setLocating(false);},
      {enableHighAccuracy:true}
    );
  };

  const guardar=()=>{
    if(!f.name.trim()) return alert("El nombre es obligatorio");
    if(!f.dni.trim())  return alert("El DNI/RUC es obligatorio");
    onSave({...f,id:uid()});
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="Código"          value={f.code}      onChange={v=>set("code",v)}/>
        <Input label="Estado"          value={f.status}    onChange={v=>set("status",v)}
          opts={[{value:"activo",label:"Activo"},{value:"moroso",label:"Moroso"},{value:"inactivo",label:"Inactivo"}]}/>
        <Input label="Nombre Completo" value={f.name}      onChange={v=>set("name",v)}      required/>
        <Input label="DNI / RUC"       value={f.dni}       onChange={v=>set("dni",v)}       required/>
        <Input label="Teléfono"        value={f.phone}     onChange={v=>set("phone",v)}/>
        <Input label="Correo"          value={f.email}     onChange={v=>set("email",v)}     type="email"/>
        <Input label="Dirección"       value={f.address}   onChange={v=>set("address",v)}   required/>
        <Input label="Distrito"        value={f.district}  onChange={v=>set("district",v)}/>
        <Input label="Sector"          value={f.sector}    onChange={v=>set("sector",v)}
          opts={["A","B","C","D","E"].map(s=>({value:s,label:`Sector ${s}`}))}/>
        <Input label="Código Medidor"  value={f.meterCode} onChange={v=>set("meterCode",v)}/>
        <Input label="Paquete"         value={f.packageId} onChange={v=>set("packageId",parseInt(v))}
          opts={packages.filter(p=>p.active).map(p=>({value:p.id,label:`${p.name} — ${formatCurrency(p.price)}/mes`}))}/>
        <Input label="Fecha Alta"      value={f.joinDate}  onChange={v=>set("joinDate",v)}  type="date"/>
      </div>

      {/* GPS */}
      <div>
        <label style={{fontSize:11,color:T.textMuted,fontFamily:font,textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,display:"block",marginBottom:6}}>
          📍 Ubicación GPS
        </label>
        <div style={{display:"flex",gap:8}}>
          <input value={f.lat} onChange={e=>set("lat",e.target.value)} placeholder="Latitud"
            style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:13,fontFamily:fontSans}}/>
          <input value={f.lng} onChange={e=>set("lng",e.target.value)} placeholder="Longitud"
            style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 10px",color:T.text,fontSize:13,fontFamily:fontSans}}/>
          <Btn variant="outline" onClick={getGPS} disabled={locating}>
            {locating?"⏳":"📡 GPS"}
          </Btn>
        </div>
        {f.lat&&f.lng&&<div style={{fontSize:11,color:T.success,marginTop:4}}>✅ Ubicación capturada: {f.lat}, {f.lng}</div>}
      </div>

      {/* Fotos */}
      <div>
        <label style={{fontSize:11,color:T.textMuted,fontFamily:font,textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,display:"block",marginBottom:6}}>
          📸 Fotos del Medidor
        </label>
        <PhotoUploader photos={f.photos} onChange={v=>set("photos",v)}/>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>💾 Guardar Cliente</Btn>
      </div>
    </div>
  );
}

// ── DASHBOARD PRINCIPAL ──────────────────────────────────────────
export default function Dashboard({ clients, bills, reports, packages, setClients }) {
  const [detalleCliente, setDetalleCliente] = useState(null);
  const [nuevoModal,     setNuevoModal]     = useState(false);

  const totalClients  = clients.length;
  const activos       = clients.filter(c=>c.status==="activo").length;
  const morosos       = clients.filter(c=>c.status==="moroso").length;
  const cortados      = clients.filter(c=>c.status==="cortado").length;
  const inactivos     = clients.filter(c=>c.status==="inactivo").length;
  const pendingBills  = bills.filter(b=>b.status==="pendiente"||b.status==="vencido");
  const periodoActual = new Date().toISOString().slice(0,7);
  const paidThisMonth = bills.filter(b=>b.status==="pagado"&&b.period===periodoActual).reduce((s,b)=>s+b.total,0);
  const pendingAmount = pendingBills.reduce((s,b)=>s+b.total,0);
  const openReports   = reports.filter(r=>r.status!=="completado").length;

  const mapPoints = clients.map(c=>({
    lat:   parseFloat(c.lat),
    lng:   parseFloat(c.lng),
    name:  c.name,
    color: c.status==="moroso" ?"#FF4757":c.status==="cortado"?"#FFB020":"#00C48C",
  }));

  const openMaps = (client) => {
    const url = client.lat && client.lng
      ? `https://www.google.com/maps?q=${client.lat},${client.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.address+", "+client.district)}`;
    window.open(url,"_blank");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>

      {/* Título */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,fontFamily:fontSans}}>📊 Panel de Control</h1>
          <p style={{margin:0,color:T.textMuted,fontSize:13}}>
            {new Date().toLocaleDateString("es-PE",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
          </p>
        </div>
        <Btn onClick={()=>setNuevoModal(true)}>+ Nuevo Cliente</Btn>
      </div>

      {/* Stats */}
      <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
        <Stat label="Clientes Totales"  value={totalClients}                  icon="👥" color={T.primary} sub={`${activos} activos · ${morosos} morosos`}/>
        <Stat label="Cobrado este mes"  value={formatCurrency(paidThisMonth)} icon="✅" color={T.success}/>
        <Stat label="Por Cobrar"        value={formatCurrency(pendingAmount)}  icon="⏳" color={T.warning} sub={`${pendingBills.length} recibos`}/>
        <Stat label="Reportes Abiertos" value={openReports}                   icon="🔧" color={T.accent}/>
      </div>

      {/* Estado clientes */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {label:"Activos",   value:activos,   color:T.success,  icon:"✅"},
          {label:"Morosos",   value:morosos,   color:T.danger,   icon:"⚠️"},
          {label:"Cortados",  value:cortados,  color:T.warning,  icon:"✂️"},
          {label:"Inactivos", value:inactivos, color:T.textMuted,icon:"💤"},
        ].map(s=>(
          <div key={s.label} style={{background:T.card,border:`1px solid ${s.color}30`,borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>{s.icon}</span>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:font,lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:T.textMuted}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recibos + Paquetes */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card style={{padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,fontFamily:fontSans,display:"flex",justifyContent:"space-between"}}>
            <span>📋 Últimos Recibos</span>
            <span style={{fontSize:11,color:T.textMuted,fontFamily:font}}>{bills.length} total</span>
          </div>
          {[...bills].reverse().slice(0,5).map(b=>{
            const c=clients.find(x=>x.id===b.clientId);
            const sc=STATUS_BILL[b.status];
            return(
              <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}40`}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.text}}>{c?.name?.split(" ").slice(0,2).join(" ")}</div>
                  <div style={{fontSize:10,color:T.textMuted}}>{b.code} · {periodLabel(b.period)}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                  <span style={{fontSize:13,fontWeight:700,color:T.accent,fontFamily:font}}>{formatCurrency(b.total)}</span>
                  <Chip label={sc?.label} color={sc?.color} bg={sc?.bg}/>
                </div>
              </div>
            );
          })}
        </Card>

        <Card style={{padding:18}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,fontFamily:fontSans}}>📦 Distribución de Paquetes</div>
          {packages.filter(p=>p.active).map(p=>{
            const count=clients.filter(c=>c.packageId===p.id).length;
            const pct=totalClients>0?(count/totalClients)*100:0;
            return(
              <div key={p.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:p.color,boxShadow:`0 0 6px ${p.color}`}}/>
                    <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:12,color:T.textMuted,fontFamily:font}}>{count} clientes</span>
                    <span style={{fontSize:11,color:T.accent,fontFamily:font,marginLeft:8}}>{formatCurrency(p.price)}</span>
                  </div>
                </div>
                <div style={{height:6,background:T.border,borderRadius:3}}>
                  <div style={{height:6,width:`${pct}%`,background:p.color,borderRadius:3,transition:"width .6s",boxShadow:`0 0 8px ${p.color}60`}}/>
                </div>
                <div style={{fontSize:10,color:T.textDim,marginTop:2}}>{pct.toFixed(0)}% del total</div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Tarjetas clientes */}
      <div>
        <div style={{fontWeight:700,fontSize:15,marginBottom:14,fontFamily:fontSans,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>👥 Clientes — <span style={{color:T.primary,fontFamily:font}}>{clients.length}</span> registrados</span>
          <span style={{fontSize:11,color:T.textMuted,fontWeight:400}}>👆 Haz clic en una tarjeta para ver todos los detalles</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
          {clients.map(c=>(
            <ClienteCard
              key={c.id}
              client={c}
              pkg={packages.find(p=>p.id===c.packageId)}
              bills={bills}
              onClick={()=>setDetalleCliente(c)}
            />
          ))}
          {/* Tarjeta agregar */}
          <div onClick={()=>setNuevoModal(true)} style={{
            background:T.card, border:`2px dashed ${T.border}`,
            borderRadius:14, cursor:"pointer",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            gap:10, minHeight:200, transition:"all .2s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.primary;e.currentTarget.style.background=T.primaryGlow;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}
          >
            <div style={{width:48,height:48,borderRadius:14,background:T.primaryGlow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>➕</div>
            <div style={{fontSize:13,fontWeight:700,color:T.primary}}>Agregar Cliente</div>
            <div style={{fontSize:11,color:T.textMuted}}>Registrar nuevo cliente</div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <Card style={{padding:18}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12,fontFamily:fontSans}}>🗺️ Mapa de Clientes</div>
        <MiniMap points={mapPoints}/>
        <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
          {[{color:"#00C48C",label:"Activo"},{color:"#FF4757",label:"Moroso"},{color:"#FFB020",label:"Cortado"}].map(l=>(
            <div key={l.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.textMuted}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:l.color}}/>{l.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Modal detalle cliente */}
      {detalleCliente && (
        <ClienteDetalle
          client={detalleCliente}
          pkg={packages.find(p=>p.id===detalleCliente.packageId)}
          bills={bills}
          onClose={()=>setDetalleCliente(null)}
          onOpenMaps={()=>openMaps(detalleCliente)}
        />
      )}

      {/* Modal nuevo cliente */}
      {nuevoModal && (
        <Modal title="➕ Nuevo Cliente" onClose={()=>setNuevoModal(false)} width={680}>
          <NuevoClienteForm
            packages={packages}
            onSave={c=>{setClients(cs=>[...cs,c]);setNuevoModal(false);}}
            onClose={()=>setNuevoModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}